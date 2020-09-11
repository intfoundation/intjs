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
const util = require('util');

class Intjs {
    constructor (host, port, url) {
        this.m_addr = host;
        this.m_port = port;
        this.m_url = url;
        this.watchingTx = [];

        this.chainClient = new client.ChainClient({
            host,
            port,
            url
        });
        // this.chainClient.on('tipBlock', async (tipBlock) => {
        //     // console.log(`client onTipBlock, height ${tipBlock.number}`);
        //     for (let transaction of this.watchingTx.slice()) {
        //         let { err, block, tx, receipt } = await this.chainClient.getTransactionReceipt({ tx:transaction });
        //         if (!err) {
        //             let confirm = tipBlock.number - block.number + 1;
        //             if (confirm < 6) {
        //                 console.log(`tx:${transaction} receipt returnCode:${receipt.returnCode}, ${confirm} confirm`);
        //             }
        //             else {
        //                 console.log(`tx:${transaction} receipt returnCode:${receipt.returnCode}, confirmed`);
        //                 this.watchingTx.splice(this.watchingTx.indexOf(transaction), 1);
        //             }
        //         } else {
        //             console.error(`tx:${transaction} failed for ${errorCode[err].slice(7)}`);
        //             this.watchingTx.splice(this.watchingTx.indexOf(transaction), 1);
        //         }
        //     }
        // });
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
        assert(password, 'password is required');

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
     * Check INT address is valid or not.
     * @param {String} address
     * @returns {Boolean}
     */
    isValidAddress (address) {
        assert(address, 'address is required.');

        return client.isValidAddress(address);
    }

    /**
     * Create an account with keystore and address.
     * @param {String} password
     * @returns {String} address
     */
    async newAccount (password, privateKey) {
        assert(password, 'password is required');

        let params = {password, privateKey};
        let ret = await this.chainClient.newAccount(params);

        if (ret.err) {
          return {err: ret.err}
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
              return {err: ret.err}
          } else {
              return ret.accounts;
          }
      }

    /**
     * Get current price of the latest two blocks.
     * @returns {String}
     */
    async getPrice () {
        let ret = await this.chainClient.getPrice();

        if (ret.err) {
            return {err: ret.err}
        }

        return ret.price.toString();
    }

    /**
     * Get transaction limit with the transaction method name and input.
     * @param {String} method
     * @param {Object} input
     * @returns {String}
     */
    async getTransactionLimit (method, input) {
        assert(method, 'method is required');
        assert(input, 'input is required');

        let params = {method, input};

        let ret = await this.chainClient.getTransactionLimit(params);

        if (ret.err) {
            return {err: ret.err}
        }

        return ret.limit.toString();
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
            return {err: ret.err}
        }

        return ret;
    }

    /**
     * Get current block number.
     * @returns {Number} current block number
     */
    async getBlockNumber () {
        let params = {which: 'latest', transactions: false};
        let ret = await this.chainClient.getBlock(params);

        if (ret.err) {
            return {err: ret.err}
        } else {
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
            return {err: ret.err}
        }

        return ret;

    }

    /**
     * Get balance for a address.
     * @param {String} address
     * @returns {Object} {balance: string}
     * */
    async getBalance(address) {
        assert(address, 'address required');

        let ret = await this.chainClient.view({
            method: 'getBalance',
            params: { address: address }
        });
        if (ret.err) {
            return {err: ret.err};
        }
        return {balance: ret.value.toString()};
    }

    /**
     * Get token balance for a address.
     * @param {String} tokenid
     * @param {String} address
     * @returns {Object} {balance: string}
     * */
    async getTokenBalance (tokenid, address) {
        assert(tokenid,'tokenid is required');
        assert(address,'address is required');

        let ret = await this.chainClient.view({
            method: 'getTokenBalance',
            params: { address: address, tokenid: tokenid }
        });
        if (ret.err) {
            return {err: ret.err};
        }
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
     * @param {Object} data
     * @returns {Object} {hash: string}
     * */
    async createToken (amount, limit, price, name, symbol, secret, data) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');
        assert(name, 'name is required');
        assert(symbol, 'symbol is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'createToken';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = { tokenid: '', amount: amount, name, symbol };

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;

        let hash = client.encodeAddressAndNonce(address, tx.nonce);
        let tokenid = client.addressFromPublicKey(hash);
        tx.input.tokenid = tokenid;

        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash, tokenid: tokenid};
    }

    /**
     *  Transfer token form a address to another address.
     *  @param {String} tokenid
     *  @param {String} to
     *  @param {String} amount
     *  @param {String} limit
     *  @param {String} price
     *  @param {String} secret
     *  @param {Object} data
     *  @returns {Object} {hash: string}
     * */
    async transferTokenTo (tokenid, to, amount, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(to, 'to address is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferTokenTo';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = { tokenid, to, amount: amount };

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }

        this.watchingTx.push(tx.hash);
        return {hash: tx.hash};
    }

    /**
     * Get token all balance.
     * @param {String} tokenid
     * @returns {Object} {supply: string}
     */
    async getTokenTotalSupply (tokenid) {
        assert(tokenid, 'tokenid is required');

        let ret = await this.chainClient.view({
            method: 'getTokenTotalSupply',
            params: {tokenid: tokenid}
        });

        if (ret.err) {
            return {err: ret.err}
        }

        return {supply: ret.value.toString()}
    }

    /**
     * Transfer the ownership to the new owner.
     * @param {String} tokenid
     * @param {String} newOwner
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async transferOwnership (tokenid, newOwner, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(newOwner, 'newOwner is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferOwnership';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, newOwner};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Create minted tokens to the creator of the contract.
     * @param {String} tokenid
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async mintToken (tokenid, amount, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'mintToken';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount: amount};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Destroy tokens.
     * @param {String} tokenid
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async burn (tokenid, amount, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'burn';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount: amount};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
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
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async freezeAccount (tokenid, freezeAddress, freeze, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(freezeAddress, 'freezeAddress is required');
        assert(typeof freeze === "boolean");
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'freezeAccount';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, freezeAddress, freeze};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
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
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async approve (tokenid, amount, spender, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(amount, 'amount is required');
        assert(spender, 'spender is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'approve';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, amount: amount, spender};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
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
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async transferFrom (tokenid, from, to, amount, limit, price, secret, data) {
        assert(tokenid, 'tokenid is required');
        assert(from, 'from is required');
        assert(to, 'to is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferFrom';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {tokenid, from, to, amount: amount};

        if (data) {
            tx.input.data = data;
        }

        let {err, nonce} = await this.chainClient.getNonce({address});
        if (err) {
            return {err: err}
        }

        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({tx: writer.render().toString('hex')});
        if (sendRet.err) {
            return {err: sendRet.err}
        }

        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Transfer INT.
     * @param {String} to
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     * */
    async transferTo (to, amount, limit, price, secret, data) {
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

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Vote for peer.
     * @param {Array} candidates [string]
     * @param {String} limit
     * @param {String} price
     * @param {Object} data
     * @returns {Object} {hash: string}
     * */
    async vote (candidates, limit, price, secret, data) {
        assert(candidates, 'candidates is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'vote';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {candidates};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * mortgage.
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {Object} data
     * @returns {Object} {hash: string}
     * */
    async mortgage (amount, limit, price, secret, data) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'mortgage';
        tx.value = new client.BigNumber(amount);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {amount: amount};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }

        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Unmortgage.
     * @param {String} amount
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async unmortgage (amount, limit, price, secret, data) {
        assert(amount, 'amount is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();


        tx.method = 'unmortgage';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {amount: amount};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Peer regist as miner
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     */
    async register (coinbase, limit, price, secret, data) {
        assert(coinbase, 'coinbase is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'register';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {coinbase};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash}
    }

    /**
     * Get vote.
     * @returns {Object} {vote: Map}
     */
    async getVote () {
        let ret = await this.chainClient.view({
            method: 'getVote',
            params: {}
        });
        if (ret.err) {
            return {err: ret.err};
        }
        for (let i=0; i<ret.value.length; i++) {
            ret.value[i].vote = ret.value[i].vote.toString();
        }

        return ret.value;
    }

    /**
     * Get stake
     * @param {String} address
     * @returns {Object}
     */
    async getStake (address) {
        let ret = await this.chainClient.view({
            method: 'getStake',
            params: { address: address }
        });
        if (ret.err) {
            return {err: ret.err};
        }
        return {stake: ret.value.toString()};
    }

    /**
     * Get all candidates.
     * @returns {Array}
     */
    async getCandidates () {
        let ret = await this.chainClient.view({
            method: 'getCandidates',
            params: {}
        });
        if (ret.err) {
            return {err: ret.err};
        }
        return ret.value;
    }

    /**
     * Create an new transaction.
     * @param {Object} params
     *
     * @example
     *  let params = {
     *      from: 'INT12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ',
     *      method: 'transferTo',
     *      value: '1000',
     *      limit: '100000',
     *      price: '30000000000',
     *      input: {to: 'INT1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79'},
     *      password: '123456789',
     *      data: {...}
     *  }
     * @example
     *  let params = {
     *      from: 'INT12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ',
     *      method: 'transferTokenTo',
     *      value: '0',
     *      limit: '100000',
     *      price: '30000000000',
     *      input: {tokenid: 'INT17YsGmQ8FcqPy9C99McgebWrs5UrYxXY2Z', to: 'INT1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79', amount: '1000'},
     *      password: '123456789',
     *      data: {...}
     *  }
     *
     * @returns {Object}
     */
    async sendTransaction(params) {
        assert(params, 'params is required');

        let sendRet = await this.chainClient.sendTransaction(params);

        if (sendRet.err) {
            return {err: sendRet.err}
        }
        this.watchingTx.push(sendRet.hash);
        return {hash: sendRet.hash}
    }
    /**
     * Create an new transaction with signed data.
     * @param {String} tx from writer.render().toString('hex)
     * @returns {Object} {hash: string}
     */
    async sendSignedTransaction (tx) {
        assert(tx, 'tx is required');

        let sendRet = await this.chainClient.sendSignedTransaction({tx});
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(sendRet.hash);
        return {hash: sendRet.hash};
    }

    /**
     * Get the number of transactions sent from an address.
     * @param {String} address
     * @returns {Object} {nonce: string}
     */
    async getNonce (address) {
        assert(address, 'address is required');

        let sendRet = await this.chainClient.getNonce({address});
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        return {nonce: sendRet.nonce}
    }

    /**
     * Get miners list.
     * @returns {Object} miner list
     */
    async getMiners () {
        let ret = await this.chainClient.view({
            method: 'getMiners',
            params: {}
        });
        if (ret.err) {
            return {err: ret.err};
        }

        return {miners: ret.value};
    }

    /**
     * Get pending transactions.
     * @returns {Object} {pendingTransactions: object}
     */
    async getPendingTransactions() {
        let sendRet = await this.chainClient.getPendingTransactions();
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        return sendRet.pendingTransactions;
    }

    /**
     * Lock some INT in the contract.
     * @param {String} amount
     * @param {String} lockaddress
     * @param {Array} schedule [ { time: number(timestamp) , value: string }, ..., { time: number(timestamp) , value: string }]
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string, contractid: string}
     * */
    async lockAccount (amount, lockaddress, schedule, limit, price, secret, data) {
        assert(amount, 'amount is required');
        assert(lockaddress, 'lockaddress is required');
        assert(schedule, 'schedule is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'lockAccount';
        tx.value = new client.BigNumber(amount);
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {contractid: '', lockaddress, schedule};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;

        let hash = client.encodeAddressAndNonce(address, tx.nonce);
        let contract = client.addressFromPublicKey(hash);
        tx.input.contractid = contract;

        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash, contractid: contract};
    }


    /**
     * Transfer INT from a locked contract.
     * @param {String} contractid
     * @param {String} limit
     * @param {String} price
     * @param {String} secret
     * @param {Object} data
     * @returns {Object} {hash: string}
     * */
    async transferFromLockAccount (contractid, limit, price, secret, data) {
        assert(contractid, 'contractid is required');
        assert(limit, 'limit is required');
        assert(price, 'price is required');
        assert(secret, 'secret is required');

        let address = client.addressFromSecretKey(secret);
        let tx = new client.ValueTransaction();

        tx.method = 'transferFromLockAccount';
        tx.value = new client.BigNumber('0');
        tx.limit = new client.BigNumber(limit);
        tx.price = new client.BigNumber(price);
        tx.input = {contractid};

        if (data) {
            tx.input.data = data;
        }

        let { err, nonce } = await this.chainClient.getNonce({ address });
        if (err) {
            return {err: err};
        }
        tx.nonce = nonce + 1;
        tx.sign(secret);

        let writer = new client.BufferWriter();
        let errTx = tx.encode(writer);
        if (errTx) {
            return {err: errTx}
        }

        let sendRet = await this.chainClient.sendSignedTransaction({ tx: writer.render().toString('hex') });
        if (sendRet.err) {
            return {err: sendRet.err};
        }
        this.watchingTx.push(tx.hash);
        return {hash: tx.hash };
    }

}

module.exports = Intjs;
