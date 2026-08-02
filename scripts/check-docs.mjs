import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_FILES = [
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/pull_request_template.md',
];

export const GOVERNANCE_MARKDOWN = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  '.github/pull_request_template.md',
];

const SECRET_TERMS = [
  'access token',
  'oauth cookie',
  'client secret',
  'redis credential',
  'private repository data',
  'confidential resume',
];

function fail(message) {
  throw new Error(`DOCS_CHECK: ${message}`);
}

function read(root, path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function checkMarkdownStructure(path, source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && /[ \t]+$/.test(line)) fail(`${path}:${index + 1} has trailing whitespace`);
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+\S/);
    if (match) headings.push({ level: match[1].length, line: index + 1 });
  }

  if (!headings.length || headings[0].level !== 1) fail(`${path} must start with an H1`);
  if (headings.filter(({ level }) => level === 1).length !== 1) fail(`${path} must contain exactly one H1`);

  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) {
      fail(`${path}:${headings[index].line} skips a heading level`);
    }
  }
}

function normalizeLinkTarget(raw) {
  const target = raw.trim().replace(/^<|>$/g, '');
  const titleIndex = target.search(/\s+["']/);
  return titleIndex === -1 ? target : target.slice(0, titleIndex);
}

function checkLocalLinks(root, path, source) {
  const links = source.matchAll(/\[[^\]]*]\(([^)]+)\)/g);
  for (const match of links) {
    const target = normalizeLinkTarget(match[1]);
    if (!target || target.startsWith('#') || /^(?:https?:|mailto:)/i.test(target)) continue;
    const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
    if (!clean) continue;
    const destination = resolve(dirname(resolve(root, path)), clean);
    if (!destination.startsWith(resolve(root))) fail(`${path} links outside the repository: ${target}`);
    if (!existsSync(destination)) fail(`${path} contains a broken local link: ${target}`);
  }
}

function checkIssueForms(root) {
  const config = read(root, '.github/ISSUE_TEMPLATE/config.yml');
  if (!/blank_issues_enabled:\s*false/.test(config)) fail('blank Issues must be disabled');
  if (!/security\/advisories\/new/.test(config)) fail('Issue config must include private vulnerability reporting');

  for (const path of ['.github/ISSUE_TEMPLATE/bug_report.yml', '.github/ISSUE_TEMPLATE/feature_request.yml']) {
    const form = read(root, path);
    for (const key of ['name:', 'description:', 'body:', 'validations:', 'required: true']) {
      if (!form.includes(key)) fail(`${path} is missing ${key}`);
    }
    const normalized = form.toLowerCase();
    for (const term of SECRET_TERMS) {
      if (!normalized.includes(term)) fail(`${path} must warn about ${term}`);
    }
    if (!/security advisories|security vulnerability/i.test(form)) {
      fail(`${path} must redirect security reports to a private channel`);
    }
    if (/paste (?:your )?(?:token|cookie|secret)|cookie value|token value/i.test(form)) {
      fail(`${path} must never request credential values`);
    }
  }
}

function checkPolicyContracts(root) {
  const contributing = read(root, 'CONTRIBUTING.md');
  for (const required of [
    'npm run verify',
    'npm run docs:check',
    'branch → pull request → CI → main',
    'Conventional Commit',
    'HttpOnly',
    'CSRF',
    'Localization',
    'APP_SHELL',
  ]) {
    if (!contributing.includes(required)) fail(`CONTRIBUTING.md is missing ${required}`);
  }

  const security = read(root, 'SECURITY.md');
  if (!/security\/advisories\/new/.test(security)) fail('SECURITY.md must use private vulnerability reporting');
  if (!/3\.x/.test(security) || !/2\.x and earlier/.test(security)) fail('SECURITY.md must define supported versions');

  const pullRequest = read(root, '.github/pull_request_template.md').toLowerCase();
  for (const term of ['npm run verify', 'localization', 'privacy', 'accessibility', 'compatible', 'screenshots', 'app_shell']) {
    if (!pullRequest.includes(term)) fail(`pull request template is missing ${term}`);
  }
}

export function runDocumentationChecks(root = resolve(fileURLToPath(new URL('../', import.meta.url)))) {
  for (const path of REQUIRED_FILES) {
    if (!existsSync(resolve(root, path))) fail(`missing required file ${path}`);
  }

  for (const path of GOVERNANCE_MARKDOWN) {
    const source = read(root, path);
    checkMarkdownStructure(path, source);
    checkLocalLinks(root, path, source);
  }

  checkIssueForms(root);
  checkPolicyContracts(root);
  return { checkedFiles: REQUIRED_FILES.length + GOVERNANCE_MARKDOWN.length };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = runDocumentationChecks();
  console.log(`Documentation checks passed (${result.checkedFiles} contracts).`);
}
