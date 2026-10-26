import {readFileSync} from 'node:fs';
function read(path){try{return JSON.parse(readFileSync(path,'utf8'));}catch{return null;}}
const unit=read('docs/production/unit-results.json'),browser=read('docs/production/e2e-results.json');
console.log('# Verification evidence\n');
console.log('| Suite | Passed | Failed | Skipped |\n| --- | ---: | ---: | ---: |');
console.log(unit?`| Unit/property/auth | ${unit.numPassedTests} | ${unit.numFailedTests} | ${unit.numPendingTests} |`:'| Unit/property/auth | report unavailable | — | — |');
console.log(browser?`| Chromium browser flows | ${browser.stats.expected} | ${browser.stats.unexpected} | ${browser.stats.skipped} |`:'| Chromium browser flows | report unavailable | — | — |');
console.log('\nThe lint, typecheck, test, dependency audit, build and browser steps retain their normal failure behavior. A report is not a commercial release approval.');
console.log(process.env.UPLOAD_VERIFICATION_ARTIFACTS==='true'?'\nDebug archive upload is enabled. Its separate step must succeed.':'\nDebug archive upload is disabled. GitHub rejected the prior archive because the account artifact-storage quota was full. These results remain visible in this summary and the run logs. Repository screenshots and local evidence are retained. Set repository variable `UPLOAD_VERIFICATION_ARTIFACTS=true` only after resolving the quota; uploads then retain data for one day. No archive deletion or paid storage was enabled.');
