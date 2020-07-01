

async function makeCall(web3Context, contractMethodName, ...args){
    return await web3Context.methods[contractMethodName](
        ...args
      ).call()
};

async function getPastEvents(web3Context, eventName, ...args){
  return await web3Context.getPastEvents(eventName, ...args)
};



//async function getPastEvents

  
  const sendTransaction = async (
    web3Context,
    contractName,
    contractMethodName,
    sendArgs,
    ...args
  ) => {
    return await web3Context[contractName].methods[contractMethodName](
      ...args
    ).send(sendArgs)
  }

  module.exports = {
    makeCall,
    getPastEvents
  }