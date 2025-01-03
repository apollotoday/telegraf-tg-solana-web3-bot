export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MaybePromise<T> = T | Promise<T>;

export async function measureTime<T>(name: string, fn: () => MaybePromise<T>) {
  const start = Date.now();
  const result = await fn();
  console.log(`${name} took ${Date.now() - start}ms`);
  return result;
}

export function filterTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}
