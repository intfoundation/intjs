/*!
*  intjs - INT JavaScript API
*  https://github.com/intfoundation/intjs.git
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
*
* @file    int.js
* @author  Like(likeaixi@gmail.com)
* @date    2018
* */


"use strict";

const client = require('./src/client');
const assert = require('assert');
const errorCode = require('./src/core/error_code').ErrorCode;

class Intjs {
    constructor (host, port) {
        assert(host, 'Host is required.');
        assert(port, 'Port is required.');

        this.m_addr = host;
        this.m_port = port;
        this.watchingTx = [];

        this.chainClient = new client.ChainClient({
            host,
            port,
            // logger: client.initLogger({ loggerOptions: { console: true}})
        });
        this.chainClient.on('tipBlock', async (tipBlock) => {
            // console.log(`client onTipBlock, height ${tipBlock.number}`);
            for (let tx of this.watchingTx.slice()) {
                let { err, block, receipt } = await this.chainClient.getTransactionReceipt({ tx });
                if (!err) {
                    if (receipt.returnCode !== 0) {
                        console.error(`tx:${tx} failed for ${errorCode[receipt.returnCode].slice(7)}`);
                        this.watchingTx.splice(this.watchingTx.indexOf(tx), 1);
                    }
                    else {
                        let confirm = tipBlock.number - block.number + 1;
                        if (confirm < 6) {
                            // console.log(`tx:${tx} ${confirm} confirm`);
                        }
                        else {
                            console.log(`tx:${tx} confirmed`);
                            this.watchingTx.splice(this.watchingTx.indexOf(tx), 1);
                        }
                    }
                }
            }
        });
    }

    async getAddress() {

    }

    /**
     * create an account with public key and private key.
     * @returns {address: string, secret: string}
     */
    create () {
        let [key, secret] = client.createKeyPair();
        let address = client.addressFromPublicKey(key);

        return {address: address, secret: secret.toString('hex')}
    }
    /**
     * encrypt a private key to keyStore.
     * @param {String} privateKey
     * @param {String} password
     * @returns {Object}
     */
    encrypt (privateKey, password) {
        assert(privateKey, 'private key is required');
        assert(password, 'password is required');

        let keystore = client.encrypt(privateKey, password);
        let address = client.addressFromSecretKey(privateKey);
        keystore.address = address;

        return keystore;
     }

    /**
     * decrypt a keystore to the account.
     * @param {String} keystore
     * @param {String} password
     * @returns {Object}
     */
    decrypt (keystore, password) {
        assert(keystore, 'keystore is required');
        assert(password, 'password key is required');

        let account = client.decrypt(keystore, password);

        return account;
    }

    /**
     * create public key from private key.
     * @param {String} privateKey
     * @returns {Object}
     */
    privateKeyToPublicKey (privateKey) {
      assert(privateKey, 'private key is required.');

      let address = client.addressFromSecretKey(privateKey);
      let pubkey = client.publicKeyFromSecretKey(privateKey);

      return {address: address, pubkey: pubkey.toString('hex')}
    }

    /**
     * create address from public key.
     * @param {String} pubkey
     * @returns {Object}
     */
    publicKeyToAddress (pubkey) {
      assert(pubkey, 'public key is required.');

      let address = client.addressFromPublicKey(pubkey);

      return {address: address}
    }

    /**
     * create an account with keystore and address.
     * @param {String} password
     * @returns {String} address
     */
    async newAccount (password) {
        assert(password, 'password is required');

        let [key, secret] = client.createKeyPair();
        let privateKey = secret.toString('hex');
        let address = client.addressFromPublicKey(key);

        let keystore = this.encrypt(privateKey, password);
        let jsonKeystore = JSON.stringify(keystore);

        let params = {keystore: jsonKeystore, address: address};
        let ret = await this.chainClient.newAccount(params);

        if (ret.err) {
          return {err: errorCode[ret.err].slice(7)}
        } else {
          return address;
        }
    }

    /**
     * read keystore files.
     * @returns {Array} array of keystore file name
     */
    async readFile () {
          let ret = await this.chainClient.readFile();

          if (ret.err) {
              return {err: errorCode[ret.err].slice(7)}
          } else {
              return ret.files;
          }
      }

    /**
     * read keystore.
     * @param {String} address
     * @returns {JSON} keystore
     */
    async readKeystore (address) {
        assert(address, 'address is required');

        let params = {address: address}

        let ret = await this.chainClient.readKeystore(params);

        if (ret.err) {
            return {err: errorCode[ret.err].slice(7)}
        } else {
          return ret.keystore;
        }
      }


    /**
     * get a block matching the block hash or block number.
     * @param {String|Number} which
     * @param {Boolean} transactions  default false, only contain txs hashes,if true, the block will contain all txs.
     * @returns {Object}
     */
    async getBlock (which, transactions = false) {
        assert(which, 'block hash or block number is required');
        assert(typeof transactions === 'boolean');

        let params = {which: which, transactions: transactions};
        let ret = await this.chainClient.getBlock(params);

        if (ret.err) {
            // console.error(`get block failed for ${ret.err}`);
            return {err: errorCode[ret.err].slice(7)}
        } else {
            // console.log(`get block,the block hash: ${ret.block.hash}`);
            return ret;
        }
    }

    /**
     * get block number.
     * @returns {Number} current block number
     */
    async getBlockNumber () {
        let params = {which: 'latest', transactions: false};
        let ret = await this.chainClient.getBlock(params);

        if (ret.err) {
            // console.error(`get block failed for ${ret.err}`);
            return {err: errorCode[ret.err].slice(7)}
        } else {
            // console.log(`get block,the block hash: ${ret.block.hash}`);
            return ret.block.number;
        }
    }

    /**
     * get transaction receipt.
     * @param {String} txhash
     * @returns {Object} receipt
     */
    async getTransactionReceipt (txhash) {
        assert(txhash, 'transaction hash is required');

        let tx = {tx: txhash};
        let ret = await this.chainClient.getTransactionReceipt(tx);

        if (ret.err) {
            // console.error(`get transaction failed for ${ret.err}`);
            return {err: errorCode[ret.err].slice(7)}
        } else {
            // console.log(`get transaction,the transaction hash: ${ret.receipt.transactionHash}`);
            return ret;
        }
    }

    /**
     * Get balance for a address.
     * @param {String} _address
     * @returns {Object} {balance: string}
     * */
    async getBalance(_address) {
        assert(_address, 'address required');

        let ret = await this.chainClient.view({
            method: 'getBalance',
            params: { address: _address }
        });
        if (ret.err) {
            // console.error(`get balance failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        // console.log(`${_address}\`s Balance: ${ret.value}`);
        return {balance: ret.value.toString()};
    }

    /**
     * Get balance for a token.
     * @param {String} tokenid
     * @param {String} _address
     * @returns {Object} {balance: string}
     * */
    async getTokenBalance (tokenid, _address) {
        assert(tokenid,'tokenid is required');
        assert(_address,'address is required');

        let ret = await this.chainClient.view({
            method: 'getTokenBalance',
            params: { address: _address, tokenid: tokenid }
        });
        if (ret.err) {
            // console.error(`get ${_address}\`s Token ${tokenid} balance failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        // console.log(`${_address}\`s Token ${tokenid} Balance: ${ret.value}`);
        return {balance: ret.value.toString()};
    }

    /**
     * Create token.
     * @param {String} tokenid
     * @param {Array} preBalances [{address: string, amount: string}]
     * @param {String} amount
     * @param {String} fee
     * @param {String} secret
     * @returns {Object} {hash: string}
     * */
    async createToken (tokenid, preBalances, amount, fee, secret) {
        assert(tokenid, 'tokenid is required');
        assert(preBalances, 'preBalances is required');
        assert(amount, 'amount is required');
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'createToken';
        tx.value = new client.BigNumber(amount);
        tx.fee = new client.BigNumber(fee);
        tx.input = { tokenid, preBalances };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`createToken getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`createToken sendTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send createToken tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash};
    }

    /**
     *  Transfer token form a address to another address.
     *  @param {String} tokenid
     *  @param {String} to
     *  @param {String} amount
     *  @param {String} fee
     *  @param {String} secret
     *  @returns {Object} {hash: string}
     * */
    async transferTokenTo (tokenid, to, amount, fee, secret) {
        assert(tokenid, 'tokenid is required');
        assert(to, 'to address is required');
        assert(amount, 'amount is required');
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferTokenTo',
        tx.fee = new client.BigNumber(fee);
        tx.input = { tokenid, to, amount };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`transferTokenTo getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`transferTokenTo sendTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }

        // console.log(`send transferTokenTo tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash};
    }

    /**
     * Transfer INT.
     * @param {String} to
     * @param {String} amount
     * @param {String} fee
     * @param {String} secret
     * @returns {Object} {hash: string}
     * */
    async transferTo (to, amount, fee, secret) {
        assert(to, 'to address is required');
        assert(amount, 'amount is required');
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferTo';
        tx.value = new client.BigNumber(amount);
        tx.fee = new client.BigNumber(fee);
        tx.input = { to };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`transferTo getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`transferTo sendTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send transferTo tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Vote for peer.
     * @param {Array} candidates [string]
     * @param {String} fee
     * @returns {Object} {hash: string}
     * */
    async vote (candidates, fee, secret) {
        assert(candidates, 'candidates is required');
        assert(fee, 'fee is requied');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        tx.method = 'vote';
        tx.fee = new client.BigNumber(fee);
        tx.input = candidates;
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`vote failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`vote failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send vote tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * mortgage.
     * @param {String} amount
     * @Param {String} fee
     * @returns {Object} {hash: string}
     * */
    async mortgage (amount, fee, secret) {
        assert(amount, 'amount is required');
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        tx.method = 'mortgage';
        tx.fee = new client.BigNumber(fee);
        tx.value = new client.BigNumber(amount);
        tx.input = amount;
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`mortgage getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`mortgage sendTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send mortgage tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * unmortgage.
     * @param {String} amount
     * @param {String} fee
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async unmortgage (amount, fee, secret) {
        assert(amount, 'amount is required');
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        tx.method = 'unmortgage';
        tx.fee = new client.BigNumber(fee);
        tx.input = amount;
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`unmortgage failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`unmortgage failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send unmortgage tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * peer regist as miner
     * @param {String} fee
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async register (fee, secret) {
        assert(fee, 'fee is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        tx.method = 'register';
        tx.fee = new client.BigNumber(fee);
        tx.input = '';
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`register failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);
        let sendRet = await this.chainClient.sendTransaction({ tx });
        if (sendRet.err) {
            // console.error(`register failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send register tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * get vote.
     * @returns {Object} {vote: string}
     */
    async getVote () {
        let ret = await this.chainClient.view({
            method: 'getVote',
            params: {}
        });
        if (ret.err) {
            // console.error(`getVote failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        let vote = client.MapFromObject(ret.value);
        // for (let [k, v] of vote) {
        //     console.log(`${k}:${v.toString()}`);
        // }
        return {vote: vote};
    }

    /**
     * get stoke
     * @param {String} _address
     * @returns {String}
     */
    async getStoke (_address) {
        let ret = await this.chainClient.view({
            method: 'getStoke',
            params: { address: _address }
        });
        if (ret.err) {
            // console.error(`getStoke failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        // console.log(`${ret.value}`);
        return {stoke: ret.value.toString()};
    }

    /**
     * get all candidates.
     * @returns {Array}
     */
    async getCandidates () {
        let ret = await this.chainClient.view({
            method: 'getCandidates',
            params: {}
        });
        if (ret.err) {
            console.error(`getCandidates failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        // console.log(`${ret.value}`);
        return ret.value;
    }

    /**
     * send a transaction to the network.
     * @param {Object} params
     *
     * @example
     *  let params = {
     *      from: '12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ',
     *      method: 'transferTo',
     *      value: '1000',
     *      fee: '10',
     *      input: {to: '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79'},
     *      password: '123456789'
     *  }
     * @example
     *  let params = {
     *      from: '12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ',
     *      method: 'transferTokenTo',
     *      value: '0',
     *      fee: '10',
     *      input: {tokenid: 'BTC', to: '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79', amount: '1000'},
     *      password: '123456789'
     *  }
     *
     * @returns {Object}
     */
    async sendTransaction(params) {
        assert(params, 'params is required');

        let sendRet = await this.chainClient.sendTransaction(params);

        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }
        this.watchingTx.push(sendRet.hash);
        return {hash: sendRet.hash}
    }
    /**
     * send signed transaction.
     * @param {String} tx from writer.render()
     * @returns {Object} {hash: string}
     */
    async sendSignedTransaction (tx) {
        assert(tx, 'tx is required');

        let sendRet = await this.chainClient.sendSignedTransaction({tx});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)};
        }
        this.watchingTx.push(sendRet.hash);
        return {hash: sendRet.hash}
    }
}

module.exports = Intjs;