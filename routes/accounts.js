/**
 *@file    accounts.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/21
 *@disc    帐户相关早间件
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


router.get('/create', async (req, res, next) => {

    let result = await inttools.create();

    res.send(result);
});

module.exports = router;