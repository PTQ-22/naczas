// Rules engine public API (computePlan, eligibleExams) — implemented by WS1.
export { ageAt } from './age';
export { eligibleExams, isEligible, matchingModifiers, profileFactors } from './eligibility';
export { getExamRule, parseRules, rules } from './load-rules';
export { MOCK_TODAY, mockPlan, mockProfileMama } from './mock-plan';
export * from './schedule';
export { URGENCY_ORDER, comparePlanItems, computePlan, reasonsFor } from './plan';
export { ACTIVITY_TIPS, activityTip, type ActivityTip } from './activity';
