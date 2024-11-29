import { EWalletType } from '@prisma/client'
import prisma from '../../lib/prisma'
import { getBotCustomerByName } from '../customer/botCustomer'
import fs from 'fs'
import path from 'path'
import { decryptWallet, uint8ArrayToBase58 } from '../wallet/walletUtils'

export async function exportSniperWallets(customer: string) {
  const sniperBotCustomer = await getBotCustomerByName(customer)

  if (!sniperBotCustomer) {
    throw new Error(`Sniper bot customer not found: ${customer}`)
  }

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: sniperBotCustomer.id,
      type: EWalletType.SNIPING,
    },
  })

  console.log(`Found ${botCustomerWallets.length} sniper wallets for customer ${sniperBotCustomer.name}`)

  const filePath = path.join(
    process.cwd(),
    `export_wallets/${sniperBotCustomer.name}_${new Date().toISOString().split('T')[0]}_wallets.txt`,
  )
  const header = 'pubkey,private_key\n'
  fs.writeFileSync(filePath, header)

  for (const wallet of botCustomerWallets) {
    const decryptedWallet = decryptWallet(wallet.encryptedPrivKey)
    const line = `${wallet.pubkey},${uint8ArrayToBase58(decryptedWallet.secretKey)}\n`
    fs.appendFileSync(filePath, line)
  }

  console.log(`Exported wallet keys to ${filePath}`)
}

export async function exportWallets({ customerName, wallets, type }: { customerName: string; wallets: { pubkey: string; encryptedPrivKey: string }[]; type: EWalletType }) {
  const isoDate = new Date().toISOString().split('.')[0]
  const fileName = `${customerName}_${isoDate}.json`
  const filePath = path.join(process.cwd(), `export_wallets/${type.toLowerCase()}`, fileName)

  const dataToExport = {
    customerName,
    wallets: wallets.map((wallet) => ({
      pubkey: wallet.pubkey,
      encryptedPrivKey: wallet.encryptedPrivKey,
    })),
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(dataToExport, null, 2))

  console.log(`Exported service funding wallets to ${filePath}`)

  const txtFilePath = path.join(
    process.cwd(),
    `export_wallets/${type.toLowerCase()}/${customerName}_${new Date().toISOString().split('T')[0]}_wallets.txt`,
  )
  const txtHeader = 'pubkey,private_key\n'
  fs.writeFileSync(txtFilePath, txtHeader)

  for (const wallet of wallets) {
    const decryptedWallet = decryptWallet(wallet.encryptedPrivKey)
    const txtLine = `${wallet.pubkey},${uint8ArrayToBase58(decryptedWallet.secretKey)}\n`
    fs.appendFileSync(txtFilePath, txtLine)
  }

  console.log(`Exported wallet keys to ${txtFilePath}`)
}

export function jsonToTextForFundingWallets(jsonFilePath: string) {
  const json = fs.readFileSync(path.join(process.cwd(), jsonFilePath), 'utf8')
  const data = JSON.parse(json)

  const txtFilePath = jsonFilePath.replace('.json', '.txt')
  const txtHeader = 'pubkey,private_key\n'
  fs.writeFileSync(txtFilePath, txtHeader)

  for (const wallet of data.wallets) {
    const decryptedWallet = decryptWallet(wallet.encryptedPrivKey)
    const txtLine = `${wallet.pubkey},${uint8ArrayToBase58(decryptedWallet.secretKey)}\n`
    fs.appendFileSync(txtFilePath, txtLine)
  }
}
