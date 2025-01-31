import { Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { rankingBoost } from './src/modules/markets/raydium'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { encryptPrivateKey } from './src/modules/wallet/walletUtils'
import { connection } from './src/config'

const subwalletlist = [
]
const mainKey = ''
const mainPrivKey = encryptPrivateKey(Uint8Array.from(bs58.decode(mainKey)), process.env.WALLET_ENCRYPTION_SECRET!)

const rankingBoostSystem = async () => {
    const wallets = subwalletlist.map((item) => {
        return {
            isActive: true,
            botCustomerId: '1',
            pubkey: Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item))).publicKey.toBase58(),
            encryptedPrivKey: encryptPrivateKey(Uint8Array.from(bs58.decode(item)), process.env.WALLET_ENCRYPTION_SECRET!)
        }
    })
    const token = '9QJ8Qkxz4kBCa5tTYswBWM3vairThAzDRuB8Mh8FE7qn'
    const pool = '6LfqGQFoYP8qxnfk7xV6T9mksvQx3sDkCLYADKGUeMjV'
    rankingBoost(wallets, mainPrivKey, token, pool)
}

const distributeSol = async () => {
    const ixs: TransactionInstruction[] = [];

    subwalletlist.map((item) => {
        ixs.push(
            SystemProgram.transfer({
                fromPubkey: Keypair.fromSecretKey(Uint8Array.from(bs58.decode(mainKey))).publicKey,
                toPubkey: Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item))).publicKey,
                lamports: 0.001 * LAMPORTS_PER_SOL,
            })
        );
    })

    const blockHash = (await connection.getLatestBlockhash('finalized')).blockhash;

    let messageV0 = new TransactionMessage({
        payerKey: Keypair.fromSecretKey(Uint8Array.from(bs58.decode(mainKey))).publicKey,
        recentBlockhash: blockHash,
        instructions: ixs,
    }).compileToV0Message();

    const versionedTx = new VersionedTransaction(messageV0);
    versionedTx.sign([Keypair.fromSecretKey(Uint8Array.from(bs58.decode(mainKey)))])

    const sim = await connection.simulateTransaction(versionedTx);
    console.log('sim', sim)
    const txid = await connection.sendTransaction(versionedTx);
    const confirm = await connection.confirmTransaction(txid)
    console.log(confirm)
    console.log('sign ->', txid)
}

// distributeSol()
rankingBoostSystem()