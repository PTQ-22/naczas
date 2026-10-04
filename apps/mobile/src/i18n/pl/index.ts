// Only merges per-feature files; each feature owner edits its own file (AGENTS.md §6).
import { callAssist } from './callAssist';
import { common } from './common';
import { doctors } from './doctors';
import { exam } from './exam';
import { facilities } from './facilities';
import { onboarding } from './onboarding';
import { plan } from './plan';
import { profiles } from './profiles';
import { settings } from './settings';
import { visitPrep } from './visitPrep';

export const pl = {
  callAssist,
  common,
  doctors,
  onboarding,
  profiles,
  plan,
  exam,
  facilities,
  visitPrep,
  settings,
} as const;
