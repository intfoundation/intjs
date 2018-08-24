"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_code_1 = require("../error_code");
const address_1 = require("../address");
const chain_1 = require("../chain");
const context_1 = require("./context");
const chain_2 = require("./chain");
const assert = require('assert');
class ValueBlockExecutor extends chain_1.BlockExecutor {
    _newTransactionExecutor(l, tx) {
        return new ValueTransactionExecutor(l, tx, this.m_logger);
    }
    async _executePreBlockEvent() {
        let l = this.m_handler.getMinerWageListener();
        let wage = await l(this.m_block.number);
        let kvBalance = (await this.m_storage.getKeyValue(chain_1.Chain.dbSystem, chain_2.ValueChain.kvBalance)).kv;
        let ve = new context_1.Context(kvBalance);
        let coinbase = this.m_block.header.coinbase;
        assert(address_1.isValidAddress(coinbase), `block ${this.m_block.hash} has no coinbase set`);
        if (!address_1.isValidAddress(coinbase)) {
            coinbase = chain_2.ValueChain.sysAddress;
        }
        await ve.issue(coinbase, wage);
        return await super._executePreBlockEvent();
    }
}
exports.ValueBlockExecutor = ValueBlockExecutor;
class ValueTransactionExecutor extends chain_1.TransactionExecutor {
    constructor(listener, tx, logger) {
        super(listener, tx, logger);
        this.m_toAddress = '';
    }
    async prepareContext(blockHeader, storage, externContext) {
        let context = await super.prepareContext(blockHeader, storage, externContext);
        Object.defineProperty(context, 'value', {
            writable: false,
            value: this.m_tx.value
        });
        return context;
    }
    async execute(blockHeader, storage, externContext) {
        let nonceErr = await this._dealNonce(this.m_tx, storage);
        if (nonceErr !== error_code_1.ErrorCode.RESULT_OK) {
            return { err: nonceErr };
        }
        let kvBalance = (await storage.getKeyValue(chain_1.Chain.dbSystem, chain_2.ValueChain.kvBalance)).kv;
        let fromAddress = this.m_tx.address;
        let nToValue = this.m_tx.value;
        let nFee = this.m_tx.fee;
        let ve = new context_1.Context(kvBalance);
        if ((await ve.getBalance(fromAddress)).lt(nToValue.plus(nFee))) {
            return { err: error_code_1.ErrorCode.RESULT_NOT_ENOUGH };
        }
        let context = await this.prepareContext(blockHeader, storage, externContext);
        let receipt = new chain_1.Receipt();
        let work = await storage.beginTransaction();
        if (work.err) {
            return { err: work.err };
        }
        let err = await ve.transferTo(fromAddress, chain_2.ValueChain.sysAddress, nToValue);
        if (err) {
            await work.value.rollback();
            return { err };
        }
        receipt.returnCode = await this._execute(context, this.m_tx.input);
        receipt.transactionHash = this.m_tx.hash;
        if (receipt.returnCode) {
            await work.value.rollback();
        }
        else {
            receipt.eventLogs = this.m_logs;
            err = await work.value.commit();
        }
        let coinbase = blockHeader.coinbase;
        assert(address_1.isValidAddress(coinbase), `block ${blockHeader.hash} has no coinbase set`);
        if (!address_1.isValidAddress(coinbase)) {
            coinbase = chain_2.ValueChain.sysAddress;
        }
        err = await ve.transferTo(fromAddress, coinbase, nFee);
        if (err) {
            return { err };
        }
        return { err: error_code_1.ErrorCode.RESULT_OK, receipt };
    }
}
exports.ValueTransactionExecutor = ValueTransactionExecutor;
