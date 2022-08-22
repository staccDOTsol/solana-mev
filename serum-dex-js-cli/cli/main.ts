import BN from 'bn.js';
import WebSocket, { Server } from 'ws';


import fetch from 'node-fetch'
import { bootServer, stopServer, DataMessage, SerumListMarketItem, SubRequest, SuccessResponse } from '../serum-vial/dist'
import { wait } from '../serum-vial/dist/helpers'
import {
  Connection,
  Keypair, LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction, Signer,
  SystemProgram,
  Transaction, TransactionInstruction,
} from '@solana/web3.js';
import {
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Market } from '../packages/serum/lib/market';
import { DexInstructions } from '../packages/serum/lib';
import {getVaultOwnerAndNonce} from '../packages/swap/lib/utils';
import fs from 'fs';

const PORT = 8900
const TIMEOUT = 180 * 1000
const WS_ENDPOINT = 'wss://api.serum-vial.dev/v1/ws'//ws://localhost:${PORT}/v1/ws`

// ============================================================================= bc class

export class Blockchain {
   current: any  = {};
  connection: Connection;
  DEX_PROGRAM_ID = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
  vaultSigner: PublicKey;

  // ownerKp: Keypair = Keypair.fromSecretKey(Uint8Array.from([208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75, 115, 181, 199, 242, 120, 4, 78, 75, 19, 227, 13, 215, 184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1, 160, 223, 124, 241, 202, 203, 220, 237, 50, 242, 57, 158, 226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15, 249, 157, 62, 80]));
  ownerKp: Keypair;

  marketKp = new Keypair();
  reqQKp = new Keypair();
  eventQKp = new Keypair();
  bidsKp = new Keypair();
  asksKp = new Keypair();

  //mints
  coinMint: Token;
  pcMint: Token;
  // srmMint: Token;
  // msrmMint: Token;

  //the protocol
  coinVaultPk: PublicKey;
  pcVaultPk: PublicKey;

  //user 1
  coinUserPk: PublicKey;
  pcUserPk: PublicKey;
  // srmUserPk: PublicKey;
  msrmUserPk: PublicKey;

  //user 2
  coinUser2Pk: PublicKey;
  pcUser2Pk: PublicKey;
  // srmUser2Pk: PublicKey;
  // msrmUser2Pk: PublicKey;

  market: Market;

  // --------------------------------------- connection

  async getConnection() {
    const url = 'https://solana-api.projectserum.com';
    this.connection = new Connection(url, 'recent');
    const version = await this.connection.getVersion();
    console.log('connection to cluster established:', url, version);
  }

  // --------------------------------------- init market

  async initMarket() {
    this.coinMint = await this._createMintAccount();
    this.pcMint = await this._createMintAccount();
    // this.srmMint = new Token(this.connection, new PublicKey('8JuQxz4ESxWHqGvyx2x7ppbX9pifLUqUg7Ye3jAPX9ga'), TOKEN_PROGRAM_ID, this.ownerKp as any);
    // this.msrmMint = new Token(this.connection, new PublicKey('E4NjqsYo7SY3xV2CoR62db4VnWfnEUTBetCWA4qSFw1S'), TOKEN_PROGRAM_ID, this.ownerKp as any);
    // console.log('srm mint is ', this.srmMint.publicKey.toBase58());

    //length taken from here - https://github.com/project-serum/serum-dex/blob/master/dex/crank/src/lib.rs#L1286
    //this holds market state, hence need to fit this data structure - https://github.com/project-serum/serum-dex/blob/master/dex/src/state.rs#L176
    const marketIx = await this._generateCreateStateAccIx(this.marketKp.publicKey, 376 + 12);
    //support few requests at a time, but many (1<<20) events
    const requestQueueIx = await this._generateCreateStateAccIx(this.reqQKp.publicKey, 640 + 12);
    const eventQueueIx = await this._generateCreateStateAccIx(this.eventQKp.publicKey, 1048576 + 12);
    //support 1<<16 bids and asks
    const bidsIx = await this._generateCreateStateAccIx(this.bidsKp.publicKey, 65536 + 12);
    const asksIx = await this._generateCreateStateAccIx(this.asksKp.publicKey, 65536 + 12);
await this.connection.requestAirdrop(this.ownerKp.publicKey, 1000 * 10 * 18)
    await this._prepareAndSendTx(
      [marketIx, requestQueueIx, eventQueueIx, bidsIx, asksIx],
      [this.ownerKp, this.marketKp, this.reqQKp, this.eventQKp, this.bidsKp, this.asksKp],
    );
    console.log('created necessary accounts');

    //create the vault signer PDA

    const [vaultSignerPk, vaultSignerNonce] = await getVaultOwnerAndNonce(
      this.marketKp.publicKey,
      this.DEX_PROGRAM_ID,
    );

    // const seeds = [this.marketKp.publicKey.toBuffer(), Buffer.from([vaultSignerNonce, 0, 0, 0, 0, 0, 0, 0])];
    // const created_key = await PublicKey.createProgramAddress(
    //   seeds,
    //   this.DEX_PROGRAM_ID,
    // );
    // console.log('seeds are', seeds);
    // console.log('nonce is ', vaultSignerNonce);
    // console.log('acc is ', this.marketKp.publicKey.toBase58());
    // console.log('created vault signer PDA, at ', vaultSignerPk.toBase58());
    // console.log('created vault signer PDA, at ', vaultSignerPk.toBytes());
    // console.log('created vault signer PDA, at ', created_key.toBase58());
    // console.log('created vault signer PDA, at ', created_key.toBytes());

    //create token accounts
    this.coinVaultPk = await this._createTokenAccount(this.coinMint, vaultSignerPk as any);
    this.pcVaultPk = await this._createTokenAccount(this.pcMint, vaultSignerPk as any);
  
    this.coinUserPk = await this._createAndFundUserAccount(this.coinMint, 1000);
    this.pcUserPk = await this._createAndFundUserAccount(this.pcMint, 5000);
    // this.srmUserPk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
    // this.msrmUserPk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);

    this.coinUser2Pk = await this._createAndFundUserAccount(this.coinMint, 1000);
    this.pcUser2Pk = await this._createAndFundUserAccount(this.pcMint, 5000);
    await this.pcMint.mintTo(this.pcVaultPk, this.ownerKp.publicKey, [], 1000);
    await this.coinMint.mintTo(this.coinVaultPk , this.ownerKp.publicKey, [], 1000);

    // this.srmUser2Pk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
    // this.msrmUser2Pk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);

    const initMarketIx = DexInstructions.initializeMarket({
        //dex accounts
        market: this.marketKp.publicKey,
        requestQueue: this.reqQKp.publicKey,
        eventQueue: this.eventQKp.publicKey,
        bids: this.bidsKp.publicKey,
        asks: this.asksKp.publicKey,
        //vaults
        baseVault: this.coinVaultPk,
        quoteVault: this.pcVaultPk,
        //mints
        baseMint: this.coinMint.publicKey,
        quoteMint: this.pcMint.publicKey,
        //rest
        baseLotSize: new BN(1),
        quoteLotSize: new BN(1),
        feeRateBps: new BN(50),
        vaultSignerNonce: vaultSignerNonce,
        quoteDustThreshold: new BN(100),
        programId: this.DEX_PROGRAM_ID,
        // authority = undefined,
        // pruneAuthority = undefined,
      },
    );

    await this._prepareAndSendTx(
      [initMarketIx],
      [this.ownerKp],
    );
   
    console.log('successfully inited the market at', this.marketKp.publicKey.toBase58());
  }

  async loadMarket(key: string, proxy: string) {
    try {
    this.market = await Market.load( this.connection, new PublicKey(key), {}, new PublicKey(proxy));
    console.log('market loaded');
    }
     catch (err){
console.log('bad market boyee')
     }
  }

  async execute(
    market_ids: any [],
    trades: string ,
    prices: number ,// [current[abc.name].bid, current[abc2.name].ask],
    volumes : number//[1,1/current[abc.name].bid]
  ) {
   
   return await this.market.placeOrder(this.connection, {
        owner: this.ownerKp as any,
        payer: this.ownerKp.publicKey,
        // @ts-ignore
    stuff:[{
        side: trades,
        price: prices,
        size: volumes}
      ],
        orderType: 'limit',
      },
    );
    console.log('placed buy-sell-buy');
       await this.consumeEvents();
       await this.printMetrics()

    await this.market.placeOrder(this.connection, {
      owner: this.ownerKp as any,
      payer: this.coinUser2Pk,
           // @ts-ignore
  stuff:[{
    
    side: 'sell',
    price: 119,
    size: 1},{ side: 'sell',
    price: 130,
    size: 1},{ side: 'sell',
    price: 90,
    size: 1}
  ],
      orderType: 'limit',
    },
  );
  console.log('placed sell-buy-sell');
  await this.consumeEvents();
  await this.printMetrics()

    await this.settleFunds();
  await this.printMetrics()
  }

  //without this function tokens won't become free
  async consumeEvents() {
    const openOrders = await this.market.findOpenOrdersAccountsForOwner(
      this.connection,
      this.ownerKp.publicKey,
    );
    const consumeEventsIx = this.market.makeConsumeEventsInstruction(
      openOrders.map(oo => oo.publicKey), 100
    )
    await this._prepareAndSendTx(
      [consumeEventsIx],
      [this.ownerKp]
    )
    console.log('consumed events')
  }

  async settleFunds(side: string = 'buy') {
    for (let openOrders of await this.market.findOpenOrdersAccountsForOwner(
      this.connection,
      this.ownerKp.publicKey,
    )) {
      if (openOrders.baseTokenFree > new BN(0) || openOrders.quoteTokenFree > new BN(0)) {

        await this.market.settleFunds(
          this.connection,
          this.ownerKp as any,
          openOrders,
          // spl-token accounts to which to send the proceeds from trades
          //todo be careful here - coins go to user1 (buyer), pc go to user2 (Seller)
          // because the owner in this case is the same for the two it's a bit of a mess
           this.coinUserPk,
          this.pcUser2Pk,
          this.ownerKp.publicKey,
        );
      }
    }
    console.log('settled funds');
  }

  async printMetrics() {
    console.log('// ---------------------------------------');
    let bids = await this.market.loadBids(this.connection);
    let asks = await this.market.loadAsks(this.connection);

    // bids
    console.log('bids are:');
    for (let [price, size] of bids.getL2(20)) {
      console.log(price, size);
    }

    // asks
    console.log('asks are:');
    for (let [price, size] of asks.getL2(20)) {
      console.log(price, size);
    }
    // for (let order of asks) {
    //   console.log(
    //     order.orderId,
    //     order.price,
    //     order.size,
    //     order.side, // 'buy' or 'sell'
    //   );
    // }

    // fills
    console.log('fills are:')
    for (let fill of await this.market.loadFills(this.connection)) {
      // @ts-ignore
      console.log(fill.orderId, fill.price, fill.size, fill.side);
    }

    //open orders are:
    // const orders = await this.market.loadOrdersForOwner(this.connection, this.ownerKp.publicKey);
    // console.log('open orders for the owner are', orders);

    //user token balances
    console.log('PROTOCOL:')
    console.log('  coin vault balance is', await this._getTokenBalance(this.coinVaultPk));
    console.log('  pc vault balance is', await this._getTokenBalance(this.pcVaultPk));
    console.log('USER 1:')
    console.log('  coin user balance is', await this._getTokenBalance(this.coinUserPk));
    console.log('  pc user balance is', await this._getTokenBalance(this.pcUserPk));
    console.log('USER 2:')
    console.log('  coin user 2 balance is', await this._getTokenBalance(this.coinUser2Pk));
    console.log('  pc user 2 balance is', await this._getTokenBalance(this.pcUser2Pk));
    console.log('// ---------------------------------------');
  }

  // --------------------------------------- helpers

  async _getTokenBalance(tokenAccPk: PublicKey) {
    const balance = await this.connection.getTokenAccountBalance(tokenAccPk);
    return balance.value.uiAmount;
  }

  async _prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
    const tx = new Transaction().add(...instructions);
    const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
    console.log(sig);
  }

  async _createMintAccount(): Promise<Token> {
    return Token.createMint(
      this.connection,
      this.ownerKp as any,
      this.ownerKp.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID,
    );
  }

  async _createTokenAccount(mint: Token, owner: PublicKey): Promise<PublicKey> {
    return mint.createAccount(owner);
  }

  async _createAndFundUserAccount(mint: Token, mintAmount: number): Promise<PublicKey> {
    const tokenUserPk = await mint.createAccount(this.ownerKp.publicKey);
    await mint.mintTo(tokenUserPk, this.ownerKp.publicKey, [], mintAmount);
    return tokenUserPk;
  }

  async _generateCreateStateAccIx(newAccountPubkey: PublicKey, space: number): Promise<TransactionInstruction> {
    return SystemProgram.createAccount({
      programId: this.DEX_PROGRAM_ID,
      fromPubkey: this.ownerKp.publicKey,
      newAccountPubkey,
      space,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
    });
  }
}

export function loadKeypairSync(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function play() {
  const bc = new Blockchain();
  bc.ownerKp = await loadKeypairSync('/workspace/id.json');
console.log(bc.ownerKp.publicKey.toBase58())
  await bc.getConnection();
//  await bc.connection.requestAirdrop(bc.ownerKp.publicKey, 1000 * 10 **9)
 // const b1 = await bc.connection.getBalance(bc.ownerKp.publicKey);
 // console.log('balance is', b1);
 // await bc.initMarket();

async function fetchMarkets() {
  const response = await fetch(`https://api.serum-vial.dev/v1/markets`)

  return (await response.json()) as SerumListMarketItem[]
}
 setTimeout(async () => {
  const wsClient = new SimpleWebsocketClient(WS_ENDPOINT)
  const markets = await fetchMarkets()
  console.log(markets.length)
  let receivedSubscribed = false
  let receivedSnapshot = false
  let m1 = [] 
  let m2 = [] 
  let m3 = []
  for (var abc of markets){
    if (m1.length < 99){
    m1.push(abc.name)
  }
  else  if (m2.length < 99){
    m2.push(abc.name)
  }
  else {
    m3.push(abc.name)
  }
  }
  var subscribeRequest: SubRequest = {
    op: 'subscribe',
    channel: 'level2',
    markets: m1
  }

  console.log(m1.length)
  await wsClient.send(subscribeRequest)
  var subscribeRequest: SubRequest = {
    op: 'subscribe',
    channel: 'level2',
    markets: m2
  }
  console.log(m2.length)

  await wsClient.send(subscribeRequest)
  var subscribeRequest: SubRequest = {
    op: 'subscribe',
    channel: 'level2',
    markets: m3
  }
  console.log(m3.length)

  await wsClient.send(subscribeRequest)
  let l2MessagesCount = 0

  for await (const message of wsClient.stream()) {
    if (message.type === 'subscribed') {
      receivedSubscribed = true
    }
    if (message.type === 'l2snapshot') {
     // console.log(message )
      // @ts-ignore
      bc.current[message.market] = {'bid': parseFloat(message.bids[0]), 'ask': parseFloat(message.asks[0])}

      
      receivedSnapshot = true
    }

      
    
  }
})
class SimpleWebsocketClient {
private readonly _socket: WebSocket

constructor(url: string) {
  this._socket = new WebSocket(url)
}

public async send(payload: any) {
  while (this._socket.readyState !== WebSocket.OPEN) {
    await wait(100)
  }
  this._socket.send(JSON.stringify(payload))
}

public async *stream() {
  const realtimeMessagesStream = (WebSocket as any).createWebSocketStream(this._socket, {
    readableObjectMode: true
  }) as AsyncIterableIterator<Buffer>

  for await (let messageBuffer of realtimeMessagesStream) {
    const message = JSON.parse(messageBuffer as any)
    yield message as DataMessage | SuccessResponse
  }
}
}
  const b2 = await bc.connection.getBalance(bc.ownerKp.publicKey);
  console.log('balance is', b2);
  //console.log('initiaing a market costs', (b2-b1)/LAMPORTS_PER_SOL);
async function doTheThing(){
  setTimeout(async function(){
  let mjson = JSON.parse(fs.readFileSync('../markets.json').toString())
  let markets = JSON.parse(fs.readFileSync('../markets.json').toString())
let usds =["USDT", "USDC"]
        for (var usd of  usds){
        // @ts-ignore
    for (var abc of mjson){
let balance = 10 ** 9
// @ts-ignore
          if (abc.name.split('/')[1] == usd){
                      // @ts-ignore
if (bc.current[abc.name] != undefined){
                        // @ts-ignore
// balance 1000 usdc

// buy into this, leg1
                      // @ts-ignore
balance = balance / bc.current[abc.name].ask 

if (!isNaN(balance)){
for (var abc2 of markets){
                      // @ts-ignore
          if (usds.includes(abc2.name.split('/')[1])){
                      // @ts-ignore
if (bc.current[abc2.name] != undefined){
                      // @ts-ignore
                        // @ts-ignore
balance = balance *  bc.current[abc2.name].bid 

if (!isNaN(balance)){

if (balance > 10 ** 9){
            console.log(abc.name)
            console.log(abc2.name)
let market_ids = []
for (var bca of mjson){
  if (bca.name == abc.name){
    market_ids[0] = ([bca.programId,bca.address])
  }
  if (bca.name == abc2.name){
    market_ids[1] = ([bca.programId,bca.address])
  }
}
let trades = ['buy', 'sell']
let prices = [bc.current[abc.name].bid, bc.current[abc2.name].ask]
let volumes =    [1,1/bc.current[abc.name].bid]

let insts = []
let signers = []
for (var trade in market_ids){ 
  try {
 await bc.loadMarket(market_ids[trade][1], market_ids[trade][0])
  }
  catch (err){
   await bc.loadMarket(market_ids[trade][0], market_ids[trade][1])

  }
  try {
let something = await  bc.execute(
  market_ids,
 trades[trade],
 prices[trade],
 volumes[trade]

)
console.log(
  market_ids,
 trades[trade],
 prices[trade],
 volumes[trade])
insts.push(...something.transaction.instructions)
signers.push(...something.signers)
  } catch (err){
console.log(err)
  }
}try {
let hm =await bc._prepareAndSendTx(insts, [bc.ownerKp, ...signers])
console.log(hm)
} catch (err){

  console.log(err.err)
}
}
}
}
}
}
}
}
          }
          }}})
}
  setTimeout(async function(){

    setTimeout(async function(){
      doTheThing()
     })}, 15000)
setInterval(async function(){
  setTimeout(async function(){
 doTheThing()
})}, 60000 * 3)


  //
 //await bc.execute()
}

play();
