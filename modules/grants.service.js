// import {
//     TOKEN_GRANT_CONTRACT_NAME,
//     MANAGED_GRANT_FACTORY_CONTRACT_NAME,
//   } from "../constants/constants"
//   import { contractService } from "./contracts.service"
//   import { isSameEthAddress } from "../utils/general.utils"
//   import web3Utils from "web3-utils"
//   import {
//     getGuaranteedMinimumStakingPolicyContractAddress,
//     getPermissiveStakingPolicyContractAddress,
//     createManagedGrantContractInstance,
//     CONTRACT_DEPLOY_BLOCK_NUMBER,
//   } from "../contracts"        
  
// const objList = {
//   stakingContract: staking, 
//   tokenGrantContract: keepTokenGrant, 
//   Web3Obj: web3,
//   tokenContract: keepToken,
//   managedGrantFactoryContract: managedGrantFactory,
//   managedGrantContract: managedGrant
// }

const managedGrantABI = require('@keep-network/keep-core/artifacts/ManagedGrant.json');
const contractService = require('./contracts.service');
//const isSameAddress = require('../utils/general.utils');

  const fetchGrants = async (requestorAddress, objList) => {
    const tokenGrant = objList.tokenGrantContract;
    //const { yourAddress } = tokenGrant
    const grantIds = new Set(
      await contractService.makeCall(
        tokenGrant,
        "getGrants",
        requestorAddress
      )
    )
    const managedGrants = await fetchManagedGrants(requestorAddress, objList)
    const grants = []
    for (const grantId of grantIds) {
      let grantDetails = {}
      try {
        grantDetails = await getGrantDetails(requestorAddress, grantId, objList.tokenGrantContract, false)
      } catch {
        continue
      }
      grants.push({ ...grantDetails })
    }
  
    for (const managedGrant of managedGrants) {
      const { grantId, managedGrantContractInstance } = managedGrant
      const grantDetails = await getGrantDetails(requestorAddress, grantId, objList.tokenGrantContract, true)
      grants.push({
        ...grantDetails,
        isManagedGrant: true,
        managedGrantContractInstance,
      })
    }
    return grants
  }
  
  const getGrantDetails = async (
    requestorAddress,
    grantId,
    tokenGrant,
    isManagedGrant = false
  ) => {
    const grantDetails = await contractService.makeCall(
      tokenGrant,
      "getGrant",
      grantId
    )

    if (!isManagedGrant && (requestorAddress.toLowerCase() !== (grantDetails.grantee).toLowerCase())) {
      //!isSameEthAddress(requestorAddress, grantDetails.grantee
      throw new Error(
        `${requestorAddress} does not match a grantee address for the grantId ${grantId}`
      )
    }
    const unlockingSchedule = await contractService.makeCall(
      tokenGrant,
      "getGrantUnlockingSchedule",
      grantId
    )
  
    const unlocked = await contractService.makeCall(
      tokenGrant,
      "unlockedAmount",
      grantId
    )
    let readyToRelease = "0"
    try {
      readyToRelease = await contractService.makeCall(
        tokenGrant,
        "withdrawable",
        grantId
      )
    } catch (error) {
      readyToRelease = "0"
    }
    const released = grantDetails.withdrawn
    const availableToStake = await contractService.makeCall(
      tokenGrant,
      "availableToStake",
      grantId
    )
  
    return {
      id: grantId,
      unlocked,
      released,
      readyToRelease,
      availableToStake,
      ...unlockingSchedule,
      ...grantDetails,
    }
  }
  

  // const objList = {
//   stakingContract: staking, 
//   tokenGrantContract: keepTokenGrant, 
//   Web3Obj: web3,
//   tokenContract: keepToken,
//   managedGrantFactoryContract: managedGrantFactory,
//   managedGrantContract: managedGrant
// }
  
  const fetchManagedGrants = async (requestorAddress, objList) => {
    //const { managedGrantFactoryContract, yourAddress, web3 } = web3Context
    const managedGrantFactoryContract = objList.managedGrantFactoryContract;
    const web3 = objList.Web3Obj;

    //managedGrantABI
  
    const managedGrantCreatedEvents = await managedGrantFactoryContract.getPastEvents(
      "ManagedGrantCreated",
      {
        fromBlock:
          '0',
      }
    )
    const grants = []
  
    for (const event of managedGrantCreatedEvents) {
      const {
        returnValues: { grantAddress },
      } = event
      const managedGrantContractInstance = web3.eth.Contract(managedGrantABI.abi, grantAddress);

      const grantee = await managedGrantContractInstance.methods.grantee().call()
      if (!isSameEthAddress(requestorAddress, grantee)) {
        continue
      }
      const grantId = await managedGrantContractInstance.methods.grantId().call()
      grants.push({ grantId, managedGrantContractInstance })
    }
  
    return grants
  }
  
  // export const stake = async (
  //   web3Context,
  //   data,
  //   onTransactionHashCallback = () => {}
  // ) => {
  //   const { grantContract, stakingContract, yourAddress } = web3Context
  //   const { amount, delegation, grant } = data
  //   const { isManagedGrant, managedGrantContractInstance, id } = grant
  
  //   if (isManagedGrant) {
  //     await managedGrantContractInstance.methods
  //       .stake(stakingContract.options.address, amount, delegation)
  //       .send({ from: yourAddress })
  //       .on("transactionHash", onTransactionHashCallback)
  //   } else {
  //     await grantContract.methods
  //       .stake(id, stakingContract.options.address, amount, delegation)
  //       .send({ from: yourAddress })
  //       .on("transactionHash", onTransactionHashCallback)
  //   }
  // }
  
  const getOperatorsFromManagedGrants = async (requestorAddress, objList) => {
    //const { grantContract } = web3Context
    const manageGrants = await fetchManagedGrants(requestorAddress, objList)
    const operators = new Set()
  
    for (const managedGrant of manageGrants) {
      const { managedGrantContractInstance } = managedGrant
      const granteeAddress = managedGrantContractInstance.options.address
      const grenteeOperators = await grantContract.methods
        .getGranteeOperators(granteeAddress)
        .call()
      grenteeOperators.forEach(operators.add, operators)
    }
  
    return operators
  }


  module.exports = {
    fetchGrants,
    fetchManagedGrants,
    getOperatorsFromManagedGrants
  }

  