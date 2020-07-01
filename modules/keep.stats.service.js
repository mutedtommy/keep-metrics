const testABI = require('@keep-network/keep-core/artifacts/KeepRandomBeaconOperatorStatistics.json');
const tokenGrantABI = require('@keep-network/keep-core/artifacts/TokenGrant.json');
const contractService = require ('./contracts.service');


const testData = async (web3) => {
  const tokenGrantContract = new web3.eth.Contract(tokenGrantABI.abi, tokenGrantABI.networks["3"].address);

  // const [grants] = await Promise.all([
  //   contractService.makeCall(
  //     tokenGrantContract,
  //     "numGrants"
  //   )
  // ])

  const [grants] = await Promise.all([
    contractService.getPastEvents(
      tokenGrantContract,
      "TokenGrantStaked",
      tokenGrantABI.updatedAt
    )
  ])



}

module.exports = {testData};