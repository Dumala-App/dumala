import { spawnSync } from 'node:child_process';

const [, , ...rawArgs] = process.argv;
const message = rawArgs.join(' ').trim();

if (!message) {
  console.error('Usage: npm run ship -- "Commit message"');
  process.exit(1);
}

const isWindows = process.platform === 'win32';

const spawnCommand = (command, args) => {
  if (isWindows && (command === 'npm' || command === 'npx')) {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', command, ...args]
    };
  }

  return { command, args };
};

const run = (command, args = [], options = {}) => {
  console.log(`\n> ${[command, ...args].join(' ')}`);
  const child = spawnCommand(command, args);
  const result = spawnSync(child.command, child.args, {
    stdio: 'inherit',
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const capture = (command, args = []) => {
  const child = spawnCommand(command, args);
  const result = spawnSync(child.command, child.args, { encoding: 'utf8' });

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
};

const hasChanges = () => capture('git', ['status', '--porcelain']).length > 0;

const slugify = value => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 44) || 'changes';

const branchExists = branch => {
  const local = spawnSync('git', ['rev-parse', '--verify', '--quiet', branch]);
  if (local.status === 0) return true;

  const remote = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch]);
  return remote.status === 0;
};

const getCurrentBranch = () => capture('git', ['branch', '--show-current']);

run('gh', ['auth', 'status', '-h', 'github.com']);

if (!hasChanges()) {
  console.log('No local changes to ship.');
  process.exit(0);
}

let branch = getCurrentBranch();

if (branch === 'main' || branch === 'master') {
  const base = `codex/${slugify(message)}`;
  branch = base;
  let suffix = 2;

  while (branchExists(branch)) {
    branch = `${base}-${suffix}`;
    suffix += 1;
  }

  run('git', ['switch', '-c', branch]);
} else if (!branch) {
  console.error('Could not determine the current git branch.');
  process.exit(1);
}

run('npm', ['run', 'verify:quality']);
run('git', ['add', '-A']);

const stagedDiff = spawnSync('git', ['diff', '--cached', '--quiet']);
if (stagedDiff.status === 0) {
  console.log('No staged changes after verification.');
  process.exit(0);
}

run('git', ['commit', '-m', message]);
run('git', ['push', '-u', 'origin', branch]);

let prNumber = capture('gh', ['pr', 'view', '--json', 'number', '--jq', '.number']);

if (!prNumber) {
  const prUrl = capture('gh', [
    'pr',
    'create',
    '--base',
    'main',
    '--head',
    branch,
    '--title',
    message,
    '--body',
    `## Verification\n- npm run verify:quality`
  ]);

  console.log(prUrl);
  prNumber = capture('gh', ['pr', 'view', '--json', 'number', '--jq', '.number']);
}

if (!prNumber) {
  console.error('Could not determine the pull request number.');
  process.exit(1);
}

run('gh', ['pr', 'checks', prNumber, '--watch', '--fail-fast']);
run('gh', ['pr', 'merge', prNumber, '--merge', '--delete-branch']);

run('git', ['switch', 'main']);
run('git', ['pull', '--ff-only', 'origin', 'main']);

if (branch !== 'main' && branch !== 'master') {
  run('git', ['branch', '-D', branch]);
}

console.log(`\nShipped ${message}`);
