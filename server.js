'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const uuid = require('uuid');

const dht = []; // to hold all submitted transactions 

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)
console.log(`port = ${port}`)

setInterval(function () {
  link.announce('exchange', service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  const txn = { ...payload } // { id, type, amt, status, client }
  console.log(`txn = ${JSON.stringify(txn)}`);

  dht.push(txn);
  console.log(`dht = ${JSON.stringify(dht)}`);

  // Assumption: We look for already submitted transactions having amount >= the amount specified for 
  // incoming transaction.
  // With that, find a submitted transaction such that it is not yet processed (i.e. status is 'new') and
  // type other than that of the incoming transaction.
  const match = dht.find(e => e.status === 'new' && e.type !== txn.type && e.amt >= txn.amt);

  if (match) {
    console.log('match found');
    match.status = 'processed'
    txn.status = 'processed'
    if (match.amt !== txn.amt) {
      const remainder = { id: uuid.v4(),  type: match.type, amt: (match.amt - txn.amt), status: 'new', client: match.client }
      dht.push(remainder);
    }
    console.log(`updated dht = ${JSON.stringify(dht)}`);
    handler.reply(null, {msg: 'transaction processed', id: payload.id, matchedAmt: payload.amt})
  }
  else 
    handler.reply(null, {msg: 'transaction submitted'})
})
