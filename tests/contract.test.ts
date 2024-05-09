import { describe, expect, it } from "@jest/globals";
import {
  PrivateKey,
  Mina,
  AccountUpdate,
  VerificationKey,
  UInt64,
  Cache,
  PublicKey,
} from "o1js";

import {
  zkCloudWorkerClient,
  blockchain,
  sleep,
  Memory,
  fetchMinaAccount,
  fee,
  initBlockchain,
  serializeFields,
  accountBalanceMina,
} from "zkcloudworker";
import { zkcloudworker } from "../src/worker";
import { AddContract, AddProgram, limit, AddValue } from "../src/contract";
import { contract, JWT, DEPLOYER } from "./config";
import packageJson from "../package.json";
const repo = packageJson.name;
const developer = packageJson.author;

const chain: blockchain = "local" as blockchain; // or 'devnet' or 'lightnet'
const deploy = true;
const useLocalCloudWorker = true;
const api = new zkCloudWorkerClient({
  jwt: useLocalCloudWorker ? "local" : JWT,
  zkcloudworker,
  chain,
});

let deployer: PrivateKey;
let sender: PublicKey;
const ONE_ELEMENTS_NUMBER = 2;
const MANY_ELEMENTS_NUMBER = 1;
const MANY_SIZE = 2;
const oneValues: number[] = [];
const manyValues: number[][] = [];

const contractPrivateKey = PrivateKey.random(); //contract.contractPrivateKey;
const contractPublicKey = contractPrivateKey.toPublicKey();

const zkApp = new AddContract(contractPublicKey);
let programVerificationKey: VerificationKey;
let contractVerificationKey: VerificationKey;

describe("Add Worker", () => {
  it(`should prepare data`, async () => {
    console.log("Preparing data...");
    console.time(`prepared data`);
    for (let i = 0; i < ONE_ELEMENTS_NUMBER; i++) {
      oneValues.push(1 + Math.floor(Math.random() * (limit - 2)));
    }
    for (let i = 0; i < MANY_ELEMENTS_NUMBER; i++) {
      const values: number[] = [];
      for (let j = 0; j < MANY_SIZE; j++) {
        values.push(1 + Math.floor(Math.random() * (limit - 2)));
      }
      manyValues.push(values);
    }
    console.timeEnd(`prepared data`);
  });

  it(`should initialize blockchain`, async () => {
    Memory.info("initializing blockchain");
    console.log("chain:", chain);
    if (chain === "local" || chain === "lighnet") {
      const { keys } = await initBlockchain(chain, 2);
      expect(keys.length).toBeGreaterThanOrEqual(2);
      if (keys.length < 2) throw new Error("Invalid keys");
      deployer = keys[0].key;
    } else {
      console.log("non-local chain:", chain);
      await initBlockchain(chain);
      deployer = PrivateKey.fromBase58(DEPLOYER);
    }

    process.env.DEPLOYER = deployer.toBase58();
    if (deploy) {
      expect(contractPrivateKey).toBeDefined();
      expect(contractPrivateKey.toPublicKey().toBase58()).toBe(
        contractPublicKey.toBase58()
      );
    }

    console.log("blockchain initialized:", chain);
    console.log("contract address:", contractPublicKey.toBase58());
    sender = deployer.toPublicKey();
    console.log("sender:", sender.toBase58());
    console.log("Sender balance:", await accountBalanceMina(sender));
    expect(deployer).toBeDefined();
    expect(sender).toBeDefined();
    expect(deployer.toPublicKey().toBase58()).toBe(sender.toBase58());
    Memory.info("blockchain initialized");
  });

  if (deploy) {
    it(`should compile contract`, async () => {
      console.log("Analyzing contracts methods...");
      console.time("methods analyzed");
      const methods = [
        {
          name: "AddProgram",
          result: await AddProgram.analyzeMethods(),
          skip: true,
        },
        { name: "AddContract", result: await AddContract.analyzeMethods() },
      ];
      console.timeEnd("methods analyzed");
      const maxRows = 2 ** 16;
      for (const contract of methods) {
        // calculate the size of the contract - the sum or rows for each method
        const size = Object.values(contract.result).reduce(
          (acc, method) => acc + method.rows,
          0
        );
        // calculate percentage rounded to 0 decimal places
        const percentage = Math.round(((size * 100) / maxRows) * 100) / 100;

        console.log(
          `method's total size for a ${contract.name} is ${size} rows (${percentage}% of max ${maxRows} rows)`
        );
        if (contract.skip !== true)
          for (const method in contract.result) {
            console.log(method, `rows:`, (contract.result as any)[method].rows);
          }
      }

      console.time("compiled");
      console.log("Compiling contracts...");
      const cache: Cache = Cache.FileSystem("./cache");

      console.time("AddProgram compiled");
      programVerificationKey = (await AddProgram.compile({ cache }))
        .verificationKey;
      console.timeEnd("AddProgram compiled");

      console.time("AddContract compiled");
      contractVerificationKey = (await AddContract.compile({ cache }))
        .verificationKey;
      console.timeEnd("AddContract compiled");
      console.timeEnd("compiled");
      console.log(
        "AddContract verification key",
        contractVerificationKey.hash.toJSON()
      );
      console.log(
        "AddProgram verification key",
        programVerificationKey.hash.toJSON()
      );
      Memory.info("compiled");
    });

    it(`should deploy contract`, async () => {
      console.log(`Deploying contract...`);

      await fetchMinaAccount({ publicKey: sender, force: true });

      const tx = await Mina.transaction(
        { sender, fee: await fee(), memo: "deploy" },
        async () => {
          AccountUpdate.fundNewAccount(sender);
          await zkApp.deploy({});
          zkApp.account.zkappUri.set("https://zkcloudworker.com");
        }
      );

      tx.sign([deployer, contractPrivateKey]);
      await sendTx(tx, "deploy");
      Memory.info("deployed");
      await sleep(30000);
    });

    it.skip(`should send first one tx`, async () => {
      console.log(`Sending first one tx...`);

      await fetchMinaAccount({ publicKey: sender, force: true });
      await fetchMinaAccount({ publicKey: contractPublicKey, force: true });
      const addValue = new AddValue({
        value: UInt64.from(100),
        limit: UInt64.from(limit),
      });
      const privateKey = PrivateKey.random();
      const address = privateKey.toPublicKey();

      const tx = await Mina.transaction(
        { sender, fee: await fee(), memo: "one tx" },
        async () => {
          AccountUpdate.fundNewAccount(sender);
          await zkApp.addOne(address, addValue);
        }
      );

      await tx.prove();
      tx.sign([deployer, privateKey]);
      await sendTx(tx, "first one tx");
      Memory.info("first one tx sent");
      await sleep(10000);
    });
  }

  it(`should send one transactions`, async () => {
    console.time(`One txs sent`);
    for (let i = 0; i < ONE_ELEMENTS_NUMBER; i++) {
      const answer = await api.execute({
        developer,
        repo,
        transactions: [],
        task: "one",
        args: JSON.stringify({
          contractAddress: contractPublicKey.toBase58(),
          isMany: false,
          addValue: serializeFields(
            AddValue.toFields(
              new AddValue({
                value: UInt64.from(oneValues[i]),
                limit: UInt64.from(limit),
              })
            )
          ),
        }),
        metadata: `one`,
      });
      console.log("answer:", answer);
      expect(answer).toBeDefined();
      expect(answer.success).toBe(true);
      const jobId = answer.jobId;
      expect(jobId).toBeDefined();
      if (jobId === undefined) throw new Error("Job ID is undefined");
      await api.waitForJobResult({ jobId, printLogs: true });
    }
    console.timeEnd(`One txs sent`);
    Memory.info(`One txs sent`);
  });
});

async function sendTx(tx: any, description?: string) {
  const txSent = await tx.send();
  if (txSent.errors.length > 0) {
    console.error(
      `${description ?? ""} tx error: hash: ${txSent.hash} status: ${
        txSent.status
      }  errors: ${txSent.errors}`
    );
    throw new Error("Transaction failed");
  }
  console.log(
    `${description ?? ""} tx sent: hash: ${txSent.hash} status: ${
      txSent.status
    }`
  );

  const txIncluded = await txSent.wait();
  console.log(
    `${description ?? ""} tx included into block: hash: ${
      txIncluded.hash
    } status: ${txIncluded.status}`
  );
  if (chain !== "local") await sleep(10000);
}
