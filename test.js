const Blockchain = require('./blockchain.js');
const coin = new Blockchain();
const uuid = require('uuid/v1');

console.log(uuid().split("-").join(""));