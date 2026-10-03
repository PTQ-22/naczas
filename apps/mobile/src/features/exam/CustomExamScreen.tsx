import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { rules } from '@naczas/rules';

import { OptionTile } from '@/components/OptionTile';
import { Plate } from '@/components/Plate';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useProfilesStore, selectActiveProfile } from '@/store';
import { useTheme } from '@/theme';

export default function CustomExamScreen() {
  const { space } = useTheme();
  const activeProfile = useProfilesStore(selectActiveProfile);
  const updateProfile = useProfilesStore((s) => s.updateProfile);

  // Filter exams that are purely opt-in (sex: 'none') and not already subscribed
  const customExams = rules.filter(
    (r) => r.source.name === 'Custom' && !activeProfile?.subscribedExams?.includes(r.id),
  );

  const handleSelect = (examId: string) => {
    if (!activeProfile) return;
    updateProfile(activeProfile.id, {
      subscribedExams: [...(activeProfile.subscribedExams ?? []), examId],
    });
    router.back();
  };

  if (!activeProfile) return null;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
        <Text variant="display">Dodaj wizytę na NFZ</Text>
        <Text variant="bodyLarge" tone="textMuted">
          Wybierz poradnię, którą zalecił Ci lekarz. Aplikacja zacznie automatycznie śledzić czas
          oczekiwania na wolne terminy w Twojej okolicy.
        </Text>

        <Plate>
          <View style={{ gap: space.sm }}>
            {customExams.length === 0 ? (
              <Text tone="textMuted">Wszystkie dostępne poradnie są już na Twojej liście.</Text>
            ) : (
              customExams.map((exam) => (
                <OptionTile
                  key={exam.id}
                  label={exam.name}
                  description={exam.shortReason}
                  selected={false}
                  mode="radio"
                  onPress={() => handleSelect(exam.id)}
                />
              ))
            )}
          </View>
        </Plate>
      </ScrollView>
    </Screen>
  );
}
