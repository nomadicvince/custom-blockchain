const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = ('uuid/v1');

const nodeAddress = uuid.split('-').join('');

const coin = new Blockchain();

// body parser methods
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//API endpoints
app.get('/blockchain', (req, res) => {
  res.send(coin);
});

app.post('/transaction', (req, res) => {
  const blockIndex = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  res.json({note: `Transaction will be added in block ${blockIndex}.`});
});

app.get('/mine', (req, res) => {
  const lastBlock = coin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: coin.pendingTransactions,
    index: lastBlock['index'] + 1
  }

  const nonce = coin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = coin.hashBlock(previousBlockHash, currentBlockData, nonce);

  coin.createNewTransaction(12.5, "00", nodeAddress);

  const newBlock = coin.createNewBlock(nonce, previousBlockHash, blockHash);
  res.json({
    note: "New block mined succesully",
    block: newBlock
  });
});

app.listen(3000, () => {
  console.log('Listening on 3000');
});