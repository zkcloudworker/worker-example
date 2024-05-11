"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zkcloudworker = void 0;
const worker_1 = require("./src/worker");
async function zkcloudworker(cloud) {
    return new worker_1.AddWorker(cloud);
}
exports.zkcloudworker = zkcloudworker;
