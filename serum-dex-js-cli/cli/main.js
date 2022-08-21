"use strict";
// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.loadKeypairSync = exports.Blockchain = void 0;
var bn_js_1 = require("bn.js");
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var market_1 = require("@project-serum/serum/src/market");
var src_1 = require("@project-serum/serum/src");
var utils_1 = require("@project-serum/swap/src/utils");
var fs_1 = require("fs");
// ============================================================================= bc class
var Blockchain = /** @class */ (function () {
    function Blockchain() {
        this.DEX_PROGRAM_ID = new web3_js_1.PublicKey('DtidW34Be7LFuAsgyyQi5Jwdr9YpTCXEzKa33Ury4YE6');
        this.marketKp = new web3_js_1.Keypair();
        this.reqQKp = new web3_js_1.Keypair();
        this.eventQKp = new web3_js_1.Keypair();
        this.bidsKp = new web3_js_1.Keypair();
        this.asksKp = new web3_js_1.Keypair();
    }
    // --------------------------------------- connection
    Blockchain.prototype.getConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, version;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = 'http://localhost:8899';
                        this.connection = new web3_js_1.Connection(url, 'recent');
                        return [4 /*yield*/, this.connection.getVersion()];
                    case 1:
                        version = _a.sent();
                        console.log('connection to cluster established:', url, version);
                        return [2 /*return*/];
                }
            });
        });
    };
    // --------------------------------------- init market
    Blockchain.prototype.initMarket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, marketIx, requestQueueIx, eventQueueIx, bidsIx, asksIx, _c, vaultSignerPk, vaultSignerNonce, _d, _e, _f, _g, _h, _j, initMarketIx;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this._createMintAccount()];
                    case 1:
                        _a.coinMint = _k.sent();
                        _b = this;
                        return [4 /*yield*/, this._createMintAccount()];
                    case 2:
                        _b.pcMint = _k.sent();
                        return [4 /*yield*/, this._generateCreateStateAccIx(this.marketKp.publicKey, 376 + 12)];
                    case 3:
                        marketIx = _k.sent();
                        return [4 /*yield*/, this._generateCreateStateAccIx(this.reqQKp.publicKey, 640 + 12)];
                    case 4:
                        requestQueueIx = _k.sent();
                        return [4 /*yield*/, this._generateCreateStateAccIx(this.eventQKp.publicKey, 1048576 + 12)];
                    case 5:
                        eventQueueIx = _k.sent();
                        return [4 /*yield*/, this._generateCreateStateAccIx(this.bidsKp.publicKey, 65536 + 12)];
                    case 6:
                        bidsIx = _k.sent();
                        return [4 /*yield*/, this._generateCreateStateAccIx(this.asksKp.publicKey, 65536 + 12)];
                    case 7:
                        asksIx = _k.sent();
                        return [4 /*yield*/, this._prepareAndSendTx([marketIx, requestQueueIx, eventQueueIx, bidsIx, asksIx], [this.ownerKp, this.marketKp, this.reqQKp, this.eventQKp, this.bidsKp, this.asksKp])];
                    case 8:
                        _k.sent();
                        console.log('created necessary accounts');
                        return [4 /*yield*/, (0, utils_1.getVaultOwnerAndNonce)(this.marketKp.publicKey, this.DEX_PROGRAM_ID)];
                    case 9:
                        _c = _k.sent(), vaultSignerPk = _c[0], vaultSignerNonce = _c[1];
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
                        _d = this;
                        return [4 /*yield*/, this._createTokenAccount(this.coinMint, vaultSignerPk)];
                    case 10:
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
                        _d.coinVaultPk = _k.sent();
                        _e = this;
                        return [4 /*yield*/, this._createTokenAccount(this.pcMint, vaultSignerPk)];
                    case 11:
                        _e.pcVaultPk = _k.sent();
                        _f = this;
                        return [4 /*yield*/, this._createAndFundUserAccount(this.coinMint, 0)];
                    case 12:
                        _f.coinUserPk = _k.sent();
                        _g = this;
                        return [4 /*yield*/, this._createAndFundUserAccount(this.pcMint, 5000)];
                    case 13:
                        _g.pcUserPk = _k.sent();
                        // this.srmUserPk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
                        // this.msrmUserPk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);
                        _h = this;
                        return [4 /*yield*/, this._createAndFundUserAccount(this.coinMint, 1000)];
                    case 14:
                        // this.srmUserPk = await this._createTokenAccount(this.srmMint, this.ownerKp.publicKey);
                        // this.msrmUserPk = await this._createTokenAccount(this.msrmMint, this.ownerKp.publicKey);
                        _h.coinUser2Pk = _k.sent();
                        _j = this;
                        return [4 /*yield*/, this._createAndFundUserAccount(this.pcMint, 0)];
                    case 15:
                        _j.pcUser2Pk = _k.sent();
                        initMarketIx = src_1.DexInstructions.initializeMarket({
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
                            baseLotSize: new bn_js_1["default"](1),
                            quoteLotSize: new bn_js_1["default"](1),
                            feeRateBps: new bn_js_1["default"](50),
                            vaultSignerNonce: vaultSignerNonce,
                            quoteDustThreshold: new bn_js_1["default"](100),
                            programId: this.DEX_PROGRAM_ID
                        });
                        return [4 /*yield*/, this._prepareAndSendTx([initMarketIx], [this.ownerKp])];
                    case 16:
                        _k.sent();
                        console.log('successfully inited the market at', this.marketKp.publicKey.toBase58());
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype.loadMarket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, market_1.Market.load(this.connection, this.marketKp.publicKey, {}, this.DEX_PROGRAM_ID)];
                    case 1:
                        _a.market = _b.sent();
                        console.log('market loaded');
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype.placeBids = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.market.placeOrder(this.connection, {
                            owner: this.ownerKp,
                            payer: this.pcUserPk,
                            side: 'buy',
                            price: 120,
                            size: 10,
                            orderType: 'limit'
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.market.placeOrder(this.connection, {
                                owner: this.ownerKp,
                                payer: this.pcUserPk,
                                side: 'buy',
                                price: 110,
                                size: 20,
                                orderType: 'limit'
                            })];
                    case 2:
                        _a.sent();
                        console.log('placed bids');
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype.placeAsks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.market.placeOrder(this.connection, {
                            owner: this.ownerKp,
                            payer: this.coinUser2Pk,
                            side: 'sell',
                            price: 119,
                            size: 10,
                            orderType: 'limit'
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.market.placeOrder(this.connection, {
                                owner: this.ownerKp,
                                payer: this.coinUser2Pk,
                                side: 'sell',
                                price: 130,
                                size: 30,
                                orderType: 'limit'
                            })];
                    case 2:
                        _a.sent();
                        console.log('placed asks');
                        return [2 /*return*/];
                }
            });
        });
    };
    //without this function tokens won't become free
    Blockchain.prototype.consumeEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var openOrders, consumeEventsIx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.market.findOpenOrdersAccountsForOwner(this.connection, this.ownerKp.publicKey)];
                    case 1:
                        openOrders = _a.sent();
                        consumeEventsIx = this.market.makeConsumeEventsInstruction(openOrders.map(function (oo) { return oo.publicKey; }), 100);
                        return [4 /*yield*/, this._prepareAndSendTx([consumeEventsIx], [this.ownerKp])];
                    case 2:
                        _a.sent();
                        console.log('consumed events');
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype.settleFunds = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, openOrders;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0;
                        return [4 /*yield*/, this.market.findOpenOrdersAccountsForOwner(this.connection, this.ownerKp.publicKey)];
                    case 1:
                        _a = _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        openOrders = _a[_i];
                        console.log(openOrders);
                        if (!(openOrders.baseTokenFree > new bn_js_1["default"](0) || openOrders.quoteTokenFree > new bn_js_1["default"](0))) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.market.settleFunds(this.connection, this.ownerKp, openOrders, 
                            // spl-token accounts to which to send the proceeds from trades
                            //todo be careful here - coins go to user1 (buyer), pc go to user2 (Seller)
                            // because the owner in this case is the same for the two it's a bit of a mess
                            this.coinUserPk, this.pcUser2Pk)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log('settled funds');
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype.printMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bids, asks, _i, _a, _b, price, size, _c, _d, _e, price, size, _f, _g, fill, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
            return __generator(this, function (_1) {
                switch (_1.label) {
                    case 0:
                        console.log('// ---------------------------------------');
                        return [4 /*yield*/, this.market.loadBids(this.connection)];
                    case 1:
                        bids = _1.sent();
                        return [4 /*yield*/, this.market.loadAsks(this.connection)];
                    case 2:
                        asks = _1.sent();
                        // bids
                        console.log('bids are:');
                        for (_i = 0, _a = bids.getL2(20); _i < _a.length; _i++) {
                            _b = _a[_i], price = _b[0], size = _b[1];
                            console.log(price, size);
                        }
                        // asks
                        console.log('asks are:');
                        for (_c = 0, _d = asks.getL2(20); _c < _d.length; _c++) {
                            _e = _d[_c], price = _e[0], size = _e[1];
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
                        console.log('fills are:');
                        _f = 0;
                        return [4 /*yield*/, this.market.loadFills(this.connection)];
                    case 3:
                        _g = _1.sent();
                        _1.label = 4;
                    case 4:
                        if (!(_f < _g.length)) return [3 /*break*/, 6];
                        fill = _g[_f];
                        // @ts-ignore
                        console.log(fill.orderId, fill.price, fill.size, fill.side);
                        _1.label = 5;
                    case 5:
                        _f++;
                        return [3 /*break*/, 4];
                    case 6:
                        //open orders are:
                        // const orders = await this.market.loadOrdersForOwner(this.connection, this.ownerKp.publicKey);
                        // console.log('open orders for the owner are', orders);
                        //user token balances
                        console.log('PROTOCOL:');
                        _j = (_h = console).log;
                        _k = ['  coin vault balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.coinVaultPk)];
                    case 7:
                        _j.apply(_h, _k.concat([_1.sent()]));
                        _m = (_l = console).log;
                        _o = ['  pc vault balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.pcVaultPk)];
                    case 8:
                        _m.apply(_l, _o.concat([_1.sent()]));
                        console.log('USER 1:');
                        _q = (_p = console).log;
                        _r = ['  coin user balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.coinUserPk)];
                    case 9:
                        _q.apply(_p, _r.concat([_1.sent()]));
                        _t = (_s = console).log;
                        _u = ['  pc user balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.pcUserPk)];
                    case 10:
                        _t.apply(_s, _u.concat([_1.sent()]));
                        console.log('USER 2:');
                        _w = (_v = console).log;
                        _x = ['  coin user 2 balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.coinUser2Pk)];
                    case 11:
                        _w.apply(_v, _x.concat([_1.sent()]));
                        _z = (_y = console).log;
                        _0 = ['  pc user 2 balance is'];
                        return [4 /*yield*/, this._getTokenBalance(this.pcUser2Pk)];
                    case 12:
                        _z.apply(_y, _0.concat([_1.sent()]));
                        console.log('// ---------------------------------------');
                        return [2 /*return*/];
                }
            });
        });
    };
    // --------------------------------------- helpers
    Blockchain.prototype._getTokenBalance = function (tokenAccPk) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection.getTokenAccountBalance(tokenAccPk)];
                    case 1:
                        balance = _a.sent();
                        return [2 /*return*/, balance.value.uiAmount];
                }
            });
        });
    };
    Blockchain.prototype._prepareAndSendTx = function (instructions, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, sig;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tx = (_a = new web3_js_1.Transaction()).add.apply(_a, instructions);
                        return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(this.connection, tx, signers)];
                    case 1:
                        sig = _b.sent();
                        console.log(sig);
                        return [2 /*return*/];
                }
            });
        });
    };
    Blockchain.prototype._createMintAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, spl_token_1.Token.createMint(this.connection, this.ownerKp, this.ownerKp.publicKey, null, 0, spl_token_1.TOKEN_PROGRAM_ID)];
            });
        });
    };
    Blockchain.prototype._createTokenAccount = function (mint, owner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mint.createAccount(owner)];
            });
        });
    };
    Blockchain.prototype._createAndFundUserAccount = function (mint, mintAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenUserPk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mint.createAccount(this.ownerKp.publicKey)];
                    case 1:
                        tokenUserPk = _a.sent();
                        return [4 /*yield*/, mint.mintTo(tokenUserPk, this.ownerKp.publicKey, [], mintAmount)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, tokenUserPk];
                }
            });
        });
    };
    Blockchain.prototype._generateCreateStateAccIx = function (newAccountPubkey, space) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = web3_js_1.SystemProgram).createAccount;
                        _c = {
                            programId: this.DEX_PROGRAM_ID,
                            fromPubkey: this.ownerKp.publicKey,
                            newAccountPubkey: newAccountPubkey,
                            space: space
                        };
                        return [4 /*yield*/, this.connection.getMinimumBalanceForRentExemption(space)];
                    case 1: return [2 /*return*/, _b.apply(_a, [(_c.lamports = _d.sent(),
                                _c)])];
                }
            });
        });
    };
    return Blockchain;
}());
exports.Blockchain = Blockchain;
function loadKeypairSync(path) {
    var secretKey = JSON.parse(fs_1["default"].readFileSync(path, 'utf8'));
    return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(secretKey));
}
exports.loadKeypairSync = loadKeypairSync;
function play() {
    return __awaiter(this, void 0, void 0, function () {
        var bc, _a, b1, b2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    bc = new Blockchain();
                    _a = bc;
                    return [4 /*yield*/, loadKeypairSync('/home/gitpod/.config/solana/id.json')];
                case 1:
                    _a.ownerKp = _b.sent();
                    return [4 /*yield*/, bc.getConnection()];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, bc.connection.getBalance(bc.ownerKp.publicKey)];
                case 3:
                    b1 = _b.sent();
                    console.log('balance is', b1);
                    return [4 /*yield*/, bc.initMarket()];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, bc.connection.getBalance(bc.ownerKp.publicKey)];
                case 5:
                    b2 = _b.sent();
                    console.log('balance is', b2);
                    console.log('initiaing a market costs', (b2 - b1) / web3_js_1.LAMPORTS_PER_SOL);
                    return [2 /*return*/];
            }
        });
    });
}
play();
