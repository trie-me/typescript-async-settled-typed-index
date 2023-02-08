type Merge<T> = { [key in keyof T]: T[key] }
type ResolvedPromiseIndex<TState extends { [K: string]: Promise<any> }> =
  {
    [K in keyof TState]: Awaited<TState[K]>;
  }
type ResolvedPromiseIndexWithError<TState extends { [K: string]: Promise<any> }> = ResolvedPromiseIndex<TState> & { errors: any[] };

function isKeySetGuard(arg: any): arg is { keys: string[] } {
  return arg?.keys && Array.isArray(arg.keys);
}

async function settleAndResolve<
  TState extends { [K: string]: Promise<any> },
  TValue extends Awaited<TState[keyof TState]>
>(promiseIndex: TState): Promise<ResolvedPromiseIndexWithError<TState>> {
  const promises = Object.keys(promiseIndex).map((key: keyof TState) => {
    return (promiseIndex[key] as Promise<TValue>).then(
      (resolvedValue: TValue) => {
        /* Partial<ResolvedPromiseIndex<TState>> 
           - is in the structural subset of ResolvedPromiseIndex<TState>   
             - Which is in the structural subset of ResolvedPromiseIndexWithError<TState>
        */
        const partial = {} as Partial<ResolvedPromiseIndex<TState>>;
        partial[key] = resolvedValue;
        return partial;
      }
    );
  });
  const results = await Promise.allSettled(promises);
  const result = results.reduce(
    (acc, val) => {
      if (val?.status === 'fulfilled') {
        acc = { ...acc, ...val.value };
      } else {
        acc.errors.push(val.reason);
      }
      return acc;
    },
    { errors: [] } as ResolvedPromiseIndexWithError<TState>
  );
  return result;
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