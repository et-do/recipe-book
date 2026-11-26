// Fails if scratch content would be committed. Scratch content is anything
// under content/ whose file or folder name starts with `tmp-` or `zz-tmp`:
// throwaway pages for trying out the site locally, never published.
//
//   node scripts/check-scratch-content.mjs           all tracked files (CI)
//   node scripts/check-scratch-content.mjs --staged  staged files (pre-commit)

import { execFileSync } from 'node:child_process';

const staged = process.argv.includes('--staged');
const args = staged
  ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
  : ['ls-files', '-z'];

const files = execFileSync('git', args, { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const scratch = files.filter(
  (file) =>
    file.startsWith('content/') &&
    file.split('/').some((part) => /^(tmp-|zz-tmp)/.test(part)),
);

if (scratch.length > 0) {
  console.error(
    `Scratch content (tmp-* / zz-tmp*) must not be committed:\n` +
      scratch.map((file) => `  ${file}`).join('\n') +
      (staged ? `\nUnstage it with: git restore --staged <file>` : ''),
  );
  process.exit(1);
}
