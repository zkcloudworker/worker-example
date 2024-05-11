import {
  zkCloudWorker,
  Cloud,
  fee,
  DeployedSmartContract,
  sleep,
  deserializeFields,
  fetchMinaAccount,
  accountBalanceMina,
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

      default:
        throw new Error(`Unknown task: ${this.cloud.task}`);
    }
  }

  private async verifyProof(args: { proof: string }): Promise<string> {
    if (args.proof === undefined) throw new Error("args.proof is undefined");
    const proof = (await AddProgramProof.fromJSON(
      JSON.parse(args.proof) as JsonProof
    )) as AddProgramProof;

    await this.compile(false);
    if (AddWorker.programVerificationKey === undefined)
      throw new Error("verificationKey is undefined");

    const ok = await verify(proof, AddWorker.programVerificationKey);
    if (ok) return "Proof verified";
    else return "Proof verification failed";
  }

  private async sendTx(args: {
    proof?: string;
    addValue?: string;
    isMany: boolean;
    contractAddress: string;
  }): Promise<string> {
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

    console.log(`Sending tx...`);
    console.time("prepared tx");
    const memo = isMany ? "many" : "one";

    const deployerKeyPair = await this.cloud.getDeployer();
    if (deployerKeyPair === undefined)
      throw new Error("deployerKeyPair is undefined");
    const deployer = PrivateKey.fromBase58(deployerKeyPair.privateKey);
    console.log("cloud deployer:", deployer.toBase58());
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

    console.log("sender:", sender.toBase58());
    console.log("Sender balance:", await accountBalanceMina(sender));
    await this.compile();

    let tx;
    if (isMany) {
      const proof = (await AddProgramProof.fromJSON(
        JSON.parse(args.proof!) as JsonProof
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
        deserializeFields(args.addValue!)
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
      let txSent;
      let sent = false;
      while (!sent) {
        txSent = await tx.safeSend();
        if (txSent.status == "pending") {
          sent = true;
          console.log(
            `${memo} tx sent: hash: ${txSent.hash} status: ${txSent.status}`
          );
        } else if (this.cloud.chain === "zeko") {
          console.log("Retrying Zeko tx");
          await sleep(10000);
        } else {
          console.log(
            `${memo} tx NOT sent: hash: ${txSent?.hash} status: ${txSent?.status}`
          );
          return "Error sending transaction";
        }
      }
      if (this.cloud.isLocalCloud && txSent?.status === "pending") {
        const txIncluded = await txSent.safeWait();
        console.log(
          `one tx included into block: hash: ${txIncluded.hash} status: ${txIncluded.status}`
        );
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
      return txSent?.hash ?? "Error sending transaction";
    } catch (error) {
      console.error("Error sending transaction", error);
      return "Error sending transaction";
    }
  }
}

export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
  return new AddWorker(cloud);
}
