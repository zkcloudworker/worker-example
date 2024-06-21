import { Cloud, zkCloudWorker, VerificationData, blockchain } from "zkcloudworker";
export declare function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker>;
export declare function verify(chain: blockchain): Promise<VerificationData>;
