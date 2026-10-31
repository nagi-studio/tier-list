export type NonEmpty<T> = [T, ...T[]];

/** Preserve an existing non-empty shape by construction, without parsing internal data again. */
export function mapNonEmpty<T, U>([first, ...rest]: NonEmpty<T>, map: (value: T, index: number) => U): NonEmpty<U> {
  return [map(first, 0), ...rest.map((value, index) => map(value, index + 1))];
}

/** Inserting a known value into any array always constructs a non-empty result. */
export function insertNonEmpty<T>({items, index, value}: {items: T[]; index: number; value: T}): NonEmpty<T> {
  return items.slice(0, index).reduceRight<NonEmpty<T>>((tail, item) => [item, ...tail], [value, ...items.slice(index)]);
}
