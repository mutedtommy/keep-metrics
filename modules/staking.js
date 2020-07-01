const Web3 = require('web3');
const dotenv = require('dotenv');
const constants = require ('./constants');
const contractService = require ('./contracts.service')
const BigNumber = require('bignumber.js');


const getDateTimeUTC = (timeStamp) =>{
    const startEpoch = new Date(timeStamp*1000);
    const days = {
        1:"Monday",
        2: "Tuesday", 
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
        7: "Sunday"
    }
    const day = days[startEpoch.getUTCDay()];
    const dateTime = `${day} ${startEpoch.getUTCMonth()}/${startEpoch.getUTCDate()}/${startEpoch.getUTCFullYear()} ${startEpoch.getUTCHours()}:${startEpoch.getUTCMinutes()}:${startEpoch.getUTCSeconds()}`;
    return dateTime;
}

async function stakingInfo (web3Context, operatorContractAddress, stakerAddress, keepTokenGrant) {
//web3Context = staking contract object in param

    let stakingInfo = {};
    //const sortitionPoolContract = new web3.eth.Contract(sortitionPoolABI.abi, sortitionPoolABI.networks["3"].address);

    

    //min stake
    const minStakeRaw = await contractService.makeCall(web3Context, "minimumStake");
    let minStakeBig = new BigNumber(parseInt(minStakeRaw));
    let minStake = minStakeBig.div(10**18).toNumber();

    
    //undelegation period
    const undelegationPeriod = Number (await contractService.makeCall(web3Context, "undelegationPeriod"));
    const undelegationPeriodDays = undelegationPeriod/86400;
    //console.log(typeof(undelegationPeriod));
    const maxLockDuration = Number (await contractService.makeCall(web3Context, "maximumLockDuration"));
    const maxLockDurationDays = maxLockDuration/86400;

    const minStakeScheduleStartTime = Number (await contractService.makeCall(web3Context, "minimumStakeScheduleStart"));
    const minStakeScheduleTime = getDateTimeUTC(minStakeScheduleStartTime);
    const tokenGrant = await contractService.makeCall(web3Context, "tokenGrant");
    const authoritySource = await contractService.makeCall(web3Context, "getAuthoritySource", stakerAddress);
    const isAuthorizedForOperator = await contractService.makeCall(web3Context, "isAuthorizedForOperator", stakerAddress, operatorContractAddress);
    const isStakeLocked = await contractService.makeCall(web3Context, "isStakeLocked", stakerAddress);
    const escrow = await contractService.makeCall(web3Context, "escrow");
    const beneficiary = await contractService.makeCall(web3Context, "beneficiaryOf", stakerAddress);
    //const locks = await contractService.makeCall(web3Context, "getLocks", stakerAddress);
    //const activeStake = await contractService.makeCall(web3Context, "activeStake", stakerAddress, operatorContractAddress);
    //

    //balance info
    const balanceRaw = await contractService.makeCall(keepTokenGrant, "balanceOf", stakerAddress);
    let balanceBig = new BigNumber(parseInt(balanceRaw));
    let balance = balanceBig.div(10**18).toNumber();
    //const operators_ = await contractService.makeCall(web3Context, "operatorsOf", web3Context._address);


    const grantDetails = await contractService.makeCall(keepTokenGrant, "getGrantStakeDetails", stakerAddress);


    const activeStakeRaw = await contractService.makeCall(web3Context, "activeStake", stakerAddress, operatorContractAddress);
    const activeStakeBig = new BigNumber(parseInt(activeStakeRaw));
    const activeStake = activeStakeBig.div(10**18).toNumber();
    
    
    const delegationInfo = await contractService.makeCall(web3Context, "getDelegationInfo", stakerAddress);
    const delegationTime = getDateTimeUTC(delegationInfo.createdAt);
    const currentDelegatedAmountRaw = new BigNumber(parseInt(delegationInfo.amount));
    const currentDelegatedAmount = currentDelegatedAmountRaw.div(10**18).toNumber();

    const remainingBalance = balance - currentDelegatedAmount;

    
    // Result {
    //     '0': '283000000000000000000000',
    //     '1': '1588894756',
    //     '2': '0',
    //     amount: '283000000000000000000000',
    //     createdAt: '1588894756', //time in epoch
    //     undelegatedAt: '0'
    //   }


    //console.log(operators_);
    return stakingInfo = {
        'undelegationPeriod': undelegationPeriodDays, 
        'minimumStake': minStake,
        'isStakeLocked': isStakeLocked,
        'maxLockDuration': maxLockDurationDays,
        'isAuthorisedAsOperator': isAuthorizedForOperator, 
        'authorisedBy': authoritySource,
        'balance': remainingBalance,
        'currentDelegation': currentDelegatedAmount,
        'delegationTime': delegationTime,
        'activeStake': activeStake,
        'beneficiary': beneficiary
    };
};



module.exports = {
    stakingInfo, 
    getDateTimeUTC
};