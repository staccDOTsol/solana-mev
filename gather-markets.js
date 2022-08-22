let Connection = require('@solana/web3.js').Connection
let PublicKey = require('@solana/web3.js').PublicKey

let fs = require('fs')
let Market = require('@project-serum/serum').Market
let connection = new Connection("https://solana--mainnet.datahub.figment.io/apikey/fff8d9138bc9e233a2c1a5d4f777e6ad", {"commitment":"confirmed"})
let DEX_PROGRAM_ID = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin")
let markets = []
let theProxy = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
async function doTheThing(address2){
 
                try {
        let market = await Market.load(connection, new PublicKey(address2), {}, DEX_PROGRAM_ID);
                    if (!markets.includes(_market._decoded.baseMint+ "-"+ market._decoded.quoteMint)){
        markets.push(market._decoded.baseMint+ "-"+ market._decoded.quoteMint)
                    }
                    console.log(markets.length)
                }
                catch (err){
                    console.log(err)
                }   
}
setTimeout(async function(){
let aha = await connection.getSignaturesForAddress(new PublicKey(theProxy))
for (var abc of aha){

try {    
        let hmm = await connection.getTransaction(abc.signature, "json")
        if (hmm){
        for (var address of hmm.transaction.message.accountKeys){
        if (address = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"){
            if ( true){         
                //console.log('ding' + hmm.transaction.message.accountKeys.length.toString())
        for (var address2 of hmm.transaction.message.accountKeys){
            if (address2 != "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"){
                doTheThing(address2)
            }
        }
        }
    }
    }
        }
    
    }catch(err){
        console.log(err)
    }
}})