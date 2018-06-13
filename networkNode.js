const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid().split('-').join('');

const coin = new Blockchain();

// body parser methods
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//API endpoints
app.get('/blockchain', (req, res) => {
  res.send(coin);
});

app.post('/transaction', (req, res) => {
  const newTransaction = req.body;
  const blockIndex = coin.addTransactionToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}`}); 
});

app.post('/transaction/broadcast', (req, res) => {
  const newTransaction = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  coin.addTransactionToPendingTransactions(newTransaction);

  const requestPromises = [];
  coin.networkNodes.forEach(networkNodeURL => {
    const requestOptions = {
      uri: networkNodeURL + "/transaction",
      method: 'POST',
      body: newTransaction,
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(data => {
      res.json({ note: "Broadcast was successful."});
    })
    .catch(error => {
      console.error('/transaction/broadcast Promise error ' + error);
    })
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

  coin.networkNodes.forEach(networkNodeURL => {
    const requestOptions = {
      uri: networkNodeURL + '/receive-new-block',
      method: 'POST',
      body: { 
        newBlock: newBlock
      },
      json: true
    }
  })

  res.json({
    note: "New block mined succesully",
    block: newBlock
  });
});

app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeURL = req.body.newNodeURL;
  if (coin.networkNodes.indexOf(newNodeURL) == -1) {
    coin.networkNodes.push(newNodeURL);
  }

  const regNodesPromises = [];

  coin.networkNodes.forEach(networkNodeURL => {
    const requestOptions = {
      uri: networkNodeURL + '/register-node',
      method: 'POST',
      body: { 
        newNodeURL: newNodeURL
      },
      json: true
    }

    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
    .then(data => {
      const bulkRegisterOptions = {
        uri: newNodeURL + '/register-nodes-bulk',
        method: 'POST',
        body: { 
          allNetworkNodes: [...coin.networkNodes, coin.currentNodeURL]
        },
        json: true
      }

      return rp(bulkRegisterOptions);
    })
    .catch(error => {
      console.error('/register-and-broadcast-node Promise error ' + error);
    })
    .then(data => {
      res.json ({ note: "New node registered successfully"});
    })
    .catch(error => {
      console.error('/register-and-broadcast-node Promise error ' + error);
    })
});

app.post('/register-node', (req, res) => {
  const newNodeURL = req.body.newNodeURL;
  const nodeNotAlreadyPresent = coin.networkNodes.indexOf(newNodeURL) == -1;
  const notCurrentNode = coin.currentNodeURL !== newNodeURL;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    coin.networkNodes.push(newNodeURL);
  }
  res.json({ note: "New node registered successfully"});  
});

app.post('/register-nodes-bulk',(req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeURL => {
    const nodeNotAlreadyPresent = coin.networkNodes.indexOf(networkNodeURL) == -1;
    const notCurrentNode = coin.currentNodeURL !== networkNodeURL;
    if (nodeNotAlreadyPresent && notCurrentNode) {
      coin.networkNodes.push(networkNodeURL);
    }
  });
  res.json({ note: "Bulk registration successful." });
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});