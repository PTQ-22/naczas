import type { CallAssistStatus } from '@naczas/shared';

import { Text } from '@/components/Text';
import { t } from '@/i18n';

import { clock } from './task-status';

/** "Próby: 2 · na linii 0:14 · rozmowa 0:29" — what the agent did instead of the user. */
export function CallStats({ stats }: { stats: CallAssistStatus['stats'] }) {
  if (!stats || stats.attempts === 0) return null;
  return (
    <Text variant="caption" tone="textMuted" testID="call-stats">
      {t('callAssist.stats', {
        attempts: stats.attempts,
        waited: clock(stats.waitedSec),
        talked: clock(stats.talkedSec),
      })}
    </Text>
  );
}
