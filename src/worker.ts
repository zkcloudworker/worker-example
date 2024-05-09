import {
  zkCloudWorker,
  Cloud,
  fee,
  DeployedSmartContract,
  sleep,
  deserializeFields,
  fetchMinaAccount,
} from "zkcloudworker";
import {
  verify,
  JsonProof,
  VerificationKey,
  PublicKey,
  Mina,
  PrivateKey,
  AccountUpdate,
} from "o1js";
import { AddContract, AddProgram, AddProgramProof, AddValue } from "./contract";
import { add } from "o1js/dist/node/lib/provable/gadgets/native-curve";

export class AddWorker extends zkCloudWorker {
  static programVerificationKey: VerificationKey | undefined = undefined;
  static contractVerificationKey: VerificationKey | undefined = undefined;

  constructor(cloud: Cloud) {
    super(cloud);
  }

  public async deployedContracts(): Promise<DeployedSmartContract[]> {
    throw new Error("not implemented");
  }

  private async compile(compileSmartContracts: boolean = true): Promise<void> {
    console.time("compiled");
    if (AddWorker.programVerificationKey === undefined) {
      console.time("compiled AddProgram");
      AddWorker.programVerificationKey = (
        await AddProgram.compile({
          cache: this.cloud.cache,
        })
      ).verificationKey;
      console.timeEnd("compiled AddProgram");
    }

    if (compileSmartContracts === false) {
      console.timeEnd("compiled");
      return;
    }

    if (AddWorker.contractVerificationKey === undefined) {
      console.time("compiled AddContract");
      AddWorker.contractVerificationKey = (
        await AddContract.compile({
          cache: this.cloud.cache,
        })
      ).verificationKey;
      console.timeEnd("compiled AddContract");
    }
    console.timeEnd("compiled");
  }

  public async create(transaction: string): Promise<string | undefined> {
    const msg = `proof created`;
    console.time(msg);
    const args = JSON.parse(transaction);

    const addValue: AddValue = AddValue.fromFields(
      deserializeFields(args.addValue)
    ) as AddValue;

    await this.compile(false);
    if (AddWorker.programVerificationKey === undefined)
      throw new Error("verificationKey is undefined");

    const proof = await AddProgram.create(addValue);
    console.timeEnd(msg);

    return JSON.stringify(proof.toJSON(), null, 2);
  }

  public async merge(
    proof1: string,
    proof2: string
  ): Promise<string | undefined> {
    const msg = `proof merged`;
    console.time(msg);
    await this.compile(false);
    if (AddWorker.programVerificationKey === undefined)
      throw new Error("verificationKey is undefined");

    const sourceProof1: AddProgramProof = await AddProgramProof.fromJSON(
      JSON.parse(proof1) as JsonProof
    );
    const sourceProof2: AddProgramProof = await AddProgramProof.fromJSON(
      JSON.parse(proof2) as JsonProof
    );

    const proof = await AddProgram.merge(sourceProof1, sourceProof2);
    const ok = await verify(proof.toJSON(), AddWorker.programVerificationKey);
    if (!ok) throw new Error("proof verification failed");
    console.timeEnd(msg);
    return JSON.stringify(proof.toJSON(), null, 2);
  }

  public async execute(transactions: string[]): Promise<string | undefined> {
    if (this.cloud.args === undefined)
      throw new Error("this.cloud.args is undefined");
    const args = JSON.parse(this.cloud.args);
    console.log("args", args);
    if (args.contractAddress === undefined)
      throw new Error("args.contractAddress is undefined");
    if (args.isMany === undefined) throw new Error("args.isMany is undefined");
    const isMany = args.isMany as boolean;
    console.log("isMany:", isMany);
    if (isMany) {
      if (args.proof === undefined) throw new Error("args.proof is undefined");
    } else {
      if (args.addValue === undefined)
        throw new Error("args.addValue is undefined");
    }

    const privateKey = PrivateKey.random();
    const address = privateKey.toPublicKey();
    console.log("Address", address.toBase58());
    const contractAddress = PublicKey.fromBase58(args.contractAddress);
    const zkApp = new AddContract(contractAddress);
    await this.compile();

    console.log(`Sending tx...`);
    console.time("prepared tx");
    const memo = isMany ? "many" : "one";

    const deployer = await this.cloud.getDeployer();
    if (deployer === undefined) throw new Error("deployer is undefined");
    const sender = deployer.toPublicKey();

    await fetchMinaAccount({
      publicKey: contractAddress,
      force: true,
    });
    await fetchMinaAccount({
      publicKey: sender,
      force: true,
    });

    let tx;
    if (isMany) {
      const proof = (await AddProgramProof.fromJSON(
        JSON.parse(args.proof) as JsonProof
      )) as AddProgramProof;

      tx = await Mina.transaction(
        { sender, fee: await fee(), memo },
        async () => {
          AccountUpdate.fundNewAccount(sender);
          await zkApp.addMany(address, proof);
        }
      );
    } else {
      const addValue = AddValue.fromFields(
        deserializeFields(args.addValue)
      ) as AddValue;
      console.log("addValue:", {
        value: addValue.value.toJSON(),
        limit: addValue.limit.toJSON(),
      });

      tx = await Mina.transaction(
        { sender, fee: await fee(), memo },
        async () => {
          AccountUpdate.fundNewAccount(sender);
          await zkApp.addOne(address, addValue);
        }
      );
    }
    if (tx === undefined) throw new Error("tx is undefined");
    await tx.prove();

    tx.sign([deployer, privateKey]);
    try {
      await tx.prove();
      console.timeEnd("prepared tx");
      const txSent = await tx.send();
      console.log(`one tx sent: hash: ${txSent.hash} status: ${txSent.status}`);
      if (txSent.status !== "pending") {
        console.error("Error sending transaction");
        return "Error sending transaction";
      }
      if (this.cloud.isLocalCloud) {
        const txIncluded = await txSent.wait();
        console.log(
          `one tx included into block: hash: ${txIncluded.hash} status: ${txIncluded.status}`
        );
        //await sleep(10000);
        await this.cloud.releaseDeployer([txIncluded.hash]);
        return txIncluded.hash;
      }
      await this.cloud.releaseDeployer([txSent.hash]);
      return txSent.hash;
    } catch (error) {
      console.error("Error sending transaction", error);
      return "Error sending transaction";
    }
  }
}

export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
  return new AddWorker(cloud);
}
