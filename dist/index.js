"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.zkcloudworker = void 0;
const zkcloudworker_1 = require("zkcloudworker");
const o1js_1 = require("o1js");
const worker_1 = require("./src/worker");
const package_json_1 = __importDefault(require("./package.json"));
const contract_1 = require("./src/contract");
async function zkcloudworker(cloud) {
    console.log(`starting worker example version ${package_json_1.default.version ?? "unknown"} on chain ${cloud.chain}`);
    await (0, o1js_1.initializeBindings)();
    await (0, zkcloudworker_1.initBlockchain)(cloud.chain);
    return new worker_1.AddWorker(cloud);
}
exports.zkcloudworker = zkcloudworker;
async function verify(chain) {
    if (chain !== "devnet")
        throw new Error("Unsupported chain");
    return {
        contract: contract_1.AddContract,
        programDependencies: [contract_1.AddProgram],
        contractDependencies: [],
        address: "B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD",
        chain: "devnet",
    };
}
exports.verify = verify;
