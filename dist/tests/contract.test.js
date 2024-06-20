"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const o1js_1 = require("o1js");
const zkcloudworker_1 = require("zkcloudworker");
const __1 = require("..");
const contract_1 = require("../src/contract");
const config_1 = require("./config");
const package_json_1 = __importDefault(require("../package.json"));
const ONE_ELEMENTS_NUMBER = 1;
const MANY_ELEMENTS_NUMBER = 1;
const MANY_BATCH_SIZE = 3;
(0, o1js_1.setNumberOfWorkers)(8);
const { name: repo, author: developer } = package_json_1.default;
const { chain, compile, deploy, one, many, send, files, useLocalCloudWorker } = processArguments();
const api = new zkcloudworker_1.zkCloudWorkerClient({
    jwt: useLocalCloudWorker ? "local" : config_1.JWT,
    zkcloudworker: __1.zkcloudworker,
    chain,
});
let deployer;
let sender;
const oneValues = [];
const manyValues = [];
const contractPrivateKey = config_1.contract.contractPrivateKey;
const contractPublicKey = contractPrivateKey.toPublicKey();
const zkApp = new contract_1.AddContract(contractPublicKey);
let programVerificationKey;
let contractVerificationKey;
let blockchainInitialized = false;
(0, globals_1.describe)("Add Worker", () => {
    (0, globals_1.it)(`should prepare data`, async () => {
        console.log("Preparing data...");
        console.time(`prepared data`);
        for (let i = 0; i < ONE_ELEMENTS_NUMBER; i++) {
            oneValues.push(1 + Math.floor(Math.random() * (contract_1.limit - 2)));
        }
        for (let i = 0; i < MANY_ELEMENTS_NUMBER; i++) {
            const values = [];
            for (let j = 0; j < MANY_BATCH_SIZE; j++) {
                values.push(1 + Math.floor(Math.random() * (contract_1.limit - 2)));
            }
            manyValues.push(values);
        }
        console.timeEnd(`prepared data`);
    });
    (0, globals_1.it)(`should initialize blockchain`, async () => {
        (0, globals_1.expect)(contractPrivateKey).toBeDefined();
        (0, globals_1.expect)(contractPrivateKey.toPublicKey().toBase58()).toBe(contractPublicKey.toBase58());
        zkcloudworker_1.Memory.info("initializing blockchain");
        if (chain === "local" || chain === "lightnet") {
            console.log("local chain:", chain);
            const { keys } = await (0, zkcloudworker_1.initBlockchain)(chain, 2);
            (0, globals_1.expect)(keys.length).toBeGreaterThanOrEqual(2);
            if (keys.length < 2)
                throw new Error("Invalid keys");
            deployer = keys[0].key;
        }
        else {
            console.log("non-local chain:", chain);
            await (0, zkcloudworker_1.initBlockchain)(chain);
            deployer = o1js_1.PrivateKey.fromBase58(config_1.DEPLOYER);
        }
        process.env.DEPLOYER_PRIVATE_KEY = deployer.toBase58();
        process.env.DEPLOYER_PUBLIC_KEY = deployer.toPublicKey().toBase58();
        console.log("contract address:", contractPublicKey.toBase58());
        sender = deployer.toPublicKey();
        console.log("sender:", sender.toBase58());
        console.log("Sender balance:", await (0, zkcloudworker_1.accountBalanceMina)(sender));
        (0, globals_1.expect)(deployer).toBeDefined();
        (0, globals_1.expect)(sender).toBeDefined();
        (0, globals_1.expect)(deployer.toPublicKey().toBase58()).toBe(sender.toBase58());
        zkcloudworker_1.Memory.info("blockchain initialized");
        blockchainInitialized = true;
    });
    if (compile) {
        (0, globals_1.it)(`should compile contract`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.log("Analyzing contracts methods...");
            console.time("methods analyzed");
            const methods = [
                {
                    name: "AddProgram",
                    result: await contract_1.AddProgram.analyzeMethods(),
                    skip: true,
                },
                { name: "AddContract", result: await contract_1.AddContract.analyzeMethods() },
            ];
            console.timeEnd("methods analyzed");
            const maxRows = 2 ** 16;
            for (const contract of methods) {
                // calculate the size of the contract - the sum or rows for each method
                const size = Object.values(contract.result).reduce((acc, method) => acc + method.rows, 0);
                // calculate percentage rounded to 0 decimal places
                const percentage = Math.round(((size * 100) / maxRows) * 100) / 100;
                console.log(`method's total size for a ${contract.name} is ${size} rows (${percentage}% of max ${maxRows} rows)`);
                if (contract.skip !== true)
                    for (const method in contract.result) {
                        console.log(method, `rows:`, contract.result[method].rows);
                    }
            }
            console.time("compiled");
            console.log("Compiling contracts...");
            const cache = o1js_1.Cache.FileSystem("./cache");
            console.time("AddProgram compiled");
            programVerificationKey = (await contract_1.AddProgram.compile({ cache }))
                .verificationKey;
            console.timeEnd("AddProgram compiled");
            console.time("AddContract compiled");
            contractVerificationKey = (await contract_1.AddContract.compile({ cache }))
                .verificationKey;
            console.timeEnd("AddContract compiled");
            console.timeEnd("compiled");
            console.log("AddContract verification key", contractVerificationKey.hash.toJSON());
            console.log("AddProgram verification key", programVerificationKey.hash.toJSON());
            zkcloudworker_1.Memory.info("compiled");
        });
    }
    if (deploy) {
        (0, globals_1.it)(`should deploy contract`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.log(`Deploying contract...`);
            await (0, zkcloudworker_1.fetchMinaAccount)({ publicKey: sender, force: true });
            const tx = await o1js_1.Mina.transaction({ sender, fee: await (0, zkcloudworker_1.fee)(), memo: "deploy" }, async () => {
                o1js_1.AccountUpdate.fundNewAccount(sender);
                await zkApp.deploy({});
                zkApp.account.zkappUri.set("https://zkcloudworker.com");
            });
            tx.sign([deployer, contractPrivateKey]);
            await sendTx(tx, "deploy");
            zkcloudworker_1.Memory.info("deployed");
        });
    }
    if (send) {
        (0, globals_1.it)(`should send first one tx`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.log(`Sending first one tx...`);
            await (0, zkcloudworker_1.fetchMinaAccount)({ publicKey: sender, force: true });
            await (0, zkcloudworker_1.fetchMinaAccount)({ publicKey: contractPublicKey, force: true });
            const addValue = new contract_1.AddValue({
                value: o1js_1.UInt64.from(100),
                limit: o1js_1.UInt64.from(contract_1.limit),
            });
            const privateKey = o1js_1.PrivateKey.random();
            const address = privateKey.toPublicKey();
            const tx = await o1js_1.Mina.transaction({ sender, fee: await (0, zkcloudworker_1.fee)(), memo: "one tx" }, async () => {
                o1js_1.AccountUpdate.fundNewAccount(sender);
                await zkApp.addOne(address, addValue);
            });
            await tx.prove();
            tx.sign([deployer, privateKey]);
            await sendTx(tx, "first one tx");
            zkcloudworker_1.Memory.info("first one tx sent");
            await (0, zkcloudworker_1.sleep)(10000);
        });
    }
    if (one) {
        (0, globals_1.it)(`should send one transactions`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.time(`One txs sent`);
            for (let i = 0; i < ONE_ELEMENTS_NUMBER; i++) {
                console.log(`Sending one tx ${i + 1}/${ONE_ELEMENTS_NUMBER}...`);
                const answer = await api.execute({
                    developer,
                    repo,
                    transactions: [],
                    task: "one",
                    args: JSON.stringify({
                        contractAddress: contractPublicKey.toBase58(),
                        isMany: false,
                        addValue: (0, zkcloudworker_1.serializeFields)(contract_1.AddValue.toFields(new contract_1.AddValue({
                            value: o1js_1.UInt64.from(oneValues[i]),
                            limit: o1js_1.UInt64.from(contract_1.limit),
                        }))),
                    }),
                    metadata: `one`,
                });
                console.log("answer:", answer);
                (0, globals_1.expect)(answer).toBeDefined();
                (0, globals_1.expect)(answer.success).toBe(true);
                const jobId = answer.jobId;
                (0, globals_1.expect)(jobId).toBeDefined();
                if (jobId === undefined)
                    throw new Error("Job ID is undefined");
                const oneResult = await api.waitForJobResult({
                    jobId,
                    printLogs: true,
                });
                console.log("One result:", oneResult.result.result);
            }
            console.timeEnd(`One txs sent`);
            zkcloudworker_1.Memory.info(`One txs sent`);
        });
    }
    if (many) {
        (0, globals_1.it)(`should send transactions with recursive proofs`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.time(`Many txs sent`);
            for (let i = 0; i < MANY_ELEMENTS_NUMBER; i++) {
                console.log(`Sending many tx ${i + 1}/${MANY_ELEMENTS_NUMBER}...`);
                const transactions = [];
                for (let j = 0; j < MANY_BATCH_SIZE; j++) {
                    transactions.push(JSON.stringify({
                        addValue: (0, zkcloudworker_1.serializeFields)(contract_1.AddValue.toFields(new contract_1.AddValue({
                            value: o1js_1.UInt64.from(manyValues[i][j]),
                            limit: o1js_1.UInt64.from(contract_1.limit),
                        }))),
                    }));
                }
                const proofAnswer = await api.recursiveProof({
                    developer,
                    repo,
                    transactions,
                    task: "proof",
                    args: JSON.stringify({
                        contractAddress: contractPublicKey.toBase58(),
                    }),
                    metadata: `proof`,
                });
                console.log("proof answer:", proofAnswer);
                (0, globals_1.expect)(proofAnswer).toBeDefined();
                (0, globals_1.expect)(proofAnswer.success).toBe(true);
                let jobId = proofAnswer.jobId;
                (0, globals_1.expect)(jobId).toBeDefined();
                if (jobId === undefined)
                    throw new Error("Job ID is undefined");
                const proofResult = await api.waitForJobResult({
                    jobId,
                    printLogs: true,
                });
                //console.log("Proof result", proofResult);
                (0, globals_1.expect)(proofResult).toBeDefined();
                (0, globals_1.expect)(proofResult.success).toBe(true);
                (0, globals_1.expect)(proofResult.result).toBeDefined();
                const proof = proofResult.result.result;
                const verifyAnswer = await api.execute({
                    developer,
                    repo,
                    transactions: [],
                    task: "verifyProof",
                    args: JSON.stringify({
                        contractAddress: contractPublicKey.toBase58(),
                        proof,
                    }),
                    metadata: `verify proof`,
                });
                console.log("verifyAnswer:", verifyAnswer);
                (0, globals_1.expect)(verifyAnswer).toBeDefined();
                (0, globals_1.expect)(verifyAnswer.success).toBe(true);
                jobId = verifyAnswer.jobId;
                (0, globals_1.expect)(jobId).toBeDefined();
                if (jobId === undefined)
                    throw new Error("Job ID is undefined");
                const verifyResult = await api.waitForJobResult({
                    jobId,
                    printLogs: true,
                });
                console.log("Verify result:", verifyResult.result.result);
                const answer = await api.execute({
                    developer,
                    repo,
                    transactions: [],
                    task: "many",
                    args: JSON.stringify({
                        contractAddress: contractPublicKey.toBase58(),
                        isMany: true,
                        proof,
                    }),
                    metadata: `many`,
                });
                console.log("answer:", answer);
                (0, globals_1.expect)(answer).toBeDefined();
                (0, globals_1.expect)(answer.success).toBe(true);
                jobId = answer.jobId;
                (0, globals_1.expect)(jobId).toBeDefined();
                if (jobId === undefined)
                    throw new Error("Job ID is undefined");
                const manyResult = await api.waitForJobResult({
                    jobId,
                    printLogs: true,
                });
                console.log("Many result:", manyResult.result.result);
            }
            console.timeEnd(`Many txs sent`);
            zkcloudworker_1.Memory.info(`Many txs sent`);
        });
    }
    if (files) {
        (0, globals_1.it)(`should save and get files`, async () => {
            (0, globals_1.expect)(blockchainInitialized).toBe(true);
            console.time(`One txs sent`);
            const answer = await api.execute({
                developer,
                repo,
                transactions: [],
                task: "files",
                args: JSON.stringify({
                    contractAddress: contractPublicKey.toBase58(),
                    text: "Hello, World!",
                }),
                metadata: `files`,
            });
            console.log("answer:", answer);
            (0, globals_1.expect)(answer).toBeDefined();
            (0, globals_1.expect)(answer.success).toBe(true);
            const jobId = answer.jobId;
            (0, globals_1.expect)(jobId).toBeDefined();
            if (jobId === undefined)
                throw new Error("Job ID is undefined");
            const filesResult = await api.waitForJobResult({
                jobId,
                printLogs: true,
            });
            console.log("Files test result:", filesResult.result.result);
        });
    }
});
function processArguments() {
    function getArgument(arg) {
        const argument = process.argv.find((a) => a.startsWith("--" + arg));
        return argument?.split("=")[1];
    }
    const chainName = getArgument("chain") ?? "local";
    const shouldDeploy = getArgument("deploy") ?? "true";
    const compile = getArgument("compile");
    const one = getArgument("one") ?? "true";
    const many = getArgument("many") ?? "true";
    const send = getArgument("send") ?? "false";
    const files = getArgument("files") ?? "false";
    const cloud = getArgument("cloud");
    if (chainName !== "local" &&
        chainName !== "devnet" &&
        chainName !== "lightnet" &&
        chainName !== "zeko")
        throw new Error("Invalid chain name");
    return {
        chain: chainName,
        compile: compile === "true" || shouldDeploy === "true" || send === "true",
        deploy: shouldDeploy === "true",
        one: one === "true",
        many: many === "true",
        send: send === "true",
        files: files === "true",
        useLocalCloudWorker: cloud
            ? cloud === "local"
            : chainName === "local" || chainName === "lightnet",
    };
}
async function sendTx(tx, description) {
    try {
        let txSent;
        let sent = false;
        while (!sent) {
            txSent = await tx.safeSend();
            if (txSent.status == "pending") {
                sent = true;
                console.log(`${description ?? ""} tx sent: hash: ${txSent.hash} status: ${txSent.status}`);
            }
            else if (chain === "zeko") {
                console.log("Retrying Zeko tx");
                await (0, zkcloudworker_1.sleep)(10000);
            }
            else {
                console.log(`${description ?? ""} tx NOT sent: hash: ${txSent?.hash} status: ${txSent?.status}`);
                return "Error sending transaction";
            }
        }
        if (txSent === undefined)
            throw new Error("txSent is undefined");
        if (txSent.errors.length > 0) {
            console.error(`${description ?? ""} tx error: hash: ${txSent.hash} status: ${txSent.status}  errors: ${txSent.errors}`);
        }
        if (txSent.status === "pending") {
            console.log(`Waiting for tx inclusion...`);
            const txIncluded = await txSent.safeWait();
            console.log(`${description ?? ""} tx included into block: hash: ${txIncluded.hash} status: ${txIncluded.status}`);
        }
    }
    catch (error) {
        if (chain !== "zeko")
            console.error("Error sending tx", error);
    }
    if (chain !== "local")
        await (0, zkcloudworker_1.sleep)(10000);
}
