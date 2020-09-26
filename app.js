//import express from 'express';
//import db from './db/db';

const ethers = require('ethers');
//node_modules
const tbtcABI = require('@keep-network/tbtc/artifacts/TBTCToken.json');
const tbtcSystemABI = require('@keep-network/tbtc/artifacts/TBTCSystem.json');
const tokenStakingABI = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const randomBeaconOperatorABI = require('@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json');
const keepTokenABI = require('@keep-network/keep-core/artifacts/KeepToken.json');
const tokenGrantABI = require('@keep-network/keep-core/artifacts/TokenGrant.json');
const managedGrantFactoryABI = require('@keep-network/keep-core/artifacts/ManagedGrantFactory.json');
const bondedEcdsaKeepABI = require('@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json');
const bondedEcdsaKeepFactoryABI = require('@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json');
const depositAbi = require("@keep-network/tbtc/artifacts/Deposit.json");
const depositLogAbi = require("@keep-network/tbtc/artifacts/DepositLog.json");

const managedGrantABI = require('@keep-network/keep-core/artifacts/ManagedGrant.json');
const dotenv = require('dotenv');
const express = require("express")
const NodeCache = require('node-cache')
const promClient = require('prom-client');
const storage = require('node-persist');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const { isSameEthAddress } = require('./utils/general.utils');
// load variables
dotenv.config();
const cache = new NodeCache();

let isTestnet = false;

let infura = isTestnet
  ? `https://ropsten.infura.io/v3/${process.env.infura}`
  : `https://mainnet.infura.io/v3/${process.env.infura}`;

let infuraWS = isTestnet
  ? `wss://ropsten.infura.io/ws/v3/${process.env.infura}`
  : `wss://mainnet.infura.io/ws/v3/${process.env.infura}`;  

  const options = {
    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false,
    },
  }; 



// //initialise web3Context
// const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraWS, options));
// const staking = new web3.eth.Contract(tokenStakingABI.abi, tokenStakingABI.networks["3"].address);
// const operator = new web3.eth.Contract(randomBeaconOperatorABI.abi, randomBeaconOperatorABI.networks["3"].address);
// const keepTokenGrant = new web3.eth.Contract(tokenGrantABI.abi, tokenGrantABI.networks["3"].address);
// const keepToken = new web3.eth.Contract(keepTokenABI.abi, keepTokenABI.networks["3"].address);
// const managedGrantFactory = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);
// const managedGrant = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);
// const tbtc = new web3.eth.Contract(tbtcABI.abi, tbtcABI.networks["3"].address);
// const tbtcSystem = new web3.eth.Contract(tbtcSystemABI.abi, tbtcSystemABI.networks["3"].address);

//initialise web3Context
//const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraWS, options));
const ip = new ethers.providers.InfuraProvider('homestead', process.env.infura);
const staking = new ethers.Contract(tokenStakingABI.networks["1"].address, tokenStakingABI.abi, ip)
const operator = new ethers.Contract(randomBeaconOperatorABI.networks["1"].address, randomBeaconOperatorABI.abi, ip);
const tbtc = new ethers.Contract(tbtcABI.networks["1"].address, tbtcABI.abi, ip);
const tbtcSystem = new ethers.Contract(tbtcSystemABI.networks["1"].address, tbtcSystemABI.abi, ip);


//const staking = new web3.eth.Contract(tokenStakingABI.abi, "0x234d2182B29c6a64ce3ab6940037b5C8FdAB608e");
// const keepTokenGrant = new web3.eth.Contract(tokenGrantABI.abi, tokenGrantABI.networks["3"].address);
// const keepToken = new web3.eth.Contract(keepTokenABI.abi, keepTokenABI.networks["3"].address);
// const managedGrantFactory = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);
// const managedGrant = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);
//const tbtc = new web3.eth.Contract(tbtcABI.abi, "0x7c07C42973047223F80C4A69Bb62D5195460Eb5F");
//const tbtcSystem = new web3.eth.Contract(tbtcSystemABI.abi, "0xc3f96306eDabACEa249D2D22Ec65697f38c6Da69");
//const tbtcSystem = new web3.eth.Contract(tbtcSystemABI.abi, tbtcSystemABI.networks[1].address);
const bondedEcdsa = new ethers.Contract(bondedEcdsaKeepABI.networks[1].address, bondedEcdsaKeepABI.abi, ip);
const bondedEcdsaFactory = new ethers.Contract(bondedEcdsaKeepFactoryABI.networks[1].address, bondedEcdsaKeepFactoryABI.abi, ip);
const deposit = new ethers.Contract(depositAbi.networks[1].address, depositAbi.abi, ip);
const depositLog = new ethers.Contract(tbtcSystemABI.networks[1].address, depositLogAbi.abi, ip);
const operatorAddress = process.env.operator;

//const keeps = await bondedEcdsaFactory.queryFilter(bondedEcdsaFactory.filters.BondedECDSAKeepCreated());

const objList = {
  stakingContract: staking, 
  operatorContract: operator,
  ethers: ethers,
  ip: ip,
  tbtcContract: tbtc,
  tbtcSystemContract: tbtcSystem,
  depositContract: deposit,
  cache: cache,
  promClient: promClient,
  bondedEcdsa: bondedEcdsa,
  bondedEcdsaKeepABI: bondedEcdsaKeepABI,
  bondedEcdsaFactory: bondedEcdsaFactory,
  deposit: deposit,
  depositLog: depositLog,
  depositAbi: depositAbi,
  storage: storage,
  operator: operatorAddress
}

let metricsRouter = require('./routers/metrics.router')(objList);

// Set up the express app
const app = express();

//app.use('/', grantsRouter);
//app.use('/', stakingRouter);
app.use('/', metricsRouter);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});

const App = async () => {
  console.log(`App Initialised`);

}

App();

