import { CACHE_TTL, PROXY_ENDPOINT, REST_API, state, USERNAME_RE } from './config.js';
import { formatRateLimitMessage, startOfDay, toDateKey } from './utils.js';

class ProxyUnavailableError extends Error {}

export function normalizeUsername(rawUsername) {
  return rawUsername.replace(/^@/, '').trim();
}

export function isValidUsername(username) {
  return USERNAME_RE.test(username);
}

export async function getProfileData(username) {
  const cached = readCache(username);
  if (cached) return { data: cached, cached: true };

  let data;
  try {
    data = await loadFromProxy(username);
  } catch (error) {
    if (!(error instanceof ProxyUnavailableError)) throw error;
    data = await loadDirectFallback(username);
  }

  writeCache(username, data);
  return { data, cached: false };
}

export function applyData(data) {
  state.user = data.user;
  state.repos = Array.isArray(data.repos) ? data.repos.filter((repo) => !repo.fork) : [];
  state.contributions = {
    total: Number(data.contributions?.total || 0),
    commits: Number(data.contributions?.commits || 0),
    restricted: Number(data.contributions?.restricted || 0),
    calendar: normalizeCalendar(data.contributions?.calendar || []),
  };
  state.source = data.source || 'unknown';
  state.rateLimit = data.rateLimit || null;
  aggregateLanguages();
  buildMonthlyActivity();
}

async function loadFromProxy(username) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${PROXY_ENDPOINT}?username=${encodeURIComponent(username)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new ProxyUnavailableError('Serverless API недоступен.');

    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 404 && payload.code === 'USER_NOT_FOUND') {
        throw new Error('Пользователь не найден. Проверьте username.');
      }
      if (payload.code === 'PROXY_NOT_CONFIGURED' || response.status === 501 || response.status === 503) {
        throw new ProxyUnavailableError(payload.error || 'Serverless API не настроен.');
      }
      if (response.status === 429) throw new Error(formatRateLimitMessage(payload.resetAt));
      throw new Error(payload.error || `Ошибка API-прокси: ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      throw new ProxyUnavailableError('Serverless API недоступен.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadDirectFallback(username) {
  const [userResult, reposResult] = await Promise.all([
    directApi(`/users/${encodeURIComponent(username)}`),
    directApi(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`),
  ]);

  const repos = reposResult.data
    .filter((repo) => !repo.fork)
    .map((repo) => ({ ...repo, languages: repo.language ? { [repo.language]: 1 } : {} }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'github-rest-fallback',
    user: userResult.data,
    repos,
    contributions: { total: 0, commits: 0, restricted: 0, calendar: [] },
    rateLimit: reposResult.rateLimit || userResult.rateLimit,
  };
}

async function directApi(path) {
  const response = await fetch(`${REST_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const resetAt = Number(response.headers.get('x-ratelimit-reset')) * 1000;
  const rateLimit = {
    limit: Number(response.headers.get('x-ratelimit-limit')),
    remaining: Number(response.headers.get('x-ratelimit-remaining')),
    resetAt: Number.isFinite(resetAt) ? new Date(resetAt).toISOString() : null,
  };

  if (!response.ok) {
    if (response.status === 404) throw new Error('Пользователь не найден. Проверьте username.');
    if ((response.status === 403 || response.status === 429) && rateLimit.remaining === 0) {
      throw new Error(formatRateLimitMessage(rateLimit.resetAt));
    }
    throw new Error(`GitHub API вернул ошибку ${response.status}.`);
  }
  return { data: await response.json(), rateLimit };
}

function aggregateLanguages() {
  state.languages = {};
  state.repos.forEach((repo) => {
    const languages = repo.languages && Object.keys(repo.languages).length
      ? repo.languages
      : repo.language ? { [repo.language]: 1 } : {};
    repo.languages = languages;
    Object.entries(languages).forEach(([language, value]) => {
      state.languages[language] = (state.languages[language] || 0) + Number(value || 0);
    });
  });
}

function normalizeCalendar(calendar) {
  const byDate = new Map(calendar.map((day) => [day.date, {
    date: day.date,
    count: Number(day.count ?? day.contributionCount ?? 0),
    level: day.level || day.contributionLevel || 'NONE',
  }]));

  const result = [];
  const today = startOfDay(new Date());
  for (let offset = 364; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDateKey(date);
    result.push(byDate.get(key) || { date: key, count: 0, level: 'NONE' });
  }
  return result;
}

function buildMonthlyActivity() {
  const months = {};
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    months[date.toISOString().slice(0, 7)] = 0;
  }
  state.contributions.calendar.forEach((day) => {
    const key = day.date.slice(0, 7);
    if (key in months) months[key] += day.count;
  });
  state.monthly = months;
}

function readCache(username) {
  try {
    const key = `auto-resume:${username.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached.savedAt || Date.now() - cached.savedAt > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(username, data) {
  try {
    localStorage.setItem(
      `auto-resume:${username.toLowerCase()}`,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {
    // The app still works when localStorage is unavailable.
  }
}
