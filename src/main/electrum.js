
var coins = require('libwallet-mnz').coins
var Client = require("jsonrpc-node").TCP.Client;


function call(ticker, method, params, done) {
  let coin = coins.get(ticker)
  let electrumServer = coin.electrum[0]
  var client = new Client(parseInt(electrumServer.port), electrumServer.host);
  
  client.call(method, params, done)
}

module.exports = {
  call: call
}