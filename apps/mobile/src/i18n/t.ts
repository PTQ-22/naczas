type Dict = { readonly [key: string]: string | Dict };

/** Union of dot-separated paths to string leaves, e.g. 'plan.title' | 'common.tabs.plan'. */
export type TranslationKey<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${TranslationKey<T[K]>}`;
}[keyof T & string];

export type TranslateParams = Record<string, string | number>;

export function createT<T extends Dict>(dict: T) {
  return function t(key: TranslationKey<T>, params?: TranslateParams): string {
    let node: string | Dict | undefined = dict;
    for (const part of key.split('.')) {
      node = typeof node === 'object' ? node[part] : undefined;
    }
    // Missing key falls back to the key itself so a typo is visible in UI instead of crashing.
    if (typeof node !== 'string') return key;
    if (!params) return node;
    return node.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };
}
