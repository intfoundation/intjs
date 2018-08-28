"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_code_1 = require("./error_code");
const bignumber_js_1 = require("bignumber.js");
const storage_1 = require("./storage_json/storage");
const value_chain_1 = require("./value_chain");
const address_1 = require("./address");
const util_1 = require("util");
class ValueMemoryDebugSession {
    constructor(debuger) {
        this.debuger = debuger;
    }
    async init(options) {
        const csr = await this.debuger.createStorage();
        if (csr.err) {
            return csr.err;
        }
        this.m_storage = csr.storage;
        if (util_1.isArray(options.accounts)) {
            this.m_accounts = options.accounts.map((x) => Buffer.from(x));
        }
        else {
            this.m_accounts = [];
            for (let i = 0; i < options.accounts; ++i) {
                this.m_accounts.push(address_1.createKeyPair()[1]);
            }
        }
        this.m_interval = options.interval;
        const chain = this.debuger.chain;
        let gh = chain.newBlockHeader();
        gh.timestamp = Date.now() / 1000;
        let block = chain.newBlock(gh);
        let genesissOptions = {};
        genesissOptions.candidates = [];
        genesissOptions.miners = [];
        genesissOptions.coinbase = address_1.addressFromSecretKey(this.m_accounts[options.coinbase]);
        if (options.preBalance) {
            genesissOptions.preBalances = [];
            this.m_accounts.forEach((value) => {
                genesissOptions.preBalances.push({ address: address_1.addressFromSecretKey(value), amount: options.preBalance });
            });
        }
        const err = await chain.onCreateGenesisBlock(block, csr.storage, genesissOptions);
        if (err) {
            chain.logger.error(`onCreateGenesisBlock failed for `, error_code_1.stringifyErrorCode(err));
            return err;
        }
        gh.updateHash();
        if (options.height > 0) {
            const _err = this.updateHeightTo(options.height, options.coinbase);
            if (_err) {
                return _err;
            }
        }
        else {
            this.m_curHeader = block.header;
        }
        return error_code_1.ErrorCode.RESULT_OK;
    }
    updateHeightTo(height, coinbase) {
        if (height <= this.m_curHeader.number) {
            this.debuger.chain.logger.error(`updateHeightTo ${height} failed for current height ${this.m_curHeader.number} is larger`);
            return error_code_1.ErrorCode.RESULT_INVALID_PARAM;
        }
        let curHeader = this.m_curHeader;
        const offset = height - curHeader.number;
        for (let i = 0; i <= offset; ++i) {
            let header = this.debuger.chain.newBlockHeader();
            header.timestamp = curHeader.timestamp + this.m_interval;
            header.coinbase = address_1.addressFromSecretKey(this.m_accounts[coinbase]);
            header.setPreBlock(curHeader);
            curHeader = header;
        }
        this.m_curHeader = curHeader;
        return error_code_1.ErrorCode.RESULT_OK;
    }
    transaction(options) {
        const tx = new value_chain_1.ValueTransaction();
        tx.fee = new bignumber_js_1.BigNumber(0);
        tx.value = new bignumber_js_1.BigNumber(options.value);
        tx.method = options.method;
        tx.input = options.input;
        tx.sign(this.m_accounts[options.caller]);
        return this.debuger.debugTransaction(this.m_storage, this.m_curHeader, tx);
    }
    wage() {
        return this.debuger.debugMinerWageEvent(this.m_storage, this.m_curHeader);
    }
    view(options) {
        return this.debuger.debugView(this.m_storage, this.m_curHeader, options.method, options.params);
    }
    getAccount(index) {
        return address_1.addressFromSecretKey(this.m_accounts[index]);
    }
}
exports.ValueMemoryDebugSession = ValueMemoryDebugSession;
class MemoryDebuger {
    constructor(chain, logger) {
        this.chain = chain;
        this.logger = logger;
    }
    async createStorage() {
        const storage = new storage_1.JsonStorage({
            filePath: '',
            logger: this.logger
        });
        const err = await storage.init();
        if (err) {
            this.chain.logger.error(`init storage failed `, error_code_1.stringifyErrorCode(err));
            return { err };
        }
        storage.createLogger();
        return { err: error_code_1.ErrorCode.RESULT_OK, storage };
    }
    async debugTransaction(storage, header, tx) {
        const block = this.chain.newBlock(header);
        const nber = await this.chain.newBlockExecutor(block, storage);
        if (nber.err) {
            return { err: nber.err };
        }
        const etr = await nber.executor.executeTransaction(tx, { ignoreNoce: true });
        if (etr.err) {
            return { err: etr.err };
        }
        return { err: error_code_1.ErrorCode.RESULT_OK, receipt: etr.receipt };
    }
    async debugBlockEvent(storage, header, listener) {
        const block = this.chain.newBlock(header);
        const nber = await this.chain.newBlockExecutor(block, storage);
        if (nber.err) {
            return { err: nber.err };
        }
        const err = await nber.executor.executeBlockEvent(listener);
        return { err };
    }
    async debugView(storage, header, method, params) {
        const nver = await this.chain.newViewExecutor(header, storage, method, params);
        if (nver.err) {
            return { err: nver.err };
        }
        return nver.executor.execute();
    }
}
class ValueMemoryDebuger extends MemoryDebuger {
    async debugMinerWageEvent(storage, header) {
        const block = this.chain.newBlock(header);
        const nber = await this.chain.newBlockExecutor(block, storage);
        if (nber.err) {
            return { err: nber.err };
        }
        const err = await nber.executor.executeMinerWageEvent();
        return { err };
    }
    createSession() {
        return new ValueMemoryDebugSession(this);
    }
}
async function createValueMemoryDebuger(chainCreator, dataDir) {
    const ccir = await chainCreator.createChainInstance(dataDir);
    if (ccir.err) {
        chainCreator.logger.error(`create chain instance from ${dataDir} failed `, error_code_1.stringifyErrorCode(ccir.err));
        return { err: ccir.err };
    }
    const err = await ccir.chain.setGlobalOptions(ccir.globalOptions);
    if (err) {
        chainCreator.logger.error(`setGlobalOptions failed `, error_code_1.stringifyErrorCode(err));
        return { err };
    }
    return { err: error_code_1.ErrorCode.RESULT_OK, debuger: new ValueMemoryDebuger(ccir.chain, chainCreator.logger) };
}
exports.createValueMemoryDebuger = createValueMemoryDebuger;
