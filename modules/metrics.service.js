
const { isSameEthAddress } = require('../utils/general.utils');
const utils = require('../utils/token.utils');
const BigNumber = require('bignumber.js');
const satoshiBitcoinTs = require("satoshi-bitcoin-ts");


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
  //const bondedEcdsaKeepFactory = objList.bondedEcdsaFactory;
  const bondedEcdsaKeepFactory = new objList.ethers.Contract(objList.bondedEcdsaKeepFactoryABI.networks[1].address, objList.bondedEcdsaKeepFactoryABI.abi, objList.ip);
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

    var d = ""
    var depositState = ""
    var r = ""
    var tdtLotSize = ""



    const tdt = await depositLogContract.queryFilter(depositLogContract.filters.Created(null, addr));
			if (tdt.length < 1) { continue; }
       d = new ethers.Contract(tdt[0].args[0], depositAbi.abi, ip);
       depositState = states[await d.currentState()];
       r = await d.collateralizationPercentage()
       tdtLotSize = ethers.utils.formatEther(await d.lotSizeTbtc());
      console.log(`TDT Lot Size ${tdtLotSize}, Deposit State: ${depositState}, Collateral Ratio: ${Number(r)}`)


      // "AWAITING_SIGNER_SETUP",
      // "AWAITING_BTC_FUNDING_PROOF",
      // "FAILED_SETUP",
      // "ACTIVE",  // includes courtesy call
      // "AWAITING_WITHDRAWAL_SIGNATURE",
      // "AWAITING_WITHDRAWAL_PROOF",
      // "REDEEMED",
      // "COURTESY_CALL",
      // "FRAUD_LIQUIDATION_IN_PROGRESS",
      // "LIQUIDATION_IN_PROGRESS",
      // "LIQUIDATED"

      if(depositState == 'REDEEMED'){
        metricsObj.redeemStats.set({ deposit_state: `${depositState}`, deposit_id: String(d.address)  }, Number(Number(tdtLotSize)))
        metricsObj.collateralStats.set({ deposit_state: `ACTIVE`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
        metricsObj.collateralStats.set({ deposit_state: `AWAITING_WITHDRAWAL_SIGNATURE`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
        metricsObj.collateralStats.set({ deposit_state: `AWAITING_WITHDRAWAL_PROOF`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
        metricsObj.collateralStats.set({ deposit_state: `COURTESY_CALL`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
      }else if(depositState == 'ACTIVE'){
        metricsObj.collateralStats.set({ deposit_state: `${depositState}`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))
        metricsObj.collateralStats.set({ deposit_state: `AWAITING_SIGNER_SETUP`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, 0)
        metricsObj.collateralStats.set({ deposit_state: `AWAITING_BTC_FUNDING_PROOF`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, 0)       
              // "AWAITING_SIGNER_SETUP",
      // "AWAITING_BTC_FUNDING_PROOF",
      }else{
        metricsObj.collateralStats.set({ deposit_state: `ACTIVE`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, 0)
        metricsObj.collateralStats.set({ deposit_state: `${depositState}`, lot_size: Number(tdtLotSize), deposit_id: String(d.address)  }, Number(r))

      }

  }
  metricsObj.openKeeps.set(Number(openCounter));
  metricsObj.closedKeeps.set(Number(closedCounter));
}


module.exports = {
  mintedTbtc,
  myKeeps
}

