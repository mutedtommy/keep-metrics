var express = require('express');
const metricsService = require('../modules/metrics.service');

var routes = function (objList) {
    var tbtcRouter = express.Router();
    const tBTCSupplyGauge = new objList.promClient.Gauge({
        name: 'tbtc_supply',
        help: 'Monitoring tBTC supply overtime',
      });

    const keepsGauge = new objList.promClient.Gauge({
        name: 'my_keeps',
        help: 'Number of Keeps the Operator is/has been a part of',
      });    

    const openKeeps = new objList.promClient.Gauge({
        name: 'open_keeps',
        help: 'Number of Keeps in open state',
    });  

    const closedKeeps = new objList.promClient.Gauge({
        name: 'closed_keeps',
        help: 'Number of Keeps successfully closed',
    });
 


    const tBTCRedemptionGauge = new objList.promClient.Gauge({
        name: 'redeem_stats',
        help: 'Monitor tBTC Redemptions on Keep Network',
        labelNames: ['deposit_state', 'deposit_id']
    });  

    
    const collateralGauge = new objList.promClient.Gauge({
        name: 'collateral_stats',
        help: 'Monitor collateralisation %age of deposits held by your keeps',
        labelNames: ['deposit_state', 'lot_size', 'deposit_id'],
    }); 

    



    const register = objList.promClient.register;
    //const register = require('prom-client/lib/registry')
    tbtcRouter.get('/metrics', async (req, res) => {
        const metricsObj = {
            tBTCSupplyGauge: tBTCSupplyGauge,
            keepsGauge: keepsGauge,
            openKeeps: openKeeps,
            closedKeeps: closedKeeps,
            collateralStats: collateralGauge,
            redeemStats: tBTCRedemptionGauge
        }
        try {
            //tBTCRedemptionHistogram.observe(0.01);
            await setMetrics(objList, metricsObj);
            res.set('Content-Type', register.contentType);
            res.send(await register.metrics());
        } catch (ex) {
            res.status(500).end(ex);
            throw(ex);
        }
    })

    return tbtcRouter;
};


async function setMetrics(contractsObj, metricsObj){
    const totalSupply = await metricsService.mintedTbtc(contractsObj, metricsObj);
    metricsObj.tBTCSupplyGauge.set(Number(totalSupply));

    const myKeeps = await metricsService.myKeeps(contractsObj, metricsObj);
    //const lotSizes = await metricsService.lotSizes(contractsObj);
    //metricsObj.keepsGauge.set(myKeeps);
    //metricsObj.collateralHistogram.observe(145)
}

module.exports = routes;