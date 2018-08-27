"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_chain_1 = require("../value_chain");
const block_1 = require("./block");
const consensus = require("./consensus");
class PowChain extends value_chain_1.ValueChain {
    _getBlockHeaderType() {
        return block_1.PowBlockHeader;
    }
    onCheckGlobalOptions(globalOptions) {
        if (!super.onCheckGlobalOptions(globalOptions)) {
            return false;
        }
        return consensus.onCheckGlobalOptions(globalOptions);
    }
    _onCheckTypeOptions(typeOptions) {
        return typeOptions.consensus === 'pow';
    }
}
exports.PowChain = PowChain;
