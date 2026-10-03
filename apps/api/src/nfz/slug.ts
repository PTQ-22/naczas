/** File-system name for a benefit: 'ŚWIADCZENIA Z ZAKRESU OKULISTYKI' → 'swiadczenia-z-zakresu-okulistyki' */
export function benefitSlug(benefit: string): string {
  return benefit
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/gi, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
