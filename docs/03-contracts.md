# 03 — Kontrakty (źródło prawdy między workstreamami)

> Zmiana tego pliku = PR, który jednocześnie zmienia `packages/shared` i wszystkich konsumentów. Patrz `AGENTS.md` §1.3.
> Implementacja: `packages/shared/src/` — typy wyprowadzane z Zod (`z.infer`), żeby walidacja i typy nigdy się nie rozjechały.

## Typy domenowe

```ts
// packages/shared/src/domain.ts
export type ISODate = string; // 'YYYY-MM-DD'

export type Sex = 'female' | 'male';
export type ProvinceCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08'
  | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16'; // kody NFZ

// Tylko rozpoznania, które zmieniają program NFZ (docs/01-user-journey.md §Ankieta)
export type Condition =
  | 'diabetes' | 'chronic_kidney_disease' | 'familial_hypercholesterolemia' | 'heart_disease' // wyłączają ChUK
  | 'copd'               // wyłącza spirometrię; czynnik ryzyka do LDCT 50–54
  | 'immunosuppression'; // HIV lub leki immunosupresyjne → test HPV co 12 mies.
// U rodziców, rodzeństwa lub dzieci
export type FamilyHistory =
  | 'colorectal_cancer' | 'breast_cancer' | 'ovarian_cancer' | 'endometrial_cancer';

export type SmokingStatus = 'never' | 'former' | 'current';
export type ActivityLevel = 'low' | 'medium' | 'high'; // 0–1 / 2–3 / 4+ dni/tydz.

export interface Profile {
  id: string;
  name: string;
  relation: 'self' | 'parent' | 'partner' | 'child' | 'other';
  birthYear: number;
  sex: Sex;
  location?: { province: ProvinceCode; lat: number; lng: number; label: string };
  conditions: Condition[];
  familyHistory: FamilyHistory[];
  smoking: {
    status: SmokingStatus;
    packYears?: number;
    quitOver15y?: boolean;    // tylko byli palacze; LDCT wymaga abstynencji ≤ 15 lat
    otherLungRisk?: boolean;  // ekspozycja zawodowa, radon, rak płuca u krewnego I st., wybrane przebyte nowotwory
  };
  activity?: ActivityLevel;
  subscribedExams?: string[];   // badania dodane ręcznie (custom exams) — zawsze w planie
  createdAt: ISODate;
}

/** Odpowiedź z ankiety „kiedy ostatnio” — przedziały względem interwału badania (tylko w szkicu ankiety) */
export type LastDoneAnswer =
  | 'within_half_interval' | 'within_interval' | 'over_interval' | 'never' | 'unknown';
/** Co rekord trzyma bez daty; przedziały z ankiety zapisujemy jako przyjętą datę (05-scheduling-algorithm §1) */
export type UndatedLastDone = 'over_interval' | 'never' | 'unknown';

export interface ExamRecord {
  profileId: string;
  examId: string;
  lastDone?: ISODate | UndatedLastDone;
  status: 'none' | 'booked' | 'done';
  bookedFor?: ISODate;
  bookedTime?: string; // 'HH:mm' — godzina wizyty, jeśli znana
  updatedAt: ISODate;
}
```

## Reguły badań (format `packages/rules/data/exams.json`)

> **Zmiana 2026-10-04 (godzina wizyty):** opcjonalne `ExamRecord.bookedTime` (`HH:mm`); brak = wizyta całodniowa. Bez migracji (pole opcjonalne).

> **Zmiana 2026-10-04 (przedziały „kiedy ostatnio”):** `LastDoneAnswer` liczone od interwału badania; `ExamRecord.lastDone` to data albo `UndatedLastDone`. Rekordy migrowane v1 → v2.

> **Zmiana 2026-10-04 (ankieta v2):** `excludesAny` w `eligibility` (np. ChUK nie dla osób z cukrzycą). Czynniki wyliczane z profilu (`DerivedFactor`, `profileFactors` w `packages/rules`): `smoker_20py` (palący lub rzucone ≤ 15 lat, ≥ 20 paczkolat), `smoker_20py_lung_risk` (+ POChP lub inny czynnik ryzyka), `current_smoker`, `current_smoker_no_copd`. Zmiana niezgodna wstecz dla `Condition` / `FamilyHistory` / `Profile` — zapisane dane migruje store (v1 → v2).

> **Zmiana 2026-10-03 (WS1):** `modifiers[].when` opcjonalne — modifier bez `when` działa tylko po `age` (np. „Moje Zdrowie”: co 3 lata od 50 r.ż.; zmienia interwał, nie poszerza kwalifikacji). Nowe opcjonalne pole `referralNote`. Obie zmiany wstecznie zgodne.

```ts
// packages/shared/src/rules.ts
export type BookingType = 'walk_in' | 'program' | 'queue';
export type DerivedFactor =
  | 'smoker_20py' | 'smoker_20py_lung_risk' | 'current_smoker' | 'current_smoker_no_copd';

export interface ExamRule {
  id: string;                       // 'colonoscopy_screening'
  name: string;                     // PL, do UI
  shortReason: string;              // PL, 1 zdanie „dlaczego”
  description: string;              // PL, 2–4 zdania, język prosty
  eligibility: {
    sex?: Sex;
    age?: [number, number];         // włącznie
    requiresAny?: Array<Condition | FamilyHistory | DerivedFactor>;
    excludesAny?: Array<Condition | FamilyHistory | DerivedFactor>;
  };
  modifiers?: Array<{
    when?: Condition | FamilyHistory | DerivedFactor | 'low_activity'; // brak → modifier działa tylko po `age`
    age?: [number, number];
    intervalMonths?: number;
    note: string;                   // PL
  }>;
  intervalMonths: number;
  booking: BookingType;
  referral: boolean;                // czy NFZ wymaga skierowania
  referralNote?: string;            // PL, 1 zdanie: skierowanie / jak się zapisać
  nfzBenefits?: string[];           // dokładne nazwy z /benefits API NFZ (dla 'queue')
  programUrl?: string;              // dla 'program'
  prepTips?: string[];              // PL, jak się przygotować
  source: { name: string; url: string };
  verified: boolean;
  verifiedAt?: ISODate;
}
```

## Wynik silnika reguł

```ts
// packages/shared/src/plan.ts
export type Urgency = 'act_now' | 'this_year' | 'later' | 'done' | 'booked';

export interface PlanItem {
  examId: string;
  profileId: string;
  dueDate: ISODate;               // kiedy badanie powinno być zrobione
  notifyDate: ISODate;            // kiedy zacząć organizować (dueDate − leadTime)
  leadTimeDays: number;
  leadTimeSource: 'nfz_live' | 'nfz_snapshot' | 'default';
  urgency: Urgency;
  reasons: string[];              // PL: bazowe + z modifierów
  overdue: boolean;
}

export interface Plan {
  profileId: string;
  generatedAt: ISODate;           // = today przekazane do computePlan
  items: PlanItem[];              // posortowane: urgency, potem notifyDate
}

// packages/rules — publiczne API
export function computePlan(input: {
  profile: Profile;
  records: ExamRecord[];
  waitTimes: Record<string, WaitTimeSummary | undefined>; // klucz: examId
  today: ISODate;
}): Plan;

export function eligibleExams(profile: Profile, today: ISODate): ExamRule[];
```

## API — `apps/api` (prefiks `/v1`)

Wszystkie odpowiedzi JSON. Błąd: `{ "error": { "code": string, "message": string } }` z odpowiednim statusem HTTP.

### `GET /v1/wait-times?examId=&province=&lat=&lng=&radiusKm=`
Agregat czasu oczekiwania dla badania w okolicy — wejście do algorytmu `notifyDate`.

```ts
export interface WaitTimeSummary {
  examId: string;
  province: ProvinceCode;
  radiusKm: number;               // faktycznie użyty (może być rozszerzony)
  facilitiesCount: number;
  p50Days: number | null;
  p75Days: number | null;         // używany do leadTime
  minDays: number | null;
  asOf: string;                   // 'YYYY-MM' najnowszego rekordu (dates.date-situation-as-at, inaczej statistics.update)
  source: 'nfz_live' | 'nfz_snapshot';
}
```

### `GET /v1/facilities?examId=&province=&lat=&lng=&radiusKm=&sort=soonest|nearest&limit=20`

> **Zmiana 2026-10-03 (WS2-1):** NFZ zwraca `dates: null` w 100% rekordów. Źródłem czasu oczekiwania jest `statistics.provider-data.average-period` (średni czas oczekiwania w dniach, raportowany przez placówkę). `sort=soonest` = rosnąco po `waitDays`, nulle na końcu. Typy bez zmian.

> **Zmiana 2026-10-04 (ITL v1.4):** `waitDays` = prognoza NFZ `dates.pcus` w dniach (gdy `applicable`), inaczej `average-period`; `average-period: 0` przy `awaiting: 0` = 0 (brak kolejki). `asOf` = `dates.date-situation-as-at` (dzienna). Nowe pole `anesthesia` (NFZ `anesthesia` Y/N; brak → `null`, Zod `.default(null)` dla starszego API). Szczegóły: `docs/04-data-sources.md` §A.

```ts
export interface Facility {
  id: string;                     // NFZ queue id
  benefit: string;
  providerName: string;
  placeName: string;
  address: string;
  locality: string;
  phone: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  firstAvailableDate: ISODate | null; // zawsze null — ITL nie podaje pierwszego wolnego terminu
  waitDays: number | null;        // dates.pcus (dni), inaczej average-period; null = brak danych
  awaiting: number | null;        // statistics.provider-data.awaiting
  anesthesia: boolean | null;     // NFZ anesthesia Y/N; null = brak informacji
  accessibility: { ramp: boolean; elevator: boolean; parking: boolean; toilet: boolean };
  asOf: ISODate;                  // dates.date-situation-as-at; bez niego statistics.update → 'YYYY-MM-01'
}

export interface FacilitiesResponse {
  examId: string;
  items: Facility[];
  source: 'nfz_live' | 'nfz_snapshot';
}
```

### `GET /v1/health` → `{ ok: true, nfz: 'up' | 'down', snapshotAsOf: string }`

### `GET /v1/coverage?program=mammography|cervical|colonoscopy&province=&lat=&lng=`

Odsetek uprawnionych objętych programem przesiewowym NFZ w okolicy (statystyka regionalna, nie dotyczy osoby). `province`, `lat`/`lng` opcjonalne (`lat` i `lng` razem); serwer zaokrągla współrzędne do 2 miejsc i ich nie loguje (§8). Obszar: współrzędne → TERYT gminy przez GUGiK ULDK (timeout 3 s, cache w pamięci); kolejno gmina (jeśli ≥ 1000 uprawnionych) → powiat → województwo z `province` → cały kraj. Dane statyczne z `apps/api/data/screening/coverage.json` (źródło: 04-data-sources §E). Błędy: 400 `invalid_query`, 404 `no_data`.

```ts
// packages/shared/src/coverage.ts
export interface Coverage {
  program: 'mammography' | 'cervical' | 'colonoscopy';
  level: 'gmina' | 'powiat' | 'voivodeship' | 'country';
  areaName: string; // mianownik: 'Zielonki' | 'powiat krakowski' | 'Warszawa' | 'mazowieckie' | 'Polska'
  percent: number; // 0–100, 1 miejsce po przecinku
  eligible: number; // liczba kwalifikujących się
  covered?: number; // „wyłączonych – ogółem” wg NFZ
  asOf: string; // 'YYYY-MM-DD' — data raportu NFZ
  source: string; // URL pliku xlsx NFZ
}
```

Mapowanie w aplikacji: `mammography` → `mammography`, `cervical_screening` → `cervical`, `colonoscopy_screening` → `colonoscopy` (`apps/mobile/src/services/coverage.ts`).

### `POST /v1/call-assist` (demo „Zadzwoń za mnie”)
Agent głosowy AI (Vapi) dzwoni i prosi o termin. **Dzwoni wyłącznie na numer z env `DEMO_CALL_TO`** (nigdy na numer z requestu ani placówki); bez konfiguracji Vapi zwraca `mode: 'simulated'` (skryptowana rozmowa). Agent w pierwszym zdaniu mówi, że jest AI i w czyim imieniu dzwoni (AI Act art. 50). Body nie zawiera PESEL ani nazwiska.

```ts
export interface CallAssistRequest {
  examName: string;               // mianownik, agent mówi „na badanie: <examName>”
  facilityName: string;
  forWhom: string;                // np. „mamę” (biernik, mówione przez agenta)
  callerName: string;             // imię opiekuna w dopełniaczu („Kasi”)
  bookBy?: ISODate;               // najpóźniejszy akceptowalny termin
}

export interface CallAssistStartResponse {
  callId: string;
  mode: 'live' | 'simulated';
}
```

### `GET /v1/call-assist/:callId`

```ts
export interface CallAssistResult {
  booked: boolean;
  date: ISODate | null;
  time: string | null;            // 'HH:MM'
  note: string | null;
}

export interface CallAssistStatus {
  callId: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'ended' | 'failed';
  transcript: { role: 'agent' | 'clinic'; text: string }[];
  result: CallAssistResult | null;   // po zakończeniu rozmowy
}
```

## Mapowanie examId → świadczenia NFZ
Trzymane w `ExamRule.nfzBenefits` (pakiet `rules`), API importuje `@naczas/rules` żeby rozwiązać `examId` → nazwy świadczeń. Klient nigdy nie wysyła surowej nazwy świadczenia.
