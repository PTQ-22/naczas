import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthErrorKind = 'invalid' | 'exists' | 'validation' | 'network' | 'unknown';

export class AuthError extends Error {
  override name = 'AuthError';
  constructor(
    readonly kind: AuthErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** POST /v1/auth/{login|register} → the account's family code. Errors are typed for the UI. */
export async function authenticate(
  mode: 'login' | 'register',
  email: string,
  password: string,
  _fetchFn: typeof fetch = fetch,
): Promise<{ familyCode: string; email: string }> {
  const STORAGE_KEY = 'naczas:mockUsers';
  const cleanEmail = email.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          const users: Record<string, { passwordHash: string; familyCode: string }> = stored
            ? (JSON.parse(stored) as Record<string, { passwordHash: string; familyCode: string }>)
            : {};

          if (mode === 'register') {
            if (users[cleanEmail]) {
              return reject(new AuthError('exists', 'Account exists'));
            }
            const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            users[cleanEmail] = { passwordHash: password, familyCode };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users))
              .then(() => {
                resolve({ familyCode, email: cleanEmail });
              })
              .catch(() => reject(new AuthError('unknown', 'Storage error')));
            return;
          }

          if (mode === 'login') {
            const user = users[cleanEmail];
            if (!user || user.passwordHash !== password) {
              return reject(new AuthError('invalid', 'Invalid credentials'));
            }
            return resolve({ familyCode: user.familyCode, email: cleanEmail });
          }
        })
        .catch(() => {
          return reject(new AuthError('unknown', 'Storage error'));
        });
    }, 800);
  });
}
