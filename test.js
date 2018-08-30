const Intjs = require('./index');
const intjs = new Intjs('localhost', 18089);
// const intjs = new Intjs('40.73.33.203', 12202);


setTimeout(async () => {
    let balance1 = await intjs.getBalance('1LuwjNj8wkqo237N7Gh8nZSSvUa6TZ5ds4');
    console.log(balance1)

    // console.log(intjs.chainClient);

    // let balance2 = await intjs.getBalance('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ');
    // console.log(Number(balance2));

    // let account = await intjs.create();
    // console.log(account);

    // let pubkey = await intjs.privateKeyToPublicKey(account.serect);
    // console.log(pubkey);

    // let addr = await intjs.publicKeyToAddress(pubkey.pubkey);
    // console.log(addr);

    let block = await intjs.getBlock('0d904e48266da643f78117b134fc22c51cb0c0827c58bbe31d638f746cd910b3', true);
    console.log(block);

    // let hash = await intjs.transferTo('1CHpy1NayZHXxLe21LuzpTMLSs32Xk9D1K', '100000', '0', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    // console.log(hash);

    // let Receipt = await intjs.getTransactionReceipt('ee00fb256268b29c83ec16c01c8e71d630e0f89b7c2a9b62121954bdac412d80');
    // console.log(Receipt);

    // let morHash = await intjs.mortgage('1000', '10', 'c07ad83d2c5627acece18312362271e22d7aeffb6e2a6e0ffe1107371514fdc2');
    // console.log(morHash);


    // let voteHash = await intjs.vote(['1C8sQHNV7z16hf4hxamYC3ypynkyG1yzYK'], '1000', 'c07ad83d2c5627acece18312362271e22d7aeffb6e2a6e0ffe1107371514fdc2');
    // console.log(voteHash);


    // let vote = await intjs.getVote();
    // console.log(vote);

    // let candidate = await intjs.getCandidates();
    // console.log(candidate);

    // let stoke = await intjs.getStoke('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ');
    // console.log(stoke);

    // let hash = await intjs.register('100', 'a793c76436584dc734ebddfde836e6fc73888f72966e299011b70f380135aadb');
    // console.log(hash);

    // let tokenHash = await intjs.createToken('INT', [{address:'1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79',amount:'100000000'}], '1000000000', '10', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    // console.log(tokenHash);

    // let tokenBalance = await intjs.getTokenBalance('INT', '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79');
    // console.log(tokenBalance);

    // let blindHash = await intjs.blindauction('100', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    // console.log(blindHash);

    // let l = intjs.chainClient.getMinerWageListener();
    // let wage = await l(2);
    // console.log(wage);
},1000);

// setInterval(async () => {
//     let hash1 = await intjs.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '10', '1', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
//     console.log(hash1);
    // let hash2 = await intjs.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '10', '1', 'c07ad83d2c5627acece18312362271e22d7aeffb6e2a6e0ffe1107371514fdc2');
    // console.log(hash2);
    // let hash3 = await intjs.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '10', '1', '9b55dea11fc216e768bf436d0efe9e734ec7bc9e575a935ae6203e5e99dae5ac');
    // console.log(hash3);
    // let hash4 = await intjs.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '10', '1', 'e109b61f011c9939ac51808fac542b66fcb358f69bf710f5d11eb5d1f3e82bc3');
    // console.log(hash4);
// }, 1000);
