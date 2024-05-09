import { Cloud, zkCloudWorker } from "zkcloudworker";
import { ExampleWorker } from "./src/worker";

// Keep this for compatibility
export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
  return new ExampleWorker(cloud);
}
