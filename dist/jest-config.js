"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = __importDefault(require("console"));
global.console = console_1.default;
const logCopy = console_1.default.log.bind(console_1.default);
console_1.default.log = function () {
    // Timestamp to prepend
    const timestamp = "[" + new Date().toLocaleTimeString() + "] ";
    if (arguments.length) {
        // True array copy so we can call .splice()
        const args = Array.prototype.slice.call(arguments, 0);
        // If there is a format string then... it must
        // be a string
        if (typeof arguments[0] === "string") {
            // Prepend timestamp to the (possibly format) string
            args[0] = "%s" + arguments[0];
            // Insert the timestamp where it has to be
            args.splice(1, 0, timestamp);
            // Log the whole array
            logCopy.apply(this, args);
        }
        else {
            // "Normal" log
            logCopy(timestamp, args);
        }
    }
};
