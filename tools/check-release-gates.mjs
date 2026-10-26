import {readFileSync} from 'node:fs';
const ledger=JSON.parse(readFileSync(new URL('../docs/production/release-gates.json',import.meta.url),'utf8'));
const blocked=Object.entries(ledger.gates).filter(([,gate])=>gate.status!=='PASS');
if(blocked.length){console.error('Commercial release is blocked:');for(const [name,gate] of blocked)console.error(`${name}: ${gate.status} — ${gate.evidence}`);process.exitCode=1;}
else console.log('All recorded release gates pass. Verify owner approval and current evidence before release.');
