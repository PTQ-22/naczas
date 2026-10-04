import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';

import { Button, Plate, Screen, Text, TextField } from '@/components';
import { API_BASE_URL } from '@/services/api';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

export function LoginModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [mObywatelLoading, setMObywatelLoading] = useState(false);
  const router = useRouter();
  const setFamilyCode = useSettingsStore((s) => s.setFamilyCode);
  const { space, colors } = useTheme();

  const handleAuth = async (type: 'login' | 'register') => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as {
        user?: { id: string; email: string; familyCode: string };
        error?: { message: string };
      };

      if (!res.ok || !data.user) {
        throw new Error(data.error?.message ?? 'Nie udało się zalogować.');
      }

      setFamilyCode(data.user.familyCode);

      // On success, simply close the modal
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/plan');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        Alert.alert('Błąd', e.message);
      } else {
        Alert.alert('Błąd', 'Wystąpił nieznany błąd.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMObywatel = () => {
    setMObywatelLoading(true);
    setTimeout(() => {
      setMObywatelLoading(false);
      setFamilyCode('MOBY24'); // Mock successful family code
      if (router.canGoBack()) router.back();
      else router.replace('/plan');
    }, 2000);
  };

  return (
    <Screen wall>
      <Plate>
        <View style={{ gap: space.sm, paddingBottom: space.md }}>
          <Text variant="heading" style={{ fontSize: 24 }}>
            Witaj w naCzas
          </Text>
          <Text tone="textMuted">
            Zaloguj się na Konto Rodzinne, aby zsynchronizować zdrowie Twojej rodziny.
          </Text>
        </View>

        <View style={{ gap: space.md, paddingBottom: space.md }}>
          {mObywatelLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Button
              label="Zaloguj przez mObywatel"
              variant="secondary"
              onPress={handleMObywatel}
              disabled={true}
              fullWidth
            />
          )}
          <View style={{ alignItems: 'center' }}>
            <Text tone="textSubtle">lub podaj adres email</Text>
          </View>
        </View>

        <View style={{ gap: space.md }}>
          <TextField
            label="Adres email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Hasło" value={password} onChangeText={setPassword} secureTextEntry />

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: space.md }}
            />
          ) : (
            <View style={{ gap: space.sm, marginTop: space.sm }}>
              <Button
                label={mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
                onPress={() => void handleAuth(mode)}
                fullWidth
              />
              <Button
                variant="ghost"
                label={
                  mode === 'login'
                    ? 'Nie masz konta? Zarejestruj się'
                    : 'Masz już konto? Zaloguj się'
                }
                onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
                fullWidth
              />
              <Button
                variant="ghost"
                label="Zamknij"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/plan'))}
                fullWidth
              />
            </View>
          )}
        </View>
      </Plate>
    </Screen>
  );
}
