/**
 * Chainable, awaitable PostgREST query-builder mock shared by route/action
 * tests. Every method returns the same thenable so a call site can bolt on
 * any number of .eq()/.gt()/.select() links before awaiting it.
 *
 * Filters are recorded into `filters` so a test can assert the guard columns
 * a query used — without that, deleting a guard (e.g. an optimistic-
 * concurrency .eq()) would leave the 0-row tests still passing.
 */
export interface PostgrestChainMock {
  eq: (column: string, value: unknown) => PostgrestChainMock;
  gt: (column: string, value: unknown) => PostgrestChainMock;
  select: (columns?: string) => PostgrestChainMock;
  single: () => PostgrestChainMock;
  maybeSingle: () => PostgrestChainMock;
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
}

export function chain(result: unknown, filters: string[][] = []): PostgrestChainMock {
  const builder: PostgrestChainMock = {
    eq: (column: string, value: unknown) => {
      filters.push(["eq", column, String(value)]);
      return builder;
    },
    gt: (column: string, value: unknown) => {
      filters.push(["gt", column, String(value)]);
      return builder;
    },
    select: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return builder;
}
