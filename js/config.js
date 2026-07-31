export const REST_API = 'https://api.github.com';
export const PROXY_ENDPOINT = '/api/github';
export const CACHE_TTL = 15 * 60 * 1000;
export const USERNAME_RE = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export const state = {
  user: null,
  repos: [],
  contributions: { total: 0, commits: 0, restricted: 0, calendar: [] },
  languages: {},
  monthly: {},
  charts: {},
  source: '',
  rateLimit: null,
};

export const $ = (selector) => document.querySelector(selector);

export const els = {
  form: $('#searchForm'),
  username: $('#username'),
  status: $('#status'),
  dashboard: $('#dashboard'),
  profile: $('#profileCard'),
  metrics: $('#metrics'),
  tipsCard: $('#tipsCard'),
  tips: $('#tips'),
  heatmap: $('#heatmap'),
  repos: $('#repos'),
  repoCount: $('#repoCount'),
  commitCount: $('#commitCount'),
  generate: $('#generateBtn'),
  resumeSection: $('#resumeSection'),
};
