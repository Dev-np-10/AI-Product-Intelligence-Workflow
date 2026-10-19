import { runValidationTests } from './validationTests.js';
async function main() {
    const report = await runValidationTests();
    console.log('\n=== Validation Test Report ===\n');
    report.results.forEach((r, i) => {
        const status = r.passed ? 'PASS' : 'FAIL';
        console.log(`[${i + 1}/${report.totalTests}] ${status} — ${r.name}`);
        console.log(`         ${r.detail}\n`);
    });
    console.log('=== Summary ===');
    console.log(`Total: ${report.totalTests}  Passed: ${report.passed}  Failed: ${report.failed}`);
    if (report.failed === 0) {
        console.log('Result: ALL TESTS PASSED');
    }
    else {
        console.log('Result: SOME TESTS FAILED');
        process.exitCode = 1;
    }
}
main().catch((err) => {
    console.error('Test runner crashed:', err);
    process.exitCode = 1;
});
