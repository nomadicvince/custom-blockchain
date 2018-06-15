const sha256 = require('sha256');
const currentNodeURL = process.argv[3];
const uuid = require('uuid/v1');

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeURL = currentNodeURL;
    this.networkNodes = [];

    //Genesis block
    this.createNewBlock(100, '0', '0');
  }

  //Create new block
  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce: nonce,
      hash: hash,
      previousBlockHash: previousBlockHash    
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  //Get last block
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  //create a new transaction
  createNewTransaction(amount, sender, recipient) {
    const newTransaction = {
      amount: amount,
      sender: sender,
      recipient: recipient,
      transactionId: uuid().split("-").join("")
    };

    return newTransaction;
  }

  addTransactionToPendingTransactions(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
  }

  //create hash
  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
  }

  //Proof of work algorithm
  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0, 4) !== '0000') {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
  }

  //Consensus algorithm
  chainIsValid(blockchain) {
       // check blocks, except for the genesis block
       for(let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const blockHash = this.hashBlock(
            prevBlock['hash'], 
            {
                transactions: currentBlock['transactions'], 
                index: currentBlock['index']
            }, 
            currentBlock['nonce']
        );
        /*console.log("prevBlock[hash]: " + blockHash + 
        ", transactions: " + currentBlock['transactions'] + 
        ", index: " + currentBlock['index'] + 
        ", currentBlock[nonce]: " + currentBlock['nonce'] );*/

        // NOTE: '0000' should probably be a constant
        // we check if the hash begins with four zeroes
        if(blockHash.substring(0,4) !== '0000') {
            //validChain = false;
            // console.log("0000 not found in blockHash!" );
            //return validChain;
            return false;
        }

        // check if the current node points to the correct previous hash for the previous node
        if(currentBlock['previousBlockHash'] !== prevBlock['hash']){ // if chain is not valid
            //validChain = false;
            // console.log("previous block hash is not the same as the one stored on the current hash\'s previousBlockHash!" );
            //return validChain;
            return false;
        }
    }

    // check genesis block
    const genesisBlock = blockchain[0]
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if(!(correctNonce && correctPreviousBlockHash && correctHash && correctTransactions)){
        return false
    }
    
    return true;
  }

}

module.exports = Blockchain;


