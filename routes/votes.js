/**
 *@file    vote.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    投票相关中间件
 */

"use strict";
const express = require('express');
const router = express.Router();
const Intjs = require('../index');
const rpcConfig = require('../config/rpcconfig');

/**
 * host为peer节点的ip, port为peer节点启动的rpc端口
 * 如果启动的为本地 peer, host 则为 localhost
 * */
const intjs = new Intjs(rpcConfig.host, rpcConfig.port);


router.get('/voteToPeer', async (req, res, next) => {
    req.on('data', async (chunk) => {
        let chunkData = JSON.parse(chunk.toString());
        let candidates = chunkData.candidates;
        let fee = req.params.fee;
        let secret = req.params.secret;

        let result = await intjs.vote(candidates, fee, secret);

        res.send(result);
    });
});

router.get('/mortgage/:mount/:fee/:secret', async (req, res, next) => {
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.mortgage(amount, fee, secret);

    res.send(result);
});

router.get('/unmortgage/:mount/:fee/:secret', async (req, res, next) => {
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.unmortgage(amount, fee, secret);

    res.send(result);
});
module.exports = router;