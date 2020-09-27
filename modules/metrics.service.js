
const { isSameEthAddress } = require('../utils/general.utils');
const utils = require('../utils/token.utils');
const BigNumber = require('bignumber.js');
const satoshiBitcoinTs = require("satoshi-bitcoin-ts");


// const objList = {
//   stakingContract: staking, 
//   tokenGrantContract: keepTokenGrant, 
//   Web3Obj: web3,
//   tokenContract: keepToken,
//   managedGrantFactoryContract: managedGrantFactory,
//   managedGrantContract: managedGrant
// }

const states = [
	"START",
	"AWAITING_SIGNER_SETUP",
	"AWAITING_BTC_FUNDING_PROOF",
	"FAILED_SETUP",
	"ACTIVE",  // includes courtesy call
	"AWAITING_WITHDRAWAL_SIGNATURE",
	"AWAITING_WITHDRAWAL_PROOF",
	"REDEEMED",
	"COURTESY_CALL",
	"FRAUD_LIQUIDATION_IN_PROGRESS",
	"LIQUIDATION_IN_PROGRESS",
	"LIQUIDATED"
];


const mintedTbtc = async (objList, metricsObj) => {
  const tbtcContract = objList.tbtcContract;
  const ethers = objList.ethers;
  const totalSupply = await tbtcContract.totalSupply();
  const value = ethers.utils.formatEther(totalSupply)
  metricsObj.tBTCSupplyGauge.set(Number(value));
  return value;
}

const myKeeps = async (objList, metricsObj) => {
  const opAddr = objList.operator;
  const bondedEcdsaKeepFactory = objList.bondedEcdsaFactory;
  const keeps = await bondedEcdsaKeepFactory.queryFilter(bondedEcdsaKeepFactory.filters.BondedECDSAKeepCreated());

  const targetKeeps = keeps.filter(ev => { return ev.args[1].filter(ms => { return ms.toLowerCase() === opAddr.toLowerCase()}).length > 0 }).map(ev => { return ev.args[0]; });
  metricsObj.keepsGauge.set(targetKeeps.length);
  await keepDetails(targetKeeps, objList, metricsObj);
  return targetKeeps.length;
}

const keepDetails = async (keepIds, objList, metricsObj) => {
  const ethers = objList.ethers;
  const bondedEcdsaABI = objList.bondedEcdsaKeepABI;
  const ip = objList.ip;
  const depositLogContract = objList.depositLog;
  const depositAbi = objList.depositAbi;
  var openCounter = 0;
  var closedCounter = 0;
  var obj = { my: "Special", variable: 42 };
  await objList.storage.init();
  for (let addr of keepIds) {
    //await objList.storage.del(addr)
    const k = new ethers.Contract(await addr, bondedEcdsaABI.abi, ip);

    const status = await objList.storage.getItem(addr)
    var closed = false;
    if(status == undefined){
      closed = (await k.isClosed()) ? true: false;
      if(closed){
        await objList.storage.setItem(addr, "closed");
        ++closedCounter;
      }else{
        ++openCounter;
      }
    }else{
      closed = (status == 'closed') ? true: false;
      if(closed){
        ++closedCounter;
      }else{
        ++openCounter;
      }
    } 



    const tdt = await depositLogContract.queryFilter(depositLogContract.filters.Created(null, addr));
			if (tdt.length < 1) { continue; }
      const d = new ethers.Contract(tdt[0].args[0], depositAbi.abi, ip);
      const depositState = states[await d.currentState()];

      // const depositStatus = await objList.storage.getItem(d.address)

      // if (depositStatus != undefined){
        
      // }



      //if (depositState != 'ACTIVE') { continue; }
      const r = await d.collateralizationPercentage()
      const tdtLotSize = ethers.utils.formatEther(await d.lotSizeTbtc());
      console.log(`TDT Lot Size ${tdtLotSize}, Deposit State: ${depositState}, Collateral Ratio: ${Number(r)}`)

      

      // if (depositState == 'REDEEMED' || depositState == 'FAILED_SETUP' || depositState == 'LIQUIDATED'){
      //   metricsObj.redeemStats.labels(String(d.address)).observe(Number(tdtLotSize))
      // }else{
      //   //metricsObj.collateralStats.labels({ deposit_state: String(depositState), lot_size: Number(tdtLotSize) }).observe(Number(r))
      // }

      metricsObj.collateralStats.set({ deposit_state: `${depositState}`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))

      
      // if (depositState == 'REDEEMED'){ 
      //   //metricsObj.redeemGauge.set(1)
      //   //metricsObj.redeemGauge.set({ deposit_state: `${depositState}` }, Number(tdtLotSize))
      //   metricsObj.redeemStats.labels(depositState).inc(Number(tdtLotSize))
      // }else if(depositState == 'FAILED_SETUP'){
      //   metricsObj.redeemStats.labels(depositState).inc(Number(tdtLotSize))
      // }else if(depositState == 'LIQUIDATED'){
      //   metricsObj.redeemStats.labels(depositState).inc(Number(tdtLotSize))
      // }else{
      //   metricsObj.collateralStats.set({ deposit_state: `${depositState}`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
      //   //metricsObj.redeemGauge.labels(`${String(depositState)}`).observe(Number(tdtLotSize))
      // }
  }
  metricsObj.openKeeps.set(Number(openCounter));
  metricsObj.closedKeeps.set(Number(closedCounter));
}




// const lotSizes = async (objList) => {
//   const tbtcSystemContract = objList.tbtcSystemContract;
//   const ethers = objList.ethers;
//   const lotSizes = await tbtcSystemContract.getAllowedLotSizes();
//   const returnLotSizes = [];

//   for(var i=0; i<=lotSizes.length; i++){
//     returnLotSizes[i] = ethers.utils.formatEther(lotSizes[i])
//   }

//   // const [
//   //   minLotSize
//   // ] = await Promise.all([
//   //   contractService.makeCall(
//   //     tbtcSystemContract,
//   //     "getMinimumLotSize"
//   //   )
//   // ])
//   // let rawvalue = new BigNumber(parseInt(minLotSize));
//   // let btcValue = satoshiBitcoinTs.toBitcoin(rawvalue.toNumber());
//   // let value = rawvalue.div(10 ** 8).toNumber();
//   return returnLotSizes;
// }

const collateralRatio = async (objList) => {

  // stakingContract: staking, 
  // operatorContract: operator,
  // Web3Obj: web3,
  // tbtcContract: tbtc,
  // tbtcSystemContract: tbtcSystem,
  // depositContract: deposit,
  // cache: cache,
  // promClient: promClient

  // const deposit = objList.depositContract;
  // const tbtcSystemContract = objList.tbtcSystemContract;
  // const web3 = objList.Web3Obj;

  // const [
  //   maxLotSize
  // ] = await Promise.all([
  //   contractService.makeCall(
  //     tbtcSystemContract,
  //     "getMaximumLotSize"
  //   )
  // ])
  // let rawvalue = new BigNumber(parseInt(maxLotSize));
  // let btcValue = satoshiBitcoinTs.toBitcoin(rawvalue.toNumber());
  // let value = rawvalue.div(10 ** 8).toNumber();
  // return btcValue;
}



module.exports = {
  mintedTbtc,
  myKeeps
}

