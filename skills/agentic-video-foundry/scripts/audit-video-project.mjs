#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {basename, extname, join, relative, resolve} from 'node:path';

const argv = process.argv.slice(2);
const valueOf = (flag) => {
  const equal = argv.find((entry) => entry.startsWith(`${flag}=`));
  if (equal) return equal.slice(flag.length + 1);
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};

const project = resolve(valueOf('--project') ?? process.cwd());
const videoArg = valueOf('--video');
const video = videoArg ? resolve(videoArg) : undefined;
const strict = argv.includes('--strict');
const findings = [];
const add = (level, message) => findings.push({level, message});

if (!existsSync(project) || !statSync(project).isDirectory()) {
  console.error(`Project directory not found: ${project}`);
  process.exit(2);
}

const ignored = new Set(['node_modules', '.git', 'out', 'dist', 'build']);
const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.scss', '.mjs', '.cjs', '.yml', '.yaml', '.log', '.txt']);
const isTextFile = (path) => {
  const name = basename(path);
  return textExtensions.has(extname(name)) || name === '.env' || name.startsWith('.env.');
};
const walk = (directory, output = []) => {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, output);
    else if (isTextFile(path)) output.push(path);
  }
  return output;
};

const files = walk(project);
const secretPattern = /(?:sk_[A-Za-z0-9_-]{20,}|ark-[A-Za-z0-9-]{20,}|(?:xi-api-key|x-api-key)\s*[:=]\s*["'][^"']{12,})/gi;
const nondeterministicPattern = /\b(?:Date\.now|setTimeout|setInterval|Math\.random)\s*\(|\banimation\s*:/g;
for (const path of files) {
  const text = readFileSync(path, 'utf8');
  if (secretPattern.test(text)) add('FAIL', `Possible embedded secret: ${relative(project, path)}`);
  secretPattern.lastIndex = 0;
  if (/\.(?:jsx?|tsx?|css|scss|mjs|cjs)$/.test(path) && nondeterministicPattern.test(text)) {
    add('WARN', `Review nondeterministic animation/runtime pattern: ${relative(project, path)}`);
  }
  nondeterministicPattern.lastIndex = 0;
}

for (const expected of ['package.json', 'src']) {
  if (!existsSync(join(project, expected))) add(strict ? 'FAIL' : 'WARN', `Expected project artifact is missing: ${expected}`);
}

const manifestCandidates = [
  join(project, 'src/data/audio-manifest.json'),
  join(project, 'audio-manifest.json'),
];
const manifestPath = manifestCandidates.find(existsSync);
if (manifestPath) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const records = [];
    const collect = (value) => {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') {
        if (typeof value.path === 'string' && typeof value.sha256 === 'string') records.push(value);
        Object.values(value).forEach(collect);
      }
    };
    collect(manifest);
    for (const record of records) {
      const path = resolve(project, record.path);
      if (!existsSync(path)) add('FAIL', `Manifest asset missing: ${record.path}`);
      else {
        const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
        if (hash !== record.sha256) add('FAIL', `Manifest hash mismatch: ${record.path}`);
      }
    }
    if (!records.length) add(strict ? 'FAIL' : 'WARN', `No hashed assets found in ${relative(project, manifestPath)}`);
  } catch (error) {
    add('FAIL', `Cannot validate audio manifest: ${error.message}`);
  }
} else add(strict ? 'FAIL' : 'WARN', 'No secret-free audio manifest found');

if (video) {
  if (!existsSync(video)) add('FAIL', `Final video not found: ${video}`);
  else {
    try {
      const ffprobe = [
        process.env.FFPROBE_PATH,
        '/opt/homebrew/bin/ffprobe',
        '/usr/local/Homebrew/opt/ffmpeg/bin/ffprobe',
        '/usr/local/bin/ffprobe',
        'ffprobe',
      ].find((candidate) => candidate === 'ffprobe' || (candidate && existsSync(candidate)));
      const probe = execFileSync(ffprobe, [
        '-v', 'error', '-show_entries',
        'format=duration,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels',
        '-of', 'json', video,
      ], {encoding: 'utf8'});
      console.log(`VIDEO_PROBE ${probe.trim()}`);
    } catch (error) {
      add('FAIL', `Final video could not be probed: ${error.message.split('\n')[0]}`);
    }
  }
}

for (const finding of findings) console.log(`${finding.level} ${finding.message}`);
const failures = findings.filter(({level}) => level === 'FAIL').length;
const warnings = findings.filter(({level}) => level === 'WARN').length;
console.log(`SUMMARY files=${files.length} failures=${failures} warnings=${warnings}`);
process.exitCode = failures ? 1 : 0;
