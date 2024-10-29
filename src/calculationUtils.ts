import _ from "lodash";

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
