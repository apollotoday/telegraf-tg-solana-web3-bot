import { BotCustomerWallet, EWalletType } from '@prisma/client'
import { closeWallet, sendSol, Sol } from '../../solUtils'
import { createAndStoreBotCustomerWallets } from '../wallet/walletService'
import { decryptWallet } from '../wallet/walletUtils'
import reattempt from 'reattempt'
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { sleep } from '../utils/timeUtils'
import { primaryRpcConnection } from '../../config'

export async function sendSolFromWalletToWalletWithCycles({
  cycles,
  sourceKeypair,
  targetKeypair,
  sendAll,
  amount,
  feePayerKeypair,
  customerId,
}: {
  cycles: number
  sourceKeypair: Keypair
  targetKeypair: Keypair
  sendAll: boolean
  amount: Sol
  feePayerKeypair?: Keypair
  customerId: string
}) {
  const { wallets: cycleFundingWallets, walletCount: cycleFundingWalletCount } = await createAndStoreBotCustomerWallets({
    subWalletCount: cycles,
    walletType: EWalletType.SNIPING_FUNDING,
    customerId: customerId,
  })

  for (let i = 0; i <= cycleFundingWalletCount; i++) {
    try {
      await reattempt.run({ times: 7, delay: 500 }, async () => {
        if (i === 0) {
          const balance = await primaryRpcConnection.getBalance(sourceKeypair.publicKey, 'confirmed');
          
          const { txSig, confirmedResult } = await sendSol({
            amount: sendAll ? Sol.fromLamports(balance) : amount,
            from: sourceKeypair,
            to: new PublicKey(cycleFundingWallets[i].pubkey),
            feePayer: feePayerKeypair ?? sourceKeypair,
          })

          if (confirmedResult.value.err) {
            console.log(`Error funding ${cycleFundingWallets[i].pubkey}: ${confirmedResult.value.err}`)
            throw new Error(`Error funding ${cycleFundingWallets[i].pubkey}: ${confirmedResult.value.err}`)
          }

          console.log('Transaction sent and confirmed:', txSig, `to fund ${cycleFundingWallets[i].pubkey}`)
        } else if (i === cycleFundingWalletCount) {
          console.log(`last cycle funding wallet: ${cycleFundingWallets[i - 1].pubkey} => ${targetKeypair.publicKey.toBase58()}`)

          const lastCycleFundingWallet = cycleFundingWallets[i - 1]
          const lastCycleFundingWalletKeypair = decryptWallet(lastCycleFundingWallet.encryptedPrivKey)

          const { txSig, confirmedResult } = await closeWallet({
            waitTime: 10000,
            from: lastCycleFundingWalletKeypair,
            to: targetKeypair,
            feePayer: feePayerKeypair ?? sourceKeypair,
          })

          if (confirmedResult.value.err) {
            console.log(
              `Error closing ${lastCycleFundingWallet.pubkey} and funding ${targetKeypair.publicKey.toBase58()}: ${
                confirmedResult.value.err
              }`,
            )
            throw new Error(
              `Error closing ${lastCycleFundingWallet.pubkey} and funding ${targetKeypair.publicKey.toBase58()}: ${
                confirmedResult.value.err
              }`,
            )
          }

          console.log(
            'Transaction sent and confirmed:',
            txSig,
            `to close ${lastCycleFundingWallet.pubkey} and fund ${targetKeypair.publicKey.toBase58()}`,
          )
        } else {
          console.log(`Cycle Funding wallet: ${cycleFundingWallets[i - 1].pubkey} => ${cycleFundingWallets[i].pubkey}`)

          const fromKeypair = decryptWallet(cycleFundingWallets[i - 1].encryptedPrivKey)
          const toKeypair = decryptWallet(cycleFundingWallets[i].encryptedPrivKey)
          const { txSig, confirmedResult } = await closeWallet({
            from: fromKeypair,
            to: toKeypair,
            feePayer: feePayerKeypair ?? sourceKeypair,
            waitTime: 10000,
          })

          if (confirmedResult.value.err) {
            console.log(
              `Error closing ${cycleFundingWallets[i - 1].pubkey} and funding ${cycleFundingWallets[i].pubkey}: ${
                confirmedResult.value.err
              }`,
            )
            throw new Error(
              `Error closing ${cycleFundingWallets[i - 1].pubkey} and funding ${cycleFundingWallets[i].pubkey}: ${
                confirmedResult.value.err
              }`,
            )
          }

          console.log(
            'Transaction sent and confirmed:',
            txSig,
            `to close ${cycleFundingWallets[i - 1].pubkey} and fund ${cycleFundingWallets[i].pubkey}`,
          )
        }
      })
    } catch (err) {
      console.error(`Error funding ${targetKeypair.publicKey.toBase58()}: ${err}`)
    }

    await sleep(1500)
  }

  console.log(
    `Funding ${targetKeypair.publicKey.toBase58()} with ${cycles} cycles completed from ${sourceKeypair.publicKey.toBase58()}`,
  )
}
