
export const randomAmount = (max: number, min: number, bal: number) => {
  const amount = ((max > bal ? bal : max) - min) * Math.random() + min
  return amount
}