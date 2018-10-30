"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core/error_code");
// const ValueTransaction = require("../../core/value_chain/transaction").ValueTransaction;
const core_2 = require("../../core/serializable");
const bignumber_js_1 = require("bignumber.js");
const rpc_client_1 = require("../lib/rpc_client");
class HostClient {
    constructor(options) {
        this.m_baseLimit = new bignumber_js_1.BigNumber(500);
        this.m_getLimit = new bignumber_js_1.BigNumber(20);
        this.m_setLimit = new bignumber_js_1.BigNumber(100);
        this.m_createLimit = new bignumber_js_1.BigNumber(50000);
        this.m_inputLimit = new bignumber_js_1.BigNumber(5);
        this.m_coefficient = new bignumber_js_1.BigNumber(40);
        // this.m_logger = options.logger;
        this.m_client = new rpc_client_1.RPCClient(options.host, options.port);
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
    async sendTransaction(params) {
        let cr = await this.m_client.callAsync('sendTransaction', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED, hash: "" };
        }
        return JSON.parse(cr.resp);
    }
    // async sendSignedTransaction(params) {
    //     let vTx = new ValueTransaction();
    //     let err = vTx.decode(new core_2.BufferReader(params.tx));
    //     if (err) {
    //         // this.m_logger.error(`decode transaction error`, params.tx);
    //         return { err: core_1.ErrorCode.RESULT_INVALID_FORMAT };
    //     }
    //     let cr = await this.m_client.callAsync('sendTransaction', { tx: params.tx });
    //     if (cr.ret !== 200) {
    //         // this.m_logger.error(`send tx failed ret `, cr.ret);
    //         return { err: core_1.ErrorCode.RESULT_FAILED, hash: vTx.hash };
    //     }
    //     return { err: JSON.parse(cr.resp), hash: vTx.hash };
    // }
    async sendSignedTransaction(params) {
      // let writer = new core_2.BufferWriter();
      // let err = params.tx.encode(writer);
      // if (err) {
      //   // this.m_logger.error(`send invalid transaction`, params.tx);
      //   return { err };
      // }
      let cr = await this.m_client.callAsync('sendSignedTransaction', { tx: params.tx });
      if (cr.ret !== 200) {
        // this.m_logger.error(`send tx failed ret `, cr.ret);
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
    async newAccount(params) {
        let cr = await this.m_client.callAsync('newAccount', params);
        if (cr.ret !== 200) {
          // this.m_logger.error(`create account failed ret `, cr.ret);
          return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp)
    }
    async getAccounts(params) {
        let cr = await this.m_client.callAsync('getAccounts', params);
        if (cr.ret !== 200) {
            // this.m_logger.error(`read file failed`, cr.ret);
            return {err: core_1.ErrorCode.RESULT_FAILED};
        }
        return JSON.parse(cr.resp)
    }
    async readKeystore(params) {
        let cr = await this.m_client.callAsync('readKeystore', params);
        if (cr.ret !== 200) {
            // this.m_logger.error(`read keystore failed`, cr.ret);
            return {err: core_1.ErrorCode.RESULT_FAILED}
        }
        return JSON.parse(cr.resp);
    }
    getTransactionLimit(method, input) {
        let txTotalLimit = this.calcTxLimit(method, input);
        return { limit: txTotalLimit };
    }
    // 计算单笔tx的 limit
    calcTxLimit(method, input) {
        let txTotalLimit = new bignumber_js_1.BigNumber(0);
        let txInputBytes = new bignumber_js_1.BigNumber(this.objectToBuffer(input).length);
        switch (method) {
            case 'transferTo':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(2))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'createToken':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(6))).plus(this.m_createLimit).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'transferTokenTo':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(4))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'transferFrom':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(3))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(6))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'approve':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(2))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'freezeAccount':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(1))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(1))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'burn':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(2))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'mintToken':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(3))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'transferOwnership':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(1))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(1))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'vote':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(5))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'mortgage':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(2))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(2))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'unmortgage':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(3))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(2))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'register':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(1))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(1))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'publish':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(3))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(1))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            case 'bid':
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).plus(this.m_setLimit.times(new bignumber_js_1.BigNumber(1))).plus(this.m_getLimit.times(new bignumber_js_1.BigNumber(1))).plus(txInputBytes.times(this.m_inputLimit)).times(this.m_coefficient);
                break;
            default:
                txTotalLimit = txTotalLimit.plus(this.m_baseLimit).times(this.m_coefficient);
                break;
        }
        return txTotalLimit;
    }
    objectToBuffer(input) {
        let inputString;
        if (input) {
            inputString = JSON.stringify(core_2.toStringifiable(input, true));
        }
        else {
            inputString = JSON.stringify({});
        }
        return Buffer.from(inputString);
    }

}
exports.HostClient = HostClient;
