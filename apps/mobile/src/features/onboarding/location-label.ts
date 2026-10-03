import { t } from '@/i18n';
import type { PostalLocation } from '@/services/postal';

/** „Warszawa, woj. mazowieckie” when the postal prefix names one city, else „woj. …”. */
export function postalLocationLabel(point: PostalLocation): string {
  const province = t(`onboarding.steps.location.provinces.${point.province}`);
  return point.city
    ? t('onboarding.steps.location.cityLabel', { city: point.city, province })
    : t('onboarding.steps.location.provinceLabel', { province });
}
