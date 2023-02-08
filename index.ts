type ResolvedPromiseIndex<TState extends { [K: string]: Promise<any> }> = {
    [key in keyof TState]?: Awaited<TState[key]>;
  } & { errors: any[] };
  
  function isKeySetGuard(arg: any): arg is { keys: string[] } {
    return arg?.keys && Array.isArray(arg.keys);
  }
  
  async function settleAndResolve<
    TState extends { [K: string]: Promise<any> },
    TValue extends Awaited<TState[keyof TState]>
  >(promiseIndex: TState): Promise<ResolvedPromiseIndex<TState>> {
    const promises = Object.keys(promiseIndex).map((key: keyof TState) => {
      return (promiseIndex[key] as Promise<TValue>).then(
        (resolvedValue: TValue) => {
          const partial = {} as Partial<{
            [K in keyof TState]: Awaited<TState[K]>;
          }>;
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
      { errors: [] } as ResolvedPromiseIndex<TState>
    );
    return result;
  }
  
  const z = settleAndResolve({
    alpha: Promise.resolve(1),
    beta: Promise.resolve('b'),
    delta: Promise.resolve({ waffles: 1231421 }),
    gamma: Promise.reject(Error('boom')),
  });
  z.then((v) => {
    console.log(v.alpha, v.beta, v.delta, v.gamma, v.errors);
  }).catch(v => console.error('Result: ', v.errors));
  z.then(console.log);
  