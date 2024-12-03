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