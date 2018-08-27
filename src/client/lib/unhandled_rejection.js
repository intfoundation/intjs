"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process = require("process");
function init(logger) {
    process.on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason.stack);
    });
    process.on('uncaughtException', (err) => {
        logger.error('uncaught exception at: ', err.stack);
    });
}
exports.init = init;
