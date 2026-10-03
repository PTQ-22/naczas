import { pl } from './pl';
import { createT, type TranslationKey } from './t';

export type { TranslateParams } from './t';
export type MessageKey = TranslationKey<typeof pl>;

export const t = createT(pl);
