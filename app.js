//import express from 'express';
//import db from './db/db';


//node_modules
const tbtcABI = require('@keep-network/tbtc/artifacts/TBTCToken.json');
const tbtcSystemABI = require('@keep-network/tbtc/artifacts/TBTCSystem.json');
const tokenStakingABI = require("@keep-network/keep-core/artifacts/TokenStaking.json")
const randomBeaconOperatorABI = require('@keep-network/keep-core/artifacts/KeepRandomBeaconOperator.json');
const keepTokenABI = require('@keep-network/keep-core/artifacts/KeepToken.json');
const tokenGrantABI = require('@keep-network/keep-core/artifacts/TokenGrant.json');
const managedGrantFactoryABI = require('@keep-network/keep-core/artifacts/ManagedGrantFactory.json');
const managedGrantABI = require('@keep-network/keep-core/artifacts/ManagedGrant.json');
const dotenv = require('dotenv');
const express = require("express")

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
// load variables
dotenv.config();

let isTestnet = true;

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

//initialise web3Context
const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraWS, options));
const staking = new web3.eth.Contract(tokenStakingABI.abi, tokenStakingABI.networks["3"].address);
const operator = new web3.eth.Contract(randomBeaconOperatorABI.abi, randomBeaconOperatorABI.networks["3"].address);
const keepTokenGrant = new web3.eth.Contract(tokenGrantABI.abi, tokenGrantABI.networks["3"].address);
const keepToken = new web3.eth.Contract(keepTokenABI.abi, keepTokenABI.networks["3"].address);
const managedGrantFactory = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);
const managedGrant = new web3.eth.Contract(managedGrantFactoryABI.abi, managedGrantFactoryABI.networks["3"].address);

const objList = {
  stakingContract: staking, 
  tokenGrantContract: keepTokenGrant, 
  Web3Obj: web3,
  tokenContract: keepToken,
  managedGrantFactoryContract: managedGrantFactory,
  managedGrantContract: managedGrant
}

//(stakingContract, grantContract, web3)
let router = require('./modules/router')(objList);



// Set up the express app
const app = express();
// get all todos

app.use('/', router);

// app.get('/', function (req, res) {
//   res.send('Welcome to KEEP API');
// });


// app.get('/api/v1/todos', (req, res) => {
//   res.status(200).send({
//     success: 'true',
//     message: 'todos retrieved successfully',
//     todos: db
//   })
// });

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});