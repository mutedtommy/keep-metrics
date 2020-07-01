const contractService = require ('./contracts.service');
const managedGrantABI = require("@keep-network/keep-core/artifacts/ManagedGrantFactory.json")
const moment = require ('moment');


// import {
//   TOKEN_STAKING_CONTRACT_NAME,
//   TOKEN_GRANT_CONTRACT_NAME,
// } from "../constants/constants"
// import moment from "moment"
// import { isCodeValid, createManagedGrantContractInstance } from "../contracts"


const fetchDelegatedTokensData = async (stakingContract, requestorAddress, grantContract, web3) => {

//const requestorAddress = "0x91e865ab158c380eee8cab7a819533976d75d445";

    const [
        stakedBalance,
        ownerAddress,
        beneficiaryAddress,
        authorizerAddress,
        initializationPeriod 
    ] = await Promise.all([
        contractService.makeCall(
          stakingContract,
          "balanceOf",
          requestorAddress
        ),
        contractService.makeCall(
          stakingContract,
          "ownerOf",
          requestorAddress
        ),
        contractService.makeCall(
          stakingContract,
          "beneficiaryOf",
          requestorAddress
        ),
        contractService.makeCall(
          stakingContract,
          "authorizerOf",
          requestorAddress
        ),
        contractService.makeCall(
          stakingContract,
          "initializationPeriod"
        ),
      ]);

    let isUndelegationFromGrant = true;
    let grantStakeDetails;
    try {
        grantStakeDetails = await grantContract.methods
        .getGrantStakeDetails(requestorAddress)
        .call()
    } catch (error) {
        isUndelegationFromGrant = false
    }


    let isManagedGrant = false
    if (isUndelegationFromGrant) {
        const { grantee } = await contractService.makeCall(
            grantContract,
            "getGrant",
            grantStakeDetails.grantId
        )
        // check if grantee is a contract
        const code = await web3.eth.getCode(grantee)
        if (code && code !== "0x0" && code !== "0x") {
            isManagedGrant = true
        }
    }

    const {
        undelegationStatus,
        delegationData,
        undelegationPeriod,
        delegationStatus,
        undelegationCompletionDate,
        undelegatedDate
    } = await fetchPendingUndelegation(stakingContract, requestorAddress)
    const { createdAt } = delegationData
    const initializationOverAt = moment
        .unix(createdAt)
        .add(initializationPeriod, "seconds")
    const isInInitializationPeriod = moment().isSameOrBefore(initializationOverAt)

    const createdMoment = moment
        .unix(createdAt)
    const createdDate = `${createdMoment._d.getUTCDate()}-${createdMoment._locale._months[createdMoment._d.getUTCMonth()]}-${createdMoment._d.getUTCFullYear()} ${createdMoment._d.getUTCHours()}:${createdMoment._d.getUTCMinutes()}:${createdMoment._d.getUTCSeconds()} (UTC)`;

      return {
            'stakerAddress': requestorAddress,
            createdDate,
            stakedBalance,
            ownerAddress,
            beneficiaryAddress,
            authorizerAddress,
            undelegationStatus,
            delegationData,
            undelegationPeriod,
            delegationStatus,
            undelegationCompletionDate,
            undelegatedDate,
            undelegationCompletionDate,
            isInInitializationPeriod,
            isManagedGrant
      }
}

const fetchPendingUndelegation = async (stakingContract, requestorAddress) => {
  //const { yourAddress } = web3Context
  let [delegation, undelegationPeriod] = await Promise.all([
    contractService.makeCall(
      stakingContract,
      "getDelegationInfo",
      requestorAddress
    ),
    contractService.makeCall(
      stakingContract,
      "undelegationPeriod"
    ),
  ])

  const { undelegatedAt, createdAt, amount } = delegation;

  const isUndelegation = delegation.undelegatedAt !== "0";

  const undelegatedMoment= isUndelegation ? moment.unix(undelegatedAt) : 0
  const undelegatedDate = (undelegatedMoment !==0) ? `${undelegatedMoment._d.getUTCDate()}-${undelegatedMoment._locale._months[undelegatedMoment._d.getUTCMonth()]}-${undelegatedMoment._d.getUTCFullYear()} ${undelegatedMoment._d.getUTCHours()}:${undelegatedMoment._d.getUTCMinutes()}:${undelegatedMoment._d.getUTCSeconds()} (UTC)` : null



  const pendingUnstakeBalance = isUndelegation ? delegation.amount : 0
  const undelegationCompletedAt = isUndelegation
    ? moment.unix(undelegatedAt).add(undelegationPeriod, "seconds")
    : null

   const undelegationCompletionDate =  (undelegationCompletedAt !== null) ? `${undelegationCompletedAt._d.getUTCDate()}-${undelegationCompletedAt._locale._months[undelegationCompletedAt._d.getUTCMonth()]}-${undelegationCompletedAt._d.getUTCFullYear()} ${undelegationCompletedAt._d.getUTCHours()}:${undelegationCompletedAt._d.getUTCMinutes()}:${undelegationCompletedAt._d.getUTCSeconds()} (UTC)` : null

  let delegationStatus
  if (amount !== "0" && createdAt !== "0" && undelegatedAt !== "0") {
    // delegation undelegated
    delegationStatus = "UNDELEGATED"
  } else if (amount === "0" && createdAt !== "0" && undelegatedAt === "0") {
    // delegation canceled
    delegationStatus = "CANCELED"
  } else if (amount === "0" && createdAt !== "0" && undelegatedAt !== "0") {
    // delegation recovered
    delegationStatus = "RECOVERED"
  } else if (amount !== "0" && createdAt !== "0" && undelegatedAt === "0") {
    delegationStatus = "DELEGATED"
  }

  return {
    pendingUnstakeBalance,
    undelegationCompletionDate,
    undelegatedDate,
    undelegationCompletedAt,
    undelegationPeriod,
    delegationStatus,
    delegationData: delegation
  }
}


// const fetchDelegatedTokensData = async (web3Context) => {
//   const { yourAddress, grantContract, eth, web3 } = web3Context
//   const [
//     stakedBalance,
//     ownerAddress,
//     beneficiaryAddress,
//     authorizerAddress,
//     initializationPeriod,
//   ] = await Promise.all([
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "balanceOf",
//       yourAddress
//     ),
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "ownerOf",
//       yourAddress
//     ),
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "beneficiaryOf",
//       yourAddress
//     ),
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "authorizerOf",
//       yourAddress
//     ),
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "initializationPeriod"
//     ),
//   ])

//   let isUndelegationFromGrant = true
//   let grantStakeDetails
//   try {
//     grantStakeDetails = await grantContract.methods
//       .getGrantStakeDetails(yourAddress)
//       .call()
//   } catch (error) {
//     isUndelegationFromGrant = false
//   }

//   let isManagedGrant = false
//   let managedGrantContractInstance
//   if (isUndelegationFromGrant) {
//     const { grantee } = await contractService.makeCall(
//       web3Context,
//       TOKEN_GRANT_CONTRACT_NAME,
//       "getGrant",
//       grantStakeDetails.grantId
//     )
//     // check if grantee is a contract
//     const code = await eth.getCode(grantee)
//     if (isCodeValid(code)) {
//       managedGrantContractInstance = createManagedGrantContractInstance(
//         web3,
//         grantee
//       )
//       isManagedGrant = true
//     }
//   }

//   const {
//     undelegationStatus,
//     delegationData,
//     undelegationPeriod,
//     delegationStatus,
//     undelegationCompletedAt,
//   } = await fetchPendingUndelegation(web3Context)
//   const { createdAt } = delegationData
//   const initializationOverAt = moment
//     .unix(createdAt)
//     .add(initializationPeriod, "seconds")
//   const isInInitializationPeriod = moment().isSameOrBefore(initializationOverAt)

//   return {
//     stakedBalance,
//     ownerAddress,
//     beneficiaryAddress,
//     authorizerAddress,
//     undelegationStatus,
//     isUndelegationFromGrant,
//     isInInitializationPeriod,
//     undelegationPeriod,
//     isManagedGrant,
//     managedGrantContractInstance,
//     delegationStatus,
//     undelegationCompletedAt,
//   }
// }

// const fetchPendingUndelegation = async (web3Context) => {
//   const { yourAddress } = web3Context
//   const [delegation, undelegationPeriod] = await Promise.all([
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "getDelegationInfo",
//       yourAddress
//     ),
//     contractService.makeCall(
//       web3Context,
//       TOKEN_STAKING_CONTRACT_NAME,
//       "undelegationPeriod"
//     ),
//   ])

//   const { undelegatedAt, createdAt, amount } = delegation

//   const isUndelegation = delegation.undelegatedAt !== "0"
//   const pendingUnstakeBalance = isUndelegation ? delegation.amount : 0
//   const undelegationCompletedAt = isUndelegation
//     ? moment.unix(undelegatedAt).add(undelegationPeriod, "seconds")
//     : null

//   let delegationStatus
//   if (amount !== "0" && createdAt !== "0" && undelegatedAt !== "0") {
//     // delegation undelegated
//     delegationStatus = "UNDELEGATED"
//   } else if (amount === "0" && createdAt !== "0" && undelegatedAt === "0") {
//     // delegation canceled
//     delegationStatus = "CANCELED"
//   } else if (amount === "0" && createdAt !== "0" && undelegatedAt !== "0") {
//     // delegation recovered
//     delegationStatus = "RECOVERED"
//   }

//   return {
//     pendingUnstakeBalance,
//     undelegationCompletedAt,
//     undelegationPeriod,
//     delegationStatus,
//     delegationData: delegation,
//   }
// }

// export const operatorService = {
//   fetchDelegatedTokensData,
//   fetchPendingUndelegation,
// }

module.exports = {
  fetchDelegatedTokensData,
  fetchPendingUndelegation
}



// const getDateTimeUTC = (timeStamp) =>{
//     const startEpoch = new Date(timeStamp*1000);
//     const days = {
//         1:"Monday",
//         2: "Tuesday", 
//         3: "Wednesday",
//         4: "Thursday",
//         5: "Friday",
//         6: "Saturday",
//         7: "Sunday"
//     }
//     const day = days[startEpoch.getUTCDay()];
//     const dateTime = `${day} ${startEpoch.getUTCMonth()}/${startEpoch.getUTCDate()}/${startEpoch.getUTCFullYear()} ${startEpoch.getUTCHours()}:${startEpoch.getUTCMinutes()}:${startEpoch.getUTCSeconds()}`;
//     return dateTime;
// }

// async function stakingInfo (web3Context, operatorContractAddress, stakerAddress, keepTokenGrant) {
// //web3Context = staking contract object in param

//     let stakingInfo = {};
//     //const sortitionPoolContract = new web3.eth.Contract(sortitionPoolABI.abi, sortitionPoolABI.networks["3"].address);

    

//     //min stake
//     const minStakeRaw = await contractService.makeCall(web3Context, "minimumStake");
//     let minStakeBig = new BigNumber(parseInt(minStakeRaw));
//     let minStake = minStakeBig.div(10**18).toNumber();

    
//     //delegationData period
//     const undelegationPeriod = Number (await contractService.makeCall(web3Context, "undelegationPeriod"));
//     const undelegationPeriodDays = undelegationPeriod/86400;
//     //console.log(typeof(undelegationPeriod));
//     const maxLockDuration = Number (await contractService.makeCall(web3Context, "maximumLockDuration"));
//     const maxLockDurationDays = maxLockDuration/86400;

//     const minStakeScheduleStartTime = Number (await contractService.makeCall(web3Context, "minimumStakeScheduleStart"));
//     const minStakeScheduleTime = getDateTimeUTC(minStakeScheduleStartTime);
//     const tokenGrant = await contractService.makeCall(web3Context, "tokenGrant");
//     const authoritySource = await contractService.makeCall(web3Context, "getAuthoritySource", stakerAddress);
//     const isAuthorizedForOperator = await contractService.makeCall(web3Context, "isAuthorizedForOperator", stakerAddress, operatorContractAddress);
//     const isStakeLocked = await contractService.makeCall(web3Context, "isStakeLocked", stakerAddress);
//     const escrow = await contractService.makeCall(web3Context, "escrow");
//     const beneficiary = await contractService.makeCall(web3Context, "beneficiaryOf", stakerAddress);
//     //const locks = await contractService.makeCall(web3Context, "getLocks", stakerAddress);
//     //const activeStake = await contractService.makeCall(web3Context, "activeStake", stakerAddress, operatorContractAddress);
//     //

//     //balance info
//     const balanceRaw = await contractService.makeCall(keepTokenGrant, "balanceOf", stakerAddress);
//     let balanceBig = new BigNumber(parseInt(balanceRaw));
//     let balance = balanceBig.div(10**18).toNumber();
//     //const operators_ = await contractService.makeCall(web3Context, "operatorsOf", web3Context._address);


//     const grantDetails = await contractService.makeCall(keepTokenGrant, "getGrantStakeDetails", stakerAddress);


//     const activeStakeRaw = await contractService.makeCall(web3Context, "activeStake", stakerAddress, operatorContractAddress);
//     const activeStakeBig = new BigNumber(parseInt(activeStakeRaw));
//     const activeStake = activeStakeBig.div(10**18).toNumber();
    
    
//     const delegationInfo = await contractService.makeCall(web3Context, "getDelegationInfo", stakerAddress);
//     const delegationTime = getDateTimeUTC(delegationInfo.createdAt);
//     const currentDelegatedAmountRaw = new BigNumber(parseInt(delegationInfo.amount));
//     const currentDelegatedAmount = currentDelegatedAmountRaw.div(10**18).toNumber();

//     const remainingBalance = balance - currentDelegatedAmount;

    
//     // Result {
//     //     '0': '283000000000000000000000',
//     //     '1': '1588894756',
//     //     '2': '0',
//     //     amount: '283000000000000000000000',
//     //     createdAt: '1588894756', //time in epoch
//     //     undelegatedAt: '0'
//     //   }


//     //console.log(operators_);
//     return stakingInfo = {
//         'undelegationPeriod': undelegationPeriodDays, 
//         'minimumStake': minStake,
//         'isStakeLocked': isStakeLocked,
//         'maxLockDuration': maxLockDurationDays,
//         'isAuthorisedAsOperator': isAuthorizedForOperator, 
//         'authorisedBy': authoritySource,
//         'balance': remainingBalance,
//         'currentDelegation': currentDelegatedAmount,
//         'delegationTime': delegationTime,
//         'activeStake': activeStake,
//         'beneficiary': beneficiary
//     };
// };



// module.exports = {
//     stakingInfo, 
//     getDateTimeUTC
// };