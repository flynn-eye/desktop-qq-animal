const fs = require('fs');
const d = require('./swf-assets.json');
const entries = [];

for (const gender of ['GG', 'MM']) {
  const gd = d[gender];
  if (!gd) continue;
  for (const stage of ['Adult', 'Kid', 'Egg']) {
    const sd = gd[stage];
    if (!sd) continue;
    for (const [key, val] of Object.entries(sd)) {
      if (val && val.path) {
        entries.push(`  "${gender}_${stage}_${key}": "${val.path}"`);
      }
    }
  }
}

const code = `// Auto-generated from swf-assets.json - DO NOT EDIT
export const SWF_PATHS: Record<string, string> = {
${entries.join(',\n')}
}
`;

fs.writeFileSync('src/renderer/config/swf-paths.ts', code);
console.log('Generated', entries.length, 'entries');
