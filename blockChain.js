//block+chain

//block
//data{
//之前的hash
//自己的hash
//}
const sha256 = require("crypto-js/sha256");

var EC = require("elliptic").ec;
// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC("secp256k1");
const keyPairSender = ec.genKeyPair();

class Block {
  constructor(transaction, previousHash) {
    this.transaction = transaction;
    this.previousHash = previousHash;
    this.random = 1;
    this.hash = "";
    this.timestamp = Date.now();
  }

  analysisDifficulity(difficulity) {
    let difficulityString = "";
    for (let index = 0; index < difficulity; index++) {
      difficulityString += "0";
    }
    return difficulityString;
  }

  generateHash() {
    return sha256(
      JSON.stringify(this.transaction) +
        this.previousHash +
        this.random +
        this.timestamp
    ).toString();
  }

  //挖矿
  mine(difficulity) {
    if(!this.verifyDataTransaction()){
      throw new Error("异常交易，停止挖矿")
    }
    while (true) {
      this.hash = this.generateHash();
      if (
        this.hash.substring(0, difficulity) !==
        this.analysisDifficulity(difficulity)
      ) {
        this.random++;
        this.hash = this.generateHash();
      } else {
        break;
      }
    }
    console.log("get DDanCoin!");
  }

  verifyDataTransaction() {
    //验证transaction
    for (let t of this.transaction) {
      if (!t.isValid()) {
        console.log("非法交易");
        return false;
      }
      return true;
    }
  }
}

//chain
class Chain {
  constructor(difficulty) {
    this.Chain = [this.orgin()];
    this.transactionPool = [];
    this.minerReward = 50; //挖出每个block矿工可以的到的DDanCoin数量
    this.difficulity = difficulty;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty
  }

  //祖先区块
  orgin() {
    const ddan = new Block("DDanOrgin", "");
    ddan.hash = ddan.generateHash();
    return ddan;
  }

  //获取Chain中最后一个元素
  getLastBlock() {
    return this.Chain[this.Chain.length - 1];
  }

  //添加区块 仅测试
  // addBlock(newBlock) {
  //   newBlock.previousHash = this.getLastBlock().hash;
  //   newBlock.mine(this.difficulity);
  //   this.Chain.push(newBlock);
  // }

  //添加transaction到TransactionPool
  addTransaction(transaction) {
    if (!transaction.to) throw new Error("无效地址");
    if (!transaction.isValid()) throw new Error("篡改或无效的签名");
    this.transactionPool.push(transaction);
  }

  //处理矿工挖矿事务
  minerTransactionPool(minerRewardAddress) {
    const minerTransaction = new Transaction(
      null,
      minerRewardAddress,
      this.minerReward
    );
    this.transactionPool.push(minerTransaction);

    //挖矿
    const newBlock = new Block(this.transactionPool, this.getLastBlock().hash);
    newBlock.mine(this.difficulity);
    this.Chain.push(newBlock);

    //清空transactionPool
    this.transactionPool = [];
  }

  //验证区块合法性-->通过验证当前区块previoushash==pervious区块.hash
  verifyBlockChain() {
    if (this.Chain.length == 1) {
      if (this.Chain[0].hash != this.Chain[0].generateHash()) {
        console.log("数据异常");
        return false;
      }
      return true;
    }

    if (this.Chain[0].hash != this.Chain[0].generateHash()) {
      console.log("数据异常");
      return false;
    }

    for (let index = 1; index < this.Chain.length; index++) {
      const currentBlock = this.Chain[index];
      const previousBlock = this.Chain[index - 1];

      //验证transaction
      if (!currentBlock.verifyDataTransaction()) {
        console.log("非法交易");
        return false;
      }
      if (currentBlock.hash !== currentBlock.generateHash()) {
        console.log("数据异常");
        return false;
      }
      if (currentBlock.previousHash != previousBlock.hash) {
        console.log("链条断裂");
        return false;
      }
    }
    return true;
  }
}

class Transaction {
  //其中from就是公钥
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }

  generateHash() {
    return sha256(this.from + this.to + this.amount).toString();
  }

  sign(key) {
    this.signature = key.sign(this.generateHash(), "base64").toDER("hex");
  }

  //验证签名
  isValid() {
    //代表chian发起的transaction
    if (this.from == null) return true;
    if (!this.signature) throw new Error("签名丢失");
    const KeyObject = ec.keyFromPublic(this.from, "hex");
    return KeyObject.verify(this.generateHash(), this.signature);
  }
}

module.exports = { Chain, Transaction, Block }


