import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ColorValue } from 'react-native';

import { useTheme } from '@/theme';

type SymbolName = Extract<SymbolViewProps['name'], { ios?: unknown }>;

// One name per meaning: SF Symbols on iOS, Material Symbols (bundled font, works offline) on
// Android and web. Always decorative — meaning is carried by the adjacent text label.
const symbols = {
  alert: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  plan: { ios: 'list.bullet.clipboard', android: 'assignment', web: 'assignment' },
  time: { ios: 'clock', android: 'schedule', web: 'schedule' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  booked: { ios: 'calendar.badge.checkmark', android: 'event_available', web: 'event_available' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  external: { ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  people: { ios: 'person.2', android: 'group', web: 'group' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  trophy: { ios: 'trophy', android: 'emoji_events', web: 'emoji_events' },
  heart: { ios: 'heart', android: 'favorite', web: 'favorite' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  map: { ios: 'map', android: 'map', web: 'map' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  filter: {
    ios: 'line.3.horizontal.decrease.circle',
    android: 'filter_list',
    web: 'filter_list',
  },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof symbols;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  /** Explicit pixel size (e.g. tab bar icons sized by the navigator). */
  px?: number;
  color?: ColorValue;
}

export function Icon({ name, size = 'md', px, color }: IconProps) {
  const theme = useTheme();
  const dim = px ?? theme.layout.icon[size];
  return (
    <SymbolView
      name={symbols[name]}
      size={dim}
      tintColor={color ?? theme.colors.text}
      // Reserve the box while the web/Android symbol font loads, so rows don't jump.
      style={{ width: dim, height: dim }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    />
  );
}
