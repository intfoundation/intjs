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
                            console.log(`tx:${tx} ${confirm} confirm`);
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
     * Create an account with public key and private key.
     * @returns {address: string, secret: string}
     */
    create () {
        let [key, secret] = client.createKeyPair();
        let address = client.addressFromPublicKey(key);

        return {address: address, secret: secret.toString('hex')}
    }
    /**
     * Encrypt a private key to keyStore.
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
     * Decrypt a keystore to the account.
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
     * Create public key from private key.
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
     * Create address from public key.
     * @param {String} pubkey
     * @returns {Object}
     */
    publicKeyToAddress (pubkey) {
      assert(pubkey, 'public key is required.');

      let address = client.addressFromPublicKey(pubkey);

      return {address: address}
    }

    /**
     * Create an account with keystore and address.
     * @param {String} password
     * @returns {String} address
     */
    async newAccount (password) {
        assert(password, 'password is required');

        let params = {password};
        let ret = await this.chainClient.newAccount(params);

        if (ret.err) {
          return {err: errorCode[ret.err].slice(7)}
        } else {
          return ret.address;
        }
    }

    /**
     * Read keystore files.
     * @returns {Array} array of keystore file name
     */
    async getAccounts () {
          let ret = await this.chainClient.getAccounts();

          if (ret.err) {
              return {err: errorCode[ret.err].slice(7)}
          } else {
              return ret.accounts;
          }
      }

    /**
     * Read keystore.
     * @param {String} address
     * @returns {JSON} keystore
     */
    async readKeystore (address) {
        assert(address, 'address is required');

        let params = {address: address};

        let ret = await this.chainClient.readKeystore(params);

        if (ret.err) {
            return {err: errorCode[ret.err].slice(7)}
        } else {
          return ret.keystore;
        }
      }

    /**
     * Get current price of latest two blocks.
     * @returns {Number}
     */
    async getPrice () {
        let cn = 0;
        let txs = [];
        let params = {which: 'latest', transactions: true};
        let br = await this.chainClient.getBlock(params);

        if (br.err) {
            return {err: errorCode[br.err].slice(7)}
        } else {
            cn = br.block.number;
            txs.push(br.transactions);
        }

        if (cn && cn >=1) {
            let nbr = await this.chainClient.getBlock({which: (cn -1), transactions: true});
            if (nbr.err) {
                return {err: errorCode[nbr.err].slice(7)}
            } else {
                txs.push(nbr.transactions);
            }
        }

        if (txs && txs.length >= 20) {
            let totalPrice = 0;
            txs.forEach(function (value){
                totalPrice += Number(value.price);
            });
            return totalPrice/txs.length;
        } else {
            return 200000000000;
        }
    }
    /**
     * Get a block matching the block hash or block number.
     * @param {String|Number} which
     * @param {Boolean} transactions  default false,if true, the block will contain all transactions.
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
     * Get current block number.
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
     * Get transaction receipt by transaction hash.
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
     * Get token balance for a address.
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
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {String} name
     * @param {String} symbol
     * @returns {Object} {hash: string}
     * */
    async createToken (amount, limit, price, name, symbol, secret) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');
        assert(name, 'name is required');
        assert(symbol, 'symbol is required');

        let address = client.addressFromSecretKey(secret);
        let contract = this.create().address;
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'createToken';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = { tokenid: contract, amount, name, symbol };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`createToken getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
        if (sendRet.err) {
            // console.error(`createToken sendSignedTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send createToken tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash, tokenid: contract};
    }

    /**
     *  Transfer token form a address to another address.
     *  @param {String} tokenid
     *  @param {String} to
     *  @param {String} amount
     *  @param {String} limit
     *  @param {String} price
     *  @param {String} secret
     *  @returns {Object} {hash: string}
     * */
    async transferTokenTo (tokenid, to, amount, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(to, 'to address is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'transferTokenTo';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = { tokenid, to, amount };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`transferTokenTo getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
        if (sendRet.err) {
            // console.error(`transferTokenTo sendSignedTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }

        // console.log(`send transferTokenTo tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash};
    }

    /**
     * Get token all balance.
     * @param {String} tokenid
     * @returns {Object} {balance: string}
     */
    async getTokenTotalSupply (tokenid) {
        assert(tokenid, 'tokenid is required');

        let ret = await this.chainClient.view({
            method: 'getTokenTotalSupply',
            params: {tokenid: tokenid}
        });

        if (ret.err) {
            return {err: errorCode[ret.err].slice(7)}
        }

        return {balance: ret.value.toString()}
    }

    /**
     * Transfer the ownership to the new owner.
     * @param {String} tokenid
     * @param {String} newOwner
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async transferOwnership (tokenid, newOwner, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(newOwner, 'newOwner is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferOwnership';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, newOwner};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }

    /**
     * Create minted tokens to the creator of the contract.
     * @param {String} tokenid
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async mintToken (tokenid, amount, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'mintToken';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }

    /**
     * Destroy tokens.
     * @param {String} tokenid
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async burn (tokenid, amount, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'burn';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }

    /**
     * Freeze account.
     * @param {String} tokenid
     * @param {String} freezeAddress
     * @param {Boolean} freeze
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async freezeAccount (tokenid, freezeAddress, freeze, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(freezeAddress, 'freezeAddress is required');
        assert(typeof freeze === "boolean");
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'freezeAccount';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, freezeAddress, freeze};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }

    /**
     * Set allowance for other address.
     * @param {String} tokenid
     * @param {String} amount
     * @param {String} spender
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async approve (tokenid, amount, spender, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(spender, 'spender is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(0);

        tx.method = 'approve';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount, spender};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }
    /**
     * Transfer tokens from other address.
     * @param {String} tokenid
     * @param {String} from
     * @param {String} to
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async transferFrom (tokenid, from, to, amount, limit, price, secret) {
        assert(tokenid, 'tokenid is required');
        assert(from, 'from is required');
        assert(to, 'to is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'transferFrom';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, from, to, amount};

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: errorCode[err].slice(7)}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render()});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)}
        }

        return {hash: tx.hash}
    }

    /**
     * Transfer INT.
     * @param {String} to
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     * */
    async transferTo (to, amount, limit, price, secret) {
        assert(to, 'to address is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferTo';
        tx.value = new client.BigNumber(amount);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = { to };

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`transferTo getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
        if (sendRet.err) {
            // console.error(`transferTo sendSignedTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send transferTo tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Vote for peer.
     * @param {Array} candidates [string]
     * @param {String} limit
     * @param {String} price
     * @returns {Object} {hash: string}
     * */
    async vote (candidates, limit, price, secret) {
        assert(candidates, 'candidates is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'vote';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {candidates};
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`vote failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
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
     * @param {String} limit
     * @param {String} price
     * @returns {Object} {hash: string}
     * */
    async mortgage (amount, limit, price, secret) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'mortgage';
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.value = amount;
        tx.input = {amount};
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`mortgage getNonce failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
        if (sendRet.err) {
            // console.error(`mortgage sendSignedTransaction failed for ${sendRet.err}`);
            return {err: errorCode[sendRet.err].slice(7)};
        }
        // console.log(`send mortgage tx: ${tx.hash}`);
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * unmortgage.
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async unmortgage (amount, limit, price, secret) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();
        let amount = new client.BigNumber(amount);

        tx.method = 'unmortgage';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {amount};
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`unmortgage failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
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
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @returns {Object} {hash: string}
     */
    async register (limit, price, secret) {
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'register';
        tx.value = new client.BigNumber(0);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {};
        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            // console.error(`register failed for ${err}`);
            return {err: errorCode[err].slice(7)};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errorCode[errTx].slice(7)}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render() });
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
     * @returns {Object} {vote: Map}
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
     * get stake
     * @param {String} _address
     * @returns {Object}
     */
    async getStake (_address) {
        let ret = await this.chainClient.view({
            method: 'getStake',
            params: { address: _address }
        });
        if (ret.err) {
            // console.error(`getStake failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        // console.log(`${ret.value}`);
        return {stake: ret.value.toString()};
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
            // console.error(`getCandidates failed for ${ret.err};`);
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
     *      limit: '100000',
     *      price: '30000000000',
     *      input: {to: '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79'},
     *      password: '123456789'
     *  }
     * @example
     *  let params = {
     *      from: '12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ',
     *      method: 'transferTokenTo',
     *      value: '0',
     *      limit: '100000',
     *      price: '30000000000',
     *      input: {tokenid: '17YsGmQ8FcqPy9C99McgebWrs5UrYxXY2Z', to: '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79', amount: '1000'},
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
     * @param {Buffer} tx from writer.render()
     * @returns {Object} {hash: string}
     */
    async sendSignedTransaction (tx) {
        assert(tx, 'tx is required');

        let sendRet = await this.chainClient.sendSignedTransaction({tx});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)};
        }
        this.watchingTx.push(sendRet.hash);
        return {hash: sendRet.hash};
    }

    /**
     * get address nonce.
     * @param {String} address
     * @returns {Object} {nonce: string}
     */
    async getNonce (address) {
        assert(address, 'address is required');

        let sendRet = await this.chainClient.getNonce({address});
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)};
        }
        return {nonce: sendRet.nonce}
    }

    /**
     * get miners list.
     * @returns {Object} miner list
     */
    async getMiners () {
        let ret = await this.chainClient.view({
            method: 'getMiners',
            params: {}
        });
        if (ret.err) {
            // console.error(`getVote failed for ${ret.err};`);
            return {err: errorCode[ret.err].slice(7)};
        }
        let miners = client.MapFromObject(ret.value);
        // for (let [k, v] of vote) {
        //     console.log(`${k}:${v.toString()}`);
        // }
        return {miners: miners};
    }

    /**
     * get pending transactions.
     * @param
     * @returns {Object} {pendingTransactions: object}
     */
    async getPendingTransactions() {
        let sendRet = await this.chainClient.getPendingTransactions();
        if (sendRet.err) {
            return {err: errorCode[sendRet.err].slice(7)};
        }
        return sendRet.pendingTransactions;
    }

}

module.exports = Intjs;