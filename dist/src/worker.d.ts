import { zkCloudWorker, Cloud, DeployedSmartContract } from "zkcloudworker";
import { VerificationKey } from "o1js";
export declare class AddWorker extends zkCloudWorker {
    static programVerificationKey: VerificationKey | undefined;
    static contractVerificationKey: VerificationKey | undefined;
    constructor(cloud: Cloud);
    deployedContracts(): Promise<DeployedSmartContract[]>;
    private compile;
    create(transaction: string): Promise<string | undefined>;
    merge(proof1: string, proof2: string): Promise<string | undefined>;
    execute(transactions: string[]): Promise<string | undefined>;
    private verifyProof;
    private sendTx;
}
export declare function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker>;
