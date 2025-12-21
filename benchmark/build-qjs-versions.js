#!/usr/bin/env node

// Build QuickJS for each date that has commits since 2025-04-26
// Output binaries named qjs-yyyy-mm-dd

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT_DIR = __dirname;
const QJS_DIR = path.join(SCRIPT_DIR, 'quickjs');
// Output binaries to platform-specific subdirectory (e.g., bin/linux-x64, bin/darwin-arm64)
const PLATFORM_DIR = `${os.platform()}-${os.arch()}`;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'bin', PLATFORM_DIR);
const SCRIPT_START = Date.now(); // Track total script duration

/** Run a git command in the QuickJS repo and return trimmed stdout. */
function logCommand(cmd, cwd) {
  if (cwd) {
    console.log(`$ (cd ${cwd} && ${cmd})`);
  } else {
    console.log(`$ ${cmd}`);
  }
}

/** Run a git command in the QuickJS repo and return trimmed stdout. */
function runGit(cmd) {
  logCommand(cmd, QJS_DIR);
  return execSync(cmd, {
    cwd: QJS_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

/** Ensure QuickJS repo exists (clone if missing, pull if present). */
function ensureQuickjsRepo() {
  if (!fs.existsSync(QJS_DIR)) {
    console.log(`QuickJS directory not found at: ${QJS_DIR}`);
    console.log('Cloning QuickJS repository...');
    logCommand('git clone https://github.com/bellard/quickjs.git quickjs', SCRIPT_DIR);
    try {
      execSync('git clone https://github.com/bellard/quickjs.git quickjs', {
        cwd: SCRIPT_DIR,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error('Failed to clone QuickJS repository.');
      console.error(err.message);
      process.exit(1);
    }
  } else {
    const gitDir = path.join(QJS_DIR, '.git');
    if (!fs.existsSync(gitDir)) {
      console.error(`Existing quickjs directory at ${QJS_DIR} is not a git repository.`);
      process.exit(1);
    }

    console.log('Updating existing QuickJS repository (checkout master/main then pull)...');
    try {
      // Always move back to a branch (master preferred, then main) so we can pull cleanly
      let checkoutSucceeded = false;

      try {
        logCommand('git checkout master', QJS_DIR);
        execSync('git checkout master', {
          cwd: QJS_DIR,
          stdio: 'inherit',
        });
        checkoutSucceeded = true;
      } catch {
        console.log('Failed to checkout master, trying main...');
        try {
          logCommand('git checkout main', QJS_DIR);
          execSync('git checkout main', {
            cwd: QJS_DIR,
            stdio: 'inherit',
          });
          checkoutSucceeded = true;
        } catch {
          // leave checkoutSucceeded as false
        }
      }

      if (!checkoutSucceeded) {
        console.error('Failed to checkout master or main in QuickJS repository.');
        process.exit(1);
      }

      logCommand('git pull --rebase', QJS_DIR);
      execSync('git pull --rebase', {
        cwd: QJS_DIR,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error('Failed to update QuickJS repository. Please resolve issues and try again.');
      console.error(err.message);
      process.exit(1);
    }
  }
}

/** Ensure the working tree is clean before we start switching commits. */
function ensureCleanWorkingTree() {
  try {
    logCommand('git diff --quiet', QJS_DIR);
    execSync('git diff --quiet', { cwd: QJS_DIR, stdio: 'ignore' });
    logCommand('git diff --cached --quiet', QJS_DIR);
    execSync('git diff --cached --quiet', { cwd: QJS_DIR, stdio: 'ignore' });
  } catch {
    console.error(`Working tree is not clean in ${QJS_DIR}. Please commit or stash changes first.`);
    process.exit(1);
  }
}

function main() {
  ensureQuickjsRepo();
  ensureCleanWorkingTree();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Remember original ref so we can restore it later
  let originalRef;
  try {
    originalRef = runGit('git rev-parse --abbrev-ref HEAD');
  } catch {
    originalRef = runGit('git rev-parse HEAD');
  }

  try {
    const logOutput = runGit('git log --format="%H %ad" --date=short --since="2025-04-26"');

    if (!logOutput) {
      console.log('No commits found since 2025-04-26');
      return;
    }

    const lines = logOutput.split('\n').map((l) => l.trim()).filter(Boolean);

    /** @type {Map<string, string>} date -> commit hash */
    const dateToCommit = new Map();

    // git log is newest-first; first time we see a date is the last commit of that date
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const hash = parts[0];
      const date = parts[1];
      if (!dateToCommit.has(date)) {
        dateToCommit.set(date, hash);
      }
    }

    const entries = Array.from(dateToCommit.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    const total = entries.length;
    console.log(`Found ${total} dates with commits`);

    const cpuCount = Math.max(1, os.cpus().length || 1);

    for (const [date, commit] of entries) {
      const outputFile = path.join(OUTPUT_DIR, `qjs-${date}`);

      if (fs.existsSync(outputFile)) {
        console.log(`Skipping ${date} - already exists`);
        continue;
      }

      console.log('==========================================');
      console.log(`Building for date: ${date}`);
      console.log(`Commit: ${commit}`);
      console.log('==========================================');

      // Checkout target commit
      try {
        logCommand(`git checkout ${commit} --quiet`, QJS_DIR);
        execSync(`git checkout ${commit} --quiet`, {
          cwd: QJS_DIR,
          stdio: 'inherit',
        });
      } catch (err) {
        console.error(`Failed to checkout commit ${commit} for ${date}`);
        console.error(err.message);
        continue;
      }

      // Clean previous build (ignore errors)
      try {
        execSync('make clean', {
          cwd: QJS_DIR,
          stdio: ['ignore', 'ignore', 'ignore'],
        });
      } catch {
        // ignore
      }

      console.log('Building...');
      const buildStart = Date.now();
      try {
        logCommand(`make -j${cpuCount} qjs`, QJS_DIR);
        execSync(`make -j${cpuCount} qjs`, {
          cwd: QJS_DIR,
          stdio: 'inherit',
        });

        const qjsBinary = path.join(QJS_DIR, 'qjs');
        if (fs.existsSync(qjsBinary)) {
          fs.copyFileSync(qjsBinary, outputFile);
          console.log(`Created: ${outputFile}`);
        } else {
          console.log(`Build succeeded but qjs binary not found for ${date}`);
        }
        const elapsed = ((Date.now() - buildStart) / 1000).toFixed(2);
        console.log(`Build for ${date} finished in ${elapsed}s`);
      } catch (err) {
        const elapsed = ((Date.now() - buildStart) / 1000).toFixed(2);
        console.error(`Build failed for ${date} after ${elapsed}s`);
        console.error(err.message);
      }
    }
  } finally {
    // Restore original ref
    try {
      logCommand(`git checkout ${originalRef} --quiet`, QJS_DIR);
      execSync(`git checkout ${originalRef} --quiet`, {
        cwd: QJS_DIR,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error('Failed to restore original git ref:');
      console.error(err.message);
    }

    console.log('');
    console.log('==========================================');
    console.log('Build complete!');
    const totalElapsed = ((Date.now() - SCRIPT_START) / 1000).toFixed(2);
    console.log(`Total elapsed time: ${totalElapsed}s`);
    console.log(`Platform: ${PLATFORM_DIR}`);
    console.log('Built binaries:');

    try {
      // List binaries for current platform
      if (fs.existsSync(OUTPUT_DIR)) {
        const files = fs
          .readdirSync(OUTPUT_DIR)
          .filter((name) => name.startsWith('qjs-'));

        if (files.length === 0) {
          console.log('No binaries built for this platform');
        } else {
          for (const name of files) {
            const fullPath = path.join(OUTPUT_DIR, name);
            const stat = fs.statSync(fullPath);
            console.log(
              `${stat.mode.toString(8)} ${stat.size.toString().padStart(8, ' ')} ${fullPath}`
            );
          }
        }
      } else {
        console.log('No binaries built for this platform');
      }

      // Show summary of all platforms
      const binDir = path.join(SCRIPT_DIR, 'bin');
      if (fs.existsSync(binDir)) {
        const platforms = fs.readdirSync(binDir).filter((name) => {
          const platformPath = path.join(binDir, name);
          return fs.statSync(platformPath).isDirectory();
        });

        if (platforms.length > 1) {
          console.log('');
          console.log('All available platforms:');
          for (const platform of platforms) {
            const platformPath = path.join(binDir, platform);
            const count = fs.readdirSync(platformPath).filter((n) => n.startsWith('qjs-')).length;
            console.log(`  ${platform}: ${count} binaries`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to list built binaries:');
      console.error(err.message);
    }
  }
}

main();


