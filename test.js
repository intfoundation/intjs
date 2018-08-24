const IntTools = require('./index');
const inttools = new IntTools('localhost', 18089);
// const inttools = new IntTools('40.73.33.203', 12202);
// const inttools = new IntTools('220.191.39.46', 12202);


setTimeout(async () => {
    let balance1 = await inttools.getBalance('1LuwjNj8wkqo237N7Gh8nZSSvUa6TZ5ds4');
    console.log(balance1)

    // console.log(inttools.chainClient);

    // let balance2 = await inttools.getBalance('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ');
    // console.log(Number(balance2));

    // let account = await inttools.create();
    // console.log(account);

    // let pubkey = await inttools.privateKeyToPublicKey(account.serect);
    // console.log(pubkey);

    // let addr = await inttools.publicKeyToAddress(pubkey.pubkey);
    // console.log(addr);

    // let block = await inttools.getBlock('d53cf2c62589c56b681b195b0f18a22c87a2678d0aa23c5f5f912e1eb3981224', true);
    // console.log(block);

    // let hash = await inttools.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '100', '10', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    // console.log(hash);

    // let Receipt = await inttools.getTransactionReceipt('6e19650790fbd9f79c77e500ab905f82e7907dd335a4e7d7cf3e5b8352a2c543');
    // console.log(Receipt);

    // let morHash = await inttools.mortgage('1000', '10', 'c07ad83d2c5627acece18312362271e22d7aeffb6e2a6e0ffe1107371514fdc2');
    // console.log(morHash);


    // let voteHash = await inttools.vote(['1LuwjNj8wkqo237N7Gh8nZSSvUa6TZ5ds4','13CS9dBwmaboedj2hPWx6Dgzt4cowWWoNZ'], '100', 'c07ad83d2c5627acece18312362271e22d7aeffb6e2a6e0ffe1107371514fdc2');
    // console.log(voteHash);


    // let vote = await inttools.getVote('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ');
    // console.log(vote);

    // let candidate = await inttools.getCandidates();
    // console.log(candidate);

    // let stoke = await inttools.getStoke('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ');
    // console.log(stoke);

    // let hash = await inttools.register('100', '9b55dea11fc216e768bf436d0efe9e734ec7bc9e575a935ae6203e5e99dae5ac');
    // console.log(hash);

    // let tokenHash = await inttools.createToken('INT', [{address:'1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79',amount:'100000000'}], '1000000000', '10', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    // console.log(tokenHash);

    // let tokenBalance = await inttools.getTokenBalance('INT', '1EYLLvMtXGeiBJ7AZ6KJRP2BdAQ2Bof79');
    // console.log(tokenBalance);

    let blindHash = await inttools.blindauction('100', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
    console.log(blindHash);
},1000);

// setInterval(async () => {
//     let hash = await inttools.transferTo('12nD5LgUnLZDbyncFnoFB43YxhSFsERcgQ', '100', '10', '64d8284297f40dc7475b4e53eb72bc052b41bef62fecbd3d12c5e99b623cfc11');
//     console.log(hash);
// }, 10000);