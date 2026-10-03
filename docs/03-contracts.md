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

export type Condition = 'diabetes' | 'hypertension' | 'heart_disease' | 'other';
export type FamilyHistory =
  | 'breast_cancer' | 'colorectal_cancer' | 'prostate_cancer' | 'ovarian_cancer'
  | 'early_cardiovascular'; // zawał/udar u krewnego 1. stopnia < 60 r.ż.

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
  smoking: { status: SmokingStatus; packYears?: number };
  activity?: ActivityLevel;
  heightCm?: number;
  weightKg?: number;
  createdAt: ISODate;
}

/** Odpowiedź z ankiety „kiedy ostatnio”, zanim użytkownik poda dokładną datę */
export type LastDoneAnswer = 'within_1y' | '1_3y' | 'over_3y' | 'never' | 'unknown';

export interface ExamRecord {
  profileId: string;
  examId: string;
  lastDone?: ISODate | LastDoneAnswer;
  status: 'none' | 'booked' | 'done';
  bookedFor?: ISODate;
  updatedAt: ISODate;
}
```

## Reguły badań (format `packages/rules/data/exams.json`)

```ts
// packages/shared/src/rules.ts
export type BookingType = 'walk_in' | 'program' | 'queue';

export interface ExamRule {
  id: string;                       // 'colonoscopy_screening'
  name: string;                     // PL, do UI
  shortReason: string;              // PL, 1 zdanie „dlaczego”
  description: string;              // PL, 2–4 zdania, język prosty
  eligibility: {
    sex?: Sex;
    age?: [number, number];         // włącznie
    requiresAny?: Array<Condition | FamilyHistory | 'smoker_20py'>;
  };
  modifiers?: Array<{
    when: Condition | FamilyHistory | 'smoker_20py' | 'low_activity';
    age?: [number, number];
    intervalMonths?: number;
    note: string;                   // PL
  }>;
  intervalMonths: number;
  booking: BookingType;
  referral: boolean;                // czy NFZ wymaga skierowania
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
  asOf: string;                   // 'YYYY-MM' z NFZ statistics.update
  source: 'nfz_live' | 'nfz_snapshot';
}
```

### `GET /v1/facilities?examId=&province=&lat=&lng=&radiusKm=&sort=soonest|nearest&limit=20`

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
  firstAvailableDate: ISODate | null;
  waitDays: number | null;        // firstAvailableDate − asOf
  awaiting: number | null;        // statistics.provider-data.awaiting
  accessibility: { ramp: boolean; elevator: boolean; parking: boolean; toilet: boolean };
  asOf: ISODate;                  // dates.date-situation-as-at
}

export interface FacilitiesResponse {
  examId: string;
  items: Facility[];
  source: 'nfz_live' | 'nfz_snapshot';
}
```

### `GET /v1/health` → `{ ok: true, nfz: 'up' | 'down', snapshotAsOf: string }`

## Mapowanie examId → świadczenia NFZ
Trzymane w `ExamRule.nfzBenefits` (pakiet `rules`), API importuje `@naczas/rules` żeby rozwiązać `examId` → nazwy świadczeń. Klient nigdy nie wysyła surowej nazwy świadczenia.
