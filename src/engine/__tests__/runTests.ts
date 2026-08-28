import { runAllTests as runDataCleaningTests } from './dataCleaningAndValidation.test';
import { runCommissionAndReportingTests } from './commissionAndReportingRules.test';
import { runEndToEndReliabilityTests } from './endToEndReliability.test';
import { runLicenseAndExcelTests } from './licenseAndExcel.test';

async function main() {
  try {
    runDataCleaningTests();
    runCommissionAndReportingTests();
    runEndToEndReliabilityTests();
    await runLicenseAndExcelTests();
    console.log('🎉 ALL ENGINE & RELIABILITY TEST SUITES PASSED CLEANLY!\n');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

