"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core/error_code");
// const ValueTransaction = require("../../core/value_chain/transaction").ValueTransaction;
const core_2 = require("../../core/serializable");
const rpc_client_1 = require("../lib/rpc_client");
class HostClient {
    constructor(options) {
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
    async getNonce(params) {
        let cr = await this.m_client.callAsync('getNonce', params);
        if (cr.ret !== 200) {
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return JSON.parse(cr.resp);
    }
    async sendTransaction(params) {
        let writer = new core_2.BufferWriter();
        let err = params.tx.encode(writer);
        if (err) {
            // this.m_logger.error(`send invalid transactoin`, params.tx);
            return { err };
        }
        let cr = await this.m_client.callAsync('sendTransaction', { tx: writer.render() });
        if (cr.ret !== 200) {
            // this.m_logger.error(`send tx failed ret `, cr.ret);
            return { err: core_1.ErrorCode.RESULT_FAILED };
        }
        return { err: JSON.parse(cr.resp) };
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
      return { err: JSON.parse(cr.resp) };
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
    async readFile(params) {
        let cr = await this.m_client.callAsync('readFile', params);
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
}
exports.HostClient = HostClient;
