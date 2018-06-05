const Blockchain = require('./blockchain.js');
const coin = new Blockchain();
coin.createNewBlock(23456, '0IN546G', 'HTGT3499IJ');
coin.createNewBlock(699669, 'WQS3269', 'FREF4564FG');
coin.createNewBlock(4567, '0I9OPIG', 'HXBQ499IJ');

console.log(coin);