"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core/error_code");
// const ValueTransaction = require("../../core/value_chain/transaction").ValueTransaction;
const core_2 = require("../../core/serializable");
const bignumber_js_1 = require("bignumber.js");
const rpc_client_1 = require("../lib/rpc_client");
class HostClient {
    constructor(options) {
        this.m_client = new rpc_client_1.RPCClient(options.host, options.port, options.url);
    }
    async getBlock(params) {
        let cr = await this.m_client.callAsync('getBlock', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getTransactionReceipt(params) {
        let cr = await this.m_client.callAsync('getTransactionReceipt', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getTransactionByAddress(params) {
        let cr = await this.m_client.callAsync('getTransactionByAddress', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getNonce(params) {
        let cr = await this.m_client.callAsync('getNonce', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getPendingTransactions(params) {
        let cr = await this.m_client.callAsync('getPendingTransactions', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async newAccount(params) {
        let cr = await this.m_client.callAsync('newAccount', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getAccounts(params) {
        let cr = await this.m_client.callAsync('getAccounts', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async sendTransaction(params) {
        let cr = await this.m_client.callAsync('sendTransaction', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED, hash: "" };
        }
        return JSON.parse(cr.resp);
    }
    async sendSignedTransaction(params) {
        let cr = await this.m_client.callAsync('sendSignedTransaction', { tx: params.tx });
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async view(params) {
        let cr = await this.m_client.callAsync('view', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return core_2.fromStringifiable(JSON.parse(cr.resp));
    }
    async getPeers() {
        let cr = await this.m_client.callAsync('getPeers', {});
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getPrice(params) {
        let cr = await this.m_client.callAsync('getPrice', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async getTransactionLimit(params) {
        let cr = await this.m_client.callAsync('getTransactionLimit', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }

}
exports.HostClient = HostClient;
