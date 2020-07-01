var express = require('express');

var routes = function (stakingContract, grantContract, web3) {
    var stakingRouter = express.Router();
    let stakingService = require('./staking-service'); //

    
    //stakingRouter.get('/:accountId', stakingService);

    stakingRouter.get('/stakingInfo', async function (req, res) {
        const accountId = req.query.accountId;
        const stakingData = await stakingService.fetchDelegatedTokensData(stakingContract, accountId, grantContract, web3);
        res.send(stakingData)
    })

    stakingRouter.get('/api2', function (req, res) {
        //const stakingData = stakingService.fetchDelegatedTokensData(stakingContract, grantContract, web3);
        res.send("API 2")
    })



    // stakingRouter.route('/:accountId')
    //     .get(stakingService.get);

    // bookRouter.use('/:accountId', bookController.returnOne);

    // bookRouter.route('/:bookId')
    //     .get(bookController.getOne)
    //     .put(bookController.put)
    //     .patch(bookController.patch)
    //     .delete(bookController.delete);

    return stakingRouter;
};

module.exports = routes;