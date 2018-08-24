/**
 *@file    transactions.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    交易相关中间件
 */

"use strict";
const express = require('express');
const router = express.Router();
const IntTools = require('../index');

/**
 * host为peer节点的ip, port为peer节点启动的rpc端口
 * 如果启动的为本地 peer, host 则为 localhost
 * */
const inttools = new IntTools('localhost', 18089);


router.get('/transferTo/:to/:amount/:fee/:secret', async (req, res, next) => {
    let toAddress = req.params.to;
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await inttools.transferTo(toAddress, amount, fee, secret);

    res.send(result);
});

router.get('/register/:fee/:secret', async (req, res, next) => {
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await inttools.register(fee, secret);

    res.send(result);
});

module.exports = router;