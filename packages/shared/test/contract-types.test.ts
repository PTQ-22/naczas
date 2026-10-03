/**
 * Guards "contracts are 1:1 with docs/03-contracts.md": the interfaces below are copied verbatim
 * from the doc and compared with the z.infer'd types. Checked by `tsc` (pnpm typecheck).
 * If you change a contract, update the doc, this file and the schemas in the same PR.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type * as S from '../src';

/* eslint-disable @typescript-eslint/no-namespace -- namespace keeps doc copies apart from real exports */
namespace Doc {
  export type ISODate = string;
  export type Sex = 'female' | 'male';
  export type ProvinceCode =
    | '01'
    | '02'
    | '03'
    | '04'
    | '05'
    | '06'
    | '07'
    | '08'
    | '09'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16';
  export type Condition =
    | 'diabetes'
    | 'chronic_kidney_disease'
    | 'familial_hypercholesterolemia'
    | 'heart_disease'
    | 'copd'
    | 'immunosuppression';
  export type FamilyHistory =
    'colorectal_cancer' | 'breast_cancer' | 'ovarian_cancer' | 'endometrial_cancer';
  export type SmokingStatus = 'never' | 'former' | 'current';
  export type ActivityLevel = 'low' | 'medium' | 'high';

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
      quitOver15y?: boolean;
      otherLungRisk?: boolean;
    };
    activity?: ActivityLevel;
    subscribedExams?: string[];
    createdAt: ISODate;
  }

  export type LastDoneAnswer =
    'within_half_interval' | 'within_interval' | 'over_interval' | 'never' | 'unknown';
  export type UndatedLastDone = 'over_interval' | 'never' | 'unknown';

  export interface ExamRecord {
    profileId: string;
    examId: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- verbatim doc copy; ISODate is a string alias
    lastDone?: ISODate | UndatedLastDone;
    status: 'none' | 'booked' | 'done';
    bookedFor?: ISODate;
    updatedAt: ISODate;
  }

  export type BookingType = 'walk_in' | 'program' | 'queue';
  export type DerivedFactor =
    'smoker_20py' | 'smoker_20py_lung_risk' | 'current_smoker' | 'current_smoker_no_copd';

  export interface ExamRule {
    id: string;
    name: string;
    shortReason: string;
    description: string;
    eligibility: {
      sex?: Sex;
      age?: [number, number];
      requiresAny?: Array<Condition | FamilyHistory | DerivedFactor>;
      excludesAny?: Array<Condition | FamilyHistory | DerivedFactor>;
    };
    modifiers?: Array<{
      when?: Condition | FamilyHistory | DerivedFactor | 'low_activity';
      age?: [number, number];
      intervalMonths?: number;
      note: string;
    }>;
    intervalMonths: number;
    booking: BookingType;
    referral: boolean;
    referralNote?: string;
    nfzBenefits?: string[];
    programUrl?: string;
    prepTips?: string[];
    source: { name: string; url: string };
    verified: boolean;
    verifiedAt?: ISODate;
  }

  export type Urgency = 'act_now' | 'this_year' | 'later' | 'done' | 'booked';

  export interface PlanItem {
    examId: string;
    profileId: string;
    dueDate: ISODate;
    notifyDate: ISODate;
    leadTimeDays: number;
    leadTimeSource: 'nfz_live' | 'nfz_snapshot' | 'default';
    urgency: Urgency;
    reasons: string[];
    overdue: boolean;
  }

  export interface Plan {
    profileId: string;
    generatedAt: ISODate;
    items: PlanItem[];
  }

  export interface WaitTimeSummary {
    examId: string;
    province: ProvinceCode;
    radiusKm: number;
    facilitiesCount: number;
    p50Days: number | null;
    p75Days: number | null;
    minDays: number | null;
    asOf: string;
    source: 'nfz_live' | 'nfz_snapshot';
  }

  export interface Facility {
    id: string;
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
    waitDays: number | null;
    awaiting: number | null;
    anesthesia: boolean | null;
    accessibility: { ramp: boolean; elevator: boolean; parking: boolean; toilet: boolean };
    asOf: ISODate;
  }

  export interface FacilitiesResponse {
    examId: string;
    items: Facility[];
    source: 'nfz_live' | 'nfz_snapshot';
  }

  export interface ApiError {
    error: { code: string; message: string };
  }

  export interface HealthResponse {
    ok: true;
    nfz: 'up' | 'down';
    snapshotAsOf: string;
  }

  export interface CallAssistRequest {
    examName: string;
    facilityName: string;
    forWhom: string;
    callerName: string;
    bookBy?: ISODate;
  }

  export interface CallAssistStartResponse {
    callId: string;
    mode: 'live' | 'simulated';
  }

  export interface CallAssistResult {
    booked: boolean;
    date: ISODate | null;
    time: string | null;
    note: string | null;
  }

  export interface CallAssistStatus {
    callId: string;
    status: 'queued' | 'ringing' | 'in_progress' | 'ended' | 'failed';
    transcript: { role: 'agent' | 'clinic'; text: string }[];
    result: CallAssistResult | null;
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

describe('types match docs/03-contracts.md', () => {
  it('domain', () => {
    expectTypeOf<S.ISODate>().toEqualTypeOf<Doc.ISODate>();
    expectTypeOf<S.Sex>().toEqualTypeOf<Doc.Sex>();
    expectTypeOf<S.ProvinceCode>().toEqualTypeOf<Doc.ProvinceCode>();
    expectTypeOf<S.Condition>().toEqualTypeOf<Doc.Condition>();
    expectTypeOf<S.FamilyHistory>().toEqualTypeOf<Doc.FamilyHistory>();
    expectTypeOf<S.SmokingStatus>().toEqualTypeOf<Doc.SmokingStatus>();
    expectTypeOf<S.ActivityLevel>().toEqualTypeOf<Doc.ActivityLevel>();
    expectTypeOf<S.Profile>().toEqualTypeOf<Doc.Profile>();
    expectTypeOf<S.LastDoneAnswer>().toEqualTypeOf<Doc.LastDoneAnswer>();
    expectTypeOf<S.UndatedLastDone>().toEqualTypeOf<Doc.UndatedLastDone>();
    expectTypeOf<S.ExamRecord>().toEqualTypeOf<Doc.ExamRecord>();
  });

  it('rules', () => {
    expectTypeOf<S.BookingType>().toEqualTypeOf<Doc.BookingType>();
    expectTypeOf<S.ExamRule>().toEqualTypeOf<Doc.ExamRule>();
  });

  it('plan', () => {
    expectTypeOf<S.Urgency>().toEqualTypeOf<Doc.Urgency>();
    expectTypeOf<S.PlanItem>().toEqualTypeOf<Doc.PlanItem>();
    expectTypeOf<S.Plan>().toEqualTypeOf<Doc.Plan>();
  });

  it('api', () => {
    expectTypeOf<S.WaitTimeSummary>().toEqualTypeOf<Doc.WaitTimeSummary>();
    expectTypeOf<S.Facility>().toEqualTypeOf<Doc.Facility>();
    expectTypeOf<S.FacilitiesResponse>().toEqualTypeOf<Doc.FacilitiesResponse>();
    expectTypeOf<S.ApiError>().toEqualTypeOf<Doc.ApiError>();
    expectTypeOf<S.HealthResponse>().toEqualTypeOf<Doc.HealthResponse>();
    expectTypeOf<S.CallAssistRequest>().toEqualTypeOf<Doc.CallAssistRequest>();
    expectTypeOf<S.CallAssistStartResponse>().toEqualTypeOf<Doc.CallAssistStartResponse>();
    expectTypeOf<S.CallAssistResult>().toEqualTypeOf<Doc.CallAssistResult>();
    expectTypeOf<S.CallAssistStatus>().toEqualTypeOf<Doc.CallAssistStatus>();
  });
});
