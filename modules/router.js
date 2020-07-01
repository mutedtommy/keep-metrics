var express = require('express');

var routes = function (objList) {
    var stakingRouter = express.Router();
    const stakingService = require('./staking-service'); //
    const grantsService = require('./grants.service');
    
    //stakingRouter.get('/:accountId', stakingService);



    // const objList = {
    //     stakingContract: staking, 
    //     tokenGrantContract: keepTokenGrant, 
    //     Web3Obj: web3,
    //     tokenContract: keepToken,
    //     managedGrantFactoryContract: managedGrantFactory
    //   }


    stakingRouter.get('/stakingInfo', async function (req, res) {
        const accountId = req.query.accountId;

        if(!accountId || accountId === '') {
            res.status(400);
            res.send('Account ID is required');
        }else{
            try{
                const stakingData = await stakingService.fetchDelegatedTokensData(objList.stakingContract, accountId, objList.tokenGrantContract, objList.Web3Obj);
                res.send(stakingData)
            }catch(e){
                console.error(e);
                res.status(500);
                res.send(`Error Occured! ${e}`)
            }
        }


    })

    stakingRouter.get('/fetchGrants', async function (req, res) {
        const accountId = req.query.accountId;
        if(!accountId || accountId === '') {
            res.status(400);
            res.send('Account ID is required');
        }else{
            try{
                const grantsData = await grantsService.fetchGrants(accountId, objList);
                res.send(grantsData)
            }catch(e){
                console.error(e);
                res.status(500);
                res.send(`Error Occured! ${e}`)
            }
        }
    })

    // stakingRouter.get(function (err, req, res, next) {
    //     res.status(500).send('Something broke!')
    // })



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