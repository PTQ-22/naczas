import { Text, type ColorValue } from 'react-native';

import { useTheme } from '@/theme';

// No icon library is installed (AGENTS.md: no new deps without the team), so icons are
// Unicode glyphs. Always decorative — meaning is carried by the adjacent text label.
const glyphs = {
  alert: '!',
  calendar: '▦',
  time: '◷',
  check: '✓',
  booked: '◉',
  info: 'i',
  plus: '+',
  chevronDown: '▾',
  chevronUp: '▴',
  chevronRight: '›',
  external: '↗',
  phone: '☎',
  people: '☺',
  settings: '⚙',
} as const;

export type IconName = keyof typeof glyphs;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  color?: ColorValue;
}

export function Icon({ name, size = 'md', color }: IconProps) {
  const theme = useTheme();
  const px = theme.layout.icon[size];
  return (
    <Text
      accessible={false}
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={{
        fontSize: px,
        minWidth: px,
        textAlign: 'center',
        fontWeight: '700',
        color: color ?? theme.colors.text,
      }}
    >
      {glyphs[name]}
    </Text>
  );
}
