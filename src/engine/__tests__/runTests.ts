import { runAllTests as runDataCleaningTests } from './dataCleaningAndValidation.test';
import { runCommissionAndReportingTests } from './commissionAndReportingRules.test';
import { runEndToEndReliabilityTests } from './endToEndReliability.test';

try {
  runDataCleaningTests();
  runCommissionAndReportingTests();
  runEndToEndReliabilityTests();
  console.log('🎉 ALL ENGINE & RELIABILITY TEST SUITES PASSED CLEANLY!\n');
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
