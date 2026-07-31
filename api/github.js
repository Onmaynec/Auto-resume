const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 20;
const USERNAME_RE = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

const responseCache = globalThis.__autoResumeV2Cache || new Map();
const requestWindows = globalThis.__autoResumeV2RequestWindows || new Map();
globalThis.__autoResumeV2Cache = responseCache;
globalThis.__autoResumeV2RequestWindows = requestWindows;

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED', error: 'Используйте GET-запрос.' });
  }

  const username = String(req.query.username || '').replace(/^@/, '').trim();
  if (!USERNAME_RE.test(username)) return sendJson(res, 400, { code: 'INVALID_USERNAME', error: 'Некорректный GitHub username.' });

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return sendJson(res, 503, { code: 'PROXY_NOT_CONFIGURED', error: 'На сервере не задан GITHUB_TOKEN.' });

  const rateState = consumeRequest(getClientId(req));
  res.setHeader('X-Auto-Resume-Limit', String(REQUEST_LIMIT));
  res.setHeader('X-Auto-Resume-Remaining', String(rateState.remaining));
  if (!rateState.allowed) {
    return sendJson(res, 429, {
      code: 'TOO_MANY_REQUESTS',
      error: 'Слишком много запросов. Повторите попытку позже.',
      resetAt: new Date(rateState.resetAt).toISOString(),
    });
  }

  const cacheKey = username.toLowerCase();
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader('X-Auto-Resume-Cache', 'HIT');
    return sendJson(res, 200, cached.data);
  }

  try {
    const data = await fetchGitHubProfile(username, token);
    responseCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    pruneMaps();
    res.setHeader('X-Auto-Resume-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
    return sendJson(res, 200, data);
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') return sendJson(res, 404, { code: error.code, error: 'Пользователь не найден. Проверьте username.' });
    if (error.code === 'GITHUB_RATE_LIMIT') return sendJson(res, 429, { code: error.code, error: 'Лимит GitHub API исчерпан.', resetAt: error.resetAt || null });
    console.error('Auto Resume API error:', error);
    return sendJson(res, 502, { code: 'GITHUB_UPSTREAM_ERROR', error: 'GitHub временно не отвечает. Попробуйте ещё раз позже.' });
  }
};

async function fetchGitHubProfile(username, token) {
  const months = buildMonthRanges(new Date());
  const query = buildQuery(months.length);
  const annualFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const variables = { login: username, from: annualFrom, to: new Date().toISOString() };
  months.forEach((month, index) => {
    variables[`m${index}From`] = month.from;
    variables[`m${index}To`] = month.to;
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Onmaynec-Auto-Resume-v2',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(`GitHub GraphQL HTTP ${response.status}`);
      if (response.status === 403 || response.status === 429) {
        error.code = 'GITHUB_RATE_LIMIT';
        error.resetAt = response.headers.get('x-ratelimit-reset')
          ? new Date(Number(response.headers.get('x-ratelimit-reset')) * 1000).toISOString()
          : null;
      }
      throw error;
    }
    if (payload.errors?.length) {
      const message = payload.errors.map((item) => item.message).join(' ');
      const error = new Error(message);
      if (/could not resolve to a User/i.test(message)) error.code = 'USER_NOT_FOUND';
      if (/rate limit/i.test(message)) {
        error.code = 'GITHUB_RATE_LIMIT';
        error.resetAt = payload.data?.rateLimit?.resetAt || null;
      }
      throw error;
    }

    const user = payload.data?.user;
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const calendar = user.contributionsCollection.contributionCalendar.weeks
      .flatMap((week) => week.contributionDays)
      .map((day) => ({ date: day.date, count: day.contributionCount, level: day.contributionLevel, weekday: day.weekday }));

    const repos = user.repositories.nodes.map(normalizeRepository);
    const languageHistory = months.map((month, index) => normalizeLanguageMonth(month, user[`month${index}`]));

    return {
      version: 2,
      generatedAt: new Date().toISOString(),
      source: 'github-graphql',
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        html_url: user.url,
        followers: user.followers.totalCount,
        public_repos: user.publicRepositories.totalCount,
      },
      repos,
      contributions: {
        total: user.contributionsCollection.contributionCalendar.totalContributions,
        commits: user.contributionsCollection.totalCommitContributions,
        restricted: user.contributionsCollection.restrictedContributionsCount,
        calendar,
      },
      languageHistory,
      rateLimit: payload.data.rateLimit,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildQuery(monthCount) {
  const monthVariables = Array.from({ length: monthCount }, (_, index) => `$m${index}From: DateTime!, $m${index}To: DateTime!`).join(', ');
  const monthFields = Array.from({ length: monthCount }, (_, index) => `
      month${index}: contributionsCollection(from: $m${index}From, to: $m${index}To) {
        commitContributionsByRepository(maxRepositories: 20) {
          repository { nameWithOwner primaryLanguage { name color } }
          contributions(first: 100) { nodes { commitCount } }
        }
      }`).join('\n');

  return `
    query AutoResumeV2($login: String!, $from: DateTime!, $to: DateTime!, ${monthVariables}) {
      rateLimit { limit cost remaining resetAt }
      user(login: $login) {
        login name avatarUrl bio location url
        followers { totalCount }
        publicRepositories: repositories(privacy: PUBLIC) { totalCount }
        repositories(first: 100, privacy: PUBLIC, isFork: false, orderBy: { field: UPDATED_AT, direction: DESC }) {
          nodes {
            name nameWithOwner description url homepageUrl stargazerCount forkCount pushedAt updatedAt isArchived
            primaryLanguage { name color }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
            repositoryTopics(first: 8) { nodes { topic { name } } }
          }
        }
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount contributionLevel weekday } }
          }
        }
        ${monthFields}
      }
    }
  `;
}

function buildMonthRanges(now) {
  const result = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
    const to = new Date(next.getTime() - 1000);
    result.push({
      key: from.toISOString().slice(0, 7),
      label: from.toLocaleDateString('ru-RU', { month: 'short', timeZone: 'UTC' }),
      from: from.toISOString(),
      to: to.toISOString(),
    });
  }
  return result;
}

function normalizeRepository(repo) {
  return {
    name: repo.name,
    full_name: repo.nameWithOwner,
    description: repo.description,
    html_url: repo.url,
    homepage: repo.homepageUrl,
    stargazers_count: repo.stargazerCount,
    forks_count: repo.forkCount,
    pushed_at: repo.pushedAt,
    updated_at: repo.updatedAt,
    language: repo.primaryLanguage?.name || null,
    language_color: repo.primaryLanguage?.color || null,
    languages: Object.fromEntries(repo.languages.edges.map((edge) => [edge.node.name, edge.size])),
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    archived: repo.isArchived,
    fork: false,
  };
}

function normalizeLanguageMonth(month, collection) {
  const languages = {};
  let total = 0;
  for (const contribution of collection?.commitContributionsByRepository || []) {
    const count = (contribution.contributions?.nodes || []).reduce((sum, item) => sum + Number(item.commitCount || 0), 0);
    const language = contribution.repository?.primaryLanguage;
    const name = language?.name || 'Other';
    if (!languages[name]) languages[name] = { count: 0, color: language?.color || null };
    languages[name].count += count;
    total += count;
  }
  return { key: month.key, label: month.label, total, languages };
}

function consumeRequest(clientId) {
  const now = Date.now();
  const current = requestWindows.get(clientId);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + REQUEST_WINDOW_MS };
    requestWindows.set(clientId, next);
    return { allowed: true, remaining: REQUEST_LIMIT - 1, resetAt: next.resetAt };
  }
  current.count += 1;
  requestWindows.set(clientId, current);
  return { allowed: current.count <= REQUEST_LIMIT, remaining: Math.max(0, REQUEST_LIMIT - current.count), resetAt: current.resetAt };
}

function getClientId(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function pruneMaps() {
  const now = Date.now();
  if (responseCache.size > 250) for (const [key, value] of responseCache) if (value.expiresAt <= now) responseCache.delete(key);
  if (requestWindows.size > 500) for (const [key, value] of requestWindows) if (value.resetAt <= now) requestWindows.delete(key);
}

function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

function sendJson(res, status, body) {
  return res.status(status).end(JSON.stringify(body));
}

module.exports._private = { buildMonthRanges, buildQuery, normalizeLanguageMonth, normalizeRepository };
