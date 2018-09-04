"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = require("bignumber.js");
exports.BigNumber = bignumber_js_1.BigNumber;
__export(require("./serializable"));
__export(require("./error_code"));
__export(require("./address"));
__export(require("./lib/logger_util"));
__export(require("./lib/decimal_transfer"));
__export(require("./lib/digest"));
__export(require("./chain"));
__export(require("./value_chain"));
__export(require("./net"));
var node_1 = require("./net_tcp/node");
exports.TcpNode = node_1.TcpNode;
var node_2 = require("./net_bdt/node");
exports.BdtNode = node_2.BdtNode;
const value_chain_1 = require("./value_chain");
function initChainCreator(options) {
    let _creator = new chain_creator_2.ChainCreator(options);
    _creator.registerChainType('pow', {
        newHandler(creator, typeOptions) {
            return new value_chain_1.ValueHandler();
        },
        newChain(creator, typeOptions) {
            return new pow_chain_1.PowChain({ logger: creator.logger });
        },
        newMiner(creator, typeOptions) {
            return new pow_chain_1.PowMiner({ logger: creator.logger });
        }
    });
    _creator.registerChainType('dpos', {
        newHandler(creator, typeOptions) {
            return new value_chain_1.ValueHandler();
        },
        newChain(creator, typeOptions) {
            return new dpos_chain_1.DposChain({ logger: creator.logger });
        },
        newMiner(creator, typeOptions) {
            return new dpos_chain_1.DposMiner({ logger: creator.logger });
        }
    });
    _creator.registerChainType('dbft', {
        newHandler(creator, typeOptions) {
            return new value_chain_1.ValueHandler();
        },
        newChain(creator, typeOptions) {
            return new dbft_chain_1.DbftChain({ logger: creator.logger });
        },
        newMiner(creator, typeOptions) {
            return new dbft_chain_1.DbftMiner({ logger: creator.logger });
        }
    });
    return _creator;
}
exports.initChainCreator = initChainCreator;
