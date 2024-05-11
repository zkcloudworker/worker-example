import { Cloud, zkCloudWorker, initBlockchain } from "zkcloudworker";
import { initializeBindings } from "o1js";
import { AddWorker } from "./src/worker";
import packageJson from "./package.json";

export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
  console.log(
    `starting worker example version ${
      packageJson.version ?? "unknown"
    } on chain ${cloud.chain}`
  );
  await initializeBindings();
  await initBlockchain(cloud.chain);
  return new AddWorker(cloud);
}
