import { zkCloudWorker, Cloud } from "zkcloudworker";
import { VerificationKey, Cache } from "o1js";
export declare class AddWorker extends zkCloudWorker {
    static programVerificationKey: VerificationKey | undefined;
    static contractVerificationKey: VerificationKey | undefined;
    readonly cache: Cache;
    constructor(cloud: Cloud);
    private compile;
    create(transaction: string): Promise<string | undefined>;
    merge(proof1: string, proof2: string): Promise<string | undefined>;
    execute(transactions: string[]): Promise<string | undefined>;
    private verifyProof;
    private files;
    private encrypt;
    private decrypt;
    private sendTx;
}
