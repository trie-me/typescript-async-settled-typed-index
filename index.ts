type Merge<T> = { [key in keyof T]: T[key] }
type PromiseIndex = { [K: string]: Promise<any> }
type AwaitedThen<TState extends PromiseIndex> = Promise<Awaited<TState[keyof TState]>>
type ResolvedPromiseIndex<TState extends PromiseIndex> =
  { [K in keyof TState]: Awaited<TState[K]> }
type ResolvedPromiseIndexWithError<TState extends PromiseIndex> = ResolvedPromiseIndex<TState> & { errors: any[] };
type PromiseIndexKVP<TState extends PromiseIndex> = [keyof TState, AwaitedThen<TState>]

async function settleAndResolve<TState extends PromiseIndex
>(promiseIndex: TState): Promise<ResolvedPromiseIndexWithError<TState>> {
  return (await Promise.allSettled(Object.entries(promiseIndex)
    .map(
      ([key, value]: PromiseIndexKVP<TState>) =>
        value.then(value => [key, value] as const)
    ))).reduce((acc, val) => {
      if (val?.status === 'fulfilled') {
        const [key, value] = val.value;
        acc[key] = value
      } else acc.errors.push(val.reason);
      return acc;
    },{ errors: [] } as ResolvedPromiseIndexWithError<TState>);
}

const result = await settleAndResolve({
  alpha: Promise.resolve(1),
  beta: Promise.resolve('b'),
  delta: Promise.resolve({ waffles: 1231421 }),
  gamma: Promise.reject<string>(Error('boom')),
});
console.log(result);

// This section for type investigation
type AsyncDefinition = {
  alpha: Promise<number>,
  beta: Promise<string>,
  gamma: Promise<string>,
  delta: Promise<{ waffles: number }>
}
type OutputObjectDefinition = ResolvedPromiseIndexWithError<AsyncDefinition>
type Flattened = Merge<OutputObjectDefinition>;

export { }