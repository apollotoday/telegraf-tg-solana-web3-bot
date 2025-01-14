import _ from "lodash";
import crypto from 'crypto';

export function secureRandomNumber(min: number, max: number): number {
  if (min > max) {
    throw new Error('The minimum value must be less than the maximum value.')
  }
  if (min === max) {
    return min
  }
  // The randomInt function generates a random integer in the given range
  return crypto.randomInt(min, max)
}

export function calculatePartionedSwapAmount(totalSwapAmount: number, partCount: number, randomSlippagePercentage: number) {
  let partAmounts = [];
  const averagePartAmount = totalSwapAmount / partCount;
  for (let i = 0; i < partCount - 1; i++) {
    const randomSlippage = averagePartAmount * randomSlippagePercentage;
    const partAmount = _.random(averagePartAmount - randomSlippage, averagePartAmount + randomSlippage);
    partAmounts.push(partAmount);
  }
  const totalPartAmount = _.sum(partAmounts);
  const lastPartAmount = totalSwapAmount - totalPartAmount;
  partAmounts.push(lastPartAmount);
  return partAmounts;
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const randomAmount = (max: number, min: number, bal: number) => {
  const maxAmount = max > bal ? bal : max

  return getRandomFloat(min, maxAmount)
}

export function distributeTotalAmountRandomlyAcrossWallets(totalAmount: number, walletCount: number, finalSplitCount: number) {
  const avgAmount = totalAmount / (walletCount - finalSplitCount)
  const walletsToReceive: number[] = []

  let remainingAmount = totalAmount

  for (let i = 0; i < walletCount; i++) {
    const variance = avgAmount * (Math.random() * 0.4 - 0.2)
    let amountToSend = avgAmount + variance

    if (remainingAmount < 0) {
      console.error('Remaining amount is less than 0')
      continue
    }

    if ((remainingAmount - amountToSend) < 0) {
      amountToSend = remainingAmount
    }

    remainingAmount -= amountToSend

    console.log(`${i} will receive ${amountToSend}`)

    walletsToReceive.push(amountToSend)
  }

  if (remainingAmount > 0) {
    const avgAmountLeftOver = remainingAmount / finalSplitCount

    walletsToReceive.push(...Array(finalSplitCount).fill(avgAmountLeftOver))
  }

  return walletsToReceive
}