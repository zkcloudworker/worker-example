"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorker = void 0;
const zkcloudworker_1 = require("zkcloudworker");
const o1js_1 = require("o1js");
const contract_1 = require("./contract");
class AddWorker extends zkcloudworker_1.zkCloudWorker {
    constructor(cloud) {
        super(cloud);
        this.cache = o1js_1.Cache.FileSystem(this.cloud.cache);
    }
    async compile(compileSmartContracts = true) {
        try {
            console.time("compiled");
            if (AddWorker.programVerificationKey === undefined) {
                console.time("compiled AddProgram");
                AddWorker.programVerificationKey = (await contract_1.AddProgram.compile({
                    cache: this.cache,
                })).verificationKey;
                console.timeEnd("compiled AddProgram");
            }
            if (compileSmartContracts === false) {
                console.timeEnd("compiled");
                return;
            }
            if (AddWorker.contractVerificationKey === undefined) {
                console.time("compiled AddContract");
                AddWorker.contractVerificationKey = (await contract_1.AddContract.compile({
                    cache: this.cache,
                })).verificationKey;
                console.timeEnd("compiled AddContract");
            }
            console.timeEnd("compiled");
        }
        catch (error) {
            console.error("Error in compile, restarting container", error);
            // Restarting the container, see https://github.com/o1-labs/o1js/issues/1651
            await this.cloud.forceWorkerRestart();
            throw error;
        }
    }
    async create(transaction) {
        const msg = `proof created`;
        console.time(msg);
        const args = JSON.parse(transaction);
        const addValue = contract_1.AddValue.fromFields((0, zkcloudworker_1.deserializeFields)(args.addValue));
        await this.compile(false);
        if (AddWorker.programVerificationKey === undefined)
            throw new Error("verificationKey is undefined");
        const output = await contract_1.AddProgram.create(addValue);
        console.timeEnd(msg);
        return JSON.stringify(output.proof.toJSON(), null, 2);
    }
    async merge(proof1, proof2) {
        const msg = `proof merged`;
        console.time(msg);
        await this.compile(false);
        if (AddWorker.programVerificationKey === undefined)
            throw new Error("verificationKey is undefined");
        const sourceProof1 = await contract_1.AddProgramProof.fromJSON(JSON.parse(proof1));
        const sourceProof2 = await contract_1.AddProgramProof.fromJSON(JSON.parse(proof2));
        const output = await contract_1.AddProgram.merge(sourceProof1, sourceProof2);
        const ok = await (0, o1js_1.verify)(output.proof.toJSON(), AddWorker.programVerificationKey);
        if (!ok)
            throw new Error("proof verification failed");
        console.timeEnd(msg);
        return JSON.stringify(output.proof.toJSON(), null, 2);
    }
    async execute(transactions) {
        if (this.cloud.args === undefined)
            throw new Error("this.cloud.args is undefined");
        const args = JSON.parse(this.cloud.args);
        //console.log("args", args);
        if (args.contractAddress === undefined)
            throw new Error("args.contractAddress is undefined");
        switch (this.cloud.task) {
            case "one":
                return await this.sendTx({ ...args, isMany: false });
            case "many":
                return await this.sendTx({ ...args, isMany: true });
            case "verifyProof":
                return await this.verifyProof(args);
            case "files":
                return await this.files(args);
            case "encrypt":
                return await this.encrypt(args);
            case "decrypt":
                return await this.decrypt(args);
            default:
                throw new Error(`Unknown task: ${this.cloud.task}`);
        }
    }
    async verifyProof(args) {
        if (args.proof === undefined)
            throw new Error("args.proof is undefined");
        const proof = (await contract_1.AddProgramProof.fromJSON(JSON.parse(args.proof)));
        await this.compile(false);
        if (AddWorker.programVerificationKey === undefined)
            throw new Error("verificationKey is undefined");
        const ok = await (0, o1js_1.verify)(proof, AddWorker.programVerificationKey);
        if (ok)
            return "Proof verified";
        else
            return "Proof verification failed";
    }
    async files(args) {
        console.log("files test", args);
        if (args.text === undefined)
            throw new Error("args.text is undefined");
        const str = args.text;
        const buf = Buffer.from(str);
        await this.cloud.saveFile("text.txt", buf);
        const buf2 = await this.cloud.loadFile("text.txt");
        if (buf2 === undefined)
            return "Error loading file";
        const str2 = buf2.toString();
        if (str === str2)
            return "Files test is passed";
        else {
            console.log("Files are different", { str2, buf2 });
            return "Files are different";
        }
    }
    async encrypt(args) {
        console.log("encrypt", args);
        const { text, contractAddress } = args;
        if (text === undefined)
            throw new Error("args.text is undefined");
        if (contractAddress === undefined)
            throw new Error("args.contractAddress is undefined");
        return ((await this.cloud.encrypt({ data: text, context: contractAddress })) ??
            "Error encrypting");
    }
    async decrypt(args) {
        console.log("decrypt", args);
        const { text, contractAddress } = args;
        if (text === undefined)
            throw new Error("args.text is undefined");
        if (contractAddress === undefined)
            throw new Error("args.contractAddress is undefined");
        return ((await this.cloud.decrypt({ data: text, context: contractAddress })) ??
            "Error decrypting");
    }
    async sendTx(args) {
        if (args.isMany === undefined)
            throw new Error("args.isMany is undefined");
        const isMany = args.isMany;
        console.log("isMany:", isMany);
        if (isMany) {
            if (args.proof === undefined)
                throw new Error("args.proof is undefined");
        }
        else {
            if (args.addValue === undefined)
                throw new Error("args.addValue is undefined");
        }
        const privateKey = o1js_1.PrivateKey.random();
        const address = privateKey.toPublicKey();
        console.log("Address", address.toBase58());
        const contractAddress = o1js_1.PublicKey.fromBase58(args.contractAddress);
        const zkApp = new contract_1.AddContract(contractAddress);
        console.log(`Sending tx...`);
        console.time("prepared tx");
        const memo = isMany ? "many" : "one";
        const deployerKeyPair = await this.cloud.getDeployer();
        if (deployerKeyPair === undefined)
            throw new Error("deployerKeyPair is undefined");
        const deployer = o1js_1.PrivateKey.fromBase58(deployerKeyPair.privateKey);
        console.log("cloud deployer:", deployer.toPublicKey().toBase58());
        if (deployer === undefined)
            throw new Error("deployer is undefined");
        const sender = deployer.toPublicKey();
        await (0, zkcloudworker_1.fetchMinaAccount)({
            publicKey: contractAddress,
            force: true,
        });
        await (0, zkcloudworker_1.fetchMinaAccount)({
            publicKey: sender,
            force: true,
        });
        console.log("sender:", sender.toBase58());
        console.log("Sender balance:", await (0, zkcloudworker_1.accountBalanceMina)(sender));
        await this.compile();
        let tx;
        let value;
        let limit;
        if (isMany) {
            const proof = (await contract_1.AddProgramProof.fromJSON(JSON.parse(args.proof)));
            value = proof.publicOutput.value.toJSON();
            limit = proof.publicOutput.limit.toJSON();
            tx = await o1js_1.Mina.transaction({ sender, fee: await (0, zkcloudworker_1.fee)(), memo }, async () => {
                o1js_1.AccountUpdate.fundNewAccount(sender);
                await zkApp.addMany(address, proof);
            });
        }
        else {
            const addValue = contract_1.AddValue.fromFields((0, zkcloudworker_1.deserializeFields)(args.addValue));
            console.log("addValue:", {
                value: addValue.value.toJSON(),
                limit: addValue.limit.toJSON(),
            });
            value = addValue.value.toJSON();
            limit = addValue.limit.toJSON();
            tx = await o1js_1.Mina.transaction({ sender, fee: await (0, zkcloudworker_1.fee)(), memo }, async () => {
                o1js_1.AccountUpdate.fundNewAccount(sender);
                await zkApp.addOne(address, addValue);
            });
        }
        if (tx === undefined)
            throw new Error("tx is undefined");
        await tx.prove();
        tx.sign([deployer, privateKey]);
        try {
            await tx.prove();
            console.timeEnd("prepared tx");
            let txSent;
            let sent = false;
            while (!sent) {
                txSent = await tx.safeSend();
                if (txSent.status == "pending") {
                    sent = true;
                    console.log(`${memo} tx sent: hash: ${txSent.hash} status: ${txSent.status}`);
                }
                else if (this.cloud.chain === "zeko") {
                    console.log("Retrying Zeko tx");
                    await (0, zkcloudworker_1.sleep)(10000);
                }
                else {
                    console.log(`${memo} tx NOT sent: hash: ${txSent?.hash} status: ${txSent?.status} errors: ${txSent.errors.join(", ")}`);
                    return "Error sending transaction";
                }
            }
            if (this.cloud.isLocalCloud && txSent?.status === "pending") {
                const txIncluded = await txSent.safeWait();
                console.log(`one tx included into block: hash: ${txIncluded.hash} status: ${txIncluded.status}`);
                await this.cloud.releaseDeployer({
                    publicKey: deployerKeyPair.publicKey,
                    txsHashes: [txIncluded.hash],
                });
                return txIncluded.hash;
            }
            await this.cloud.releaseDeployer({
                publicKey: deployerKeyPair.publicKey,
                txsHashes: txSent?.hash ? [txSent.hash] : [],
            });
            if (txSent?.hash)
                this.cloud.publishTransactionMetadata({
                    txId: txSent?.hash,
                    metadata: {
                        method: isMany ? "addMany" : "addOne",
                        value,
                        limit,
                    },
                });
            return txSent?.hash ?? "Error sending transaction";
        }
        catch (error) {
            console.error("Error sending transaction", error);
            return "Error sending transaction";
        }
    }
}
exports.AddWorker = AddWorker;
AddWorker.programVerificationKey = undefined;
AddWorker.contractVerificationKey = undefined;
