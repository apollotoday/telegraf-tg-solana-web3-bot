import { EWalletType } from '@prisma/client';
import prisma from '../../lib/prisma';
import { getBotCustomerByName } from '../customer/botCustomer';
import fs from 'fs';
import path from 'path';
import { decryptWallet, uint8ArrayToBase58 } from '../wallet/walletUtils';

export async function exportSniperWallets(customer: string) {

  const sniperBotCustomer = await getBotCustomerByName(customer)

  if (!sniperBotCustomer) {
    throw new Error(`Sniper bot customer not found: ${customer}`)
  }

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: sniperBotCustomer.id,
      type: EWalletType.SNIPING
    }
  })

  console.log(`Found ${botCustomerWallets.length} sniper wallets for customer ${sniperBotCustomer.name}`)

  const filePath = path.join(process.cwd(), `export_wallets/${sniperBotCustomer.name}_${new Date().toISOString().split('T')[0]}_wallets.txt`);
  const header = 'pubkey,private_key\n';
  fs.writeFileSync(filePath, header);

  for (const wallet of botCustomerWallets) {
    const decryptedWallet = decryptWallet(wallet.encryptedPrivKey);
    const line = `${wallet.pubkey},${uint8ArrayToBase58(decryptedWallet.secretKey)}\n`;
    fs.appendFileSync(filePath, line);
  }

  console.log(`Exported wallet keys to ${filePath}`);
}