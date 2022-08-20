'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const uuid = require('uuid');

const orderBook = [];
const CLIENTID = 'c1';

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const entry = { id: uuid.v4(), type: 'sell', amt: 20, client: CLIENTID, status: 'new' };
orderBook.push(entry);

peer.request('exchange', entry, { timeout: 10000 }, (err, data) => {
    if (err) {
      console.error(err)
      process.exit(-1)
    }
    console.log(data)
    let processedOrder;
    if (data) {
        processedOrder = orderBook.find(o => o.id === data.id)
        if (processedOrder) {
            processedOrder.status = 'processed';
            if (processedOrder.amt !== data.matchedAmt) {
                orderBook.push({
                    id: uuid.v4(), 
                    type: processedOrder.type, 
                    amt: (processedOrder.amt - data.matchedAmt), 
                    client: CLIENTID, 
                    status: 'new'
                })
            }
        }
    }
    console.log(orderBook);
  })