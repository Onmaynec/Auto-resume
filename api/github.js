const { readActiveSession } = require('./_session-state');
const { getGlobalStore } = require('./_store');
const {
  applyInfrastructureHeaders,
  consumeRateLimit,
  loadProfile,
  logInfrastructureMetric,
  makeCacheKey,
} = require('./_profile-gateway');

const USERNAME_RE = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const store = getGlobalStore();

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED', error: 'Используйте GET-запрос.' });
  }

  const username = String(req.query.username || '').replace(/^@/, '').trim();
  if (!USERNAME_RE.test(username)) return sendJson(res, 400, { code: 'INVALID_USERNAME', error: 'Некорректный GitHub username.' });

  const sessionState = await readActiveSession(req, process.env.SESSION_SECRET);
  const session = sessionState.session;
  const auth = resolveAuthContext(username, session, process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  if (!auth.token) return sendJson(res, 503, { code: 'PROXY_NOT_CONFIGURED', error: 'На сервере не задан GITHUB_TOKEN и отсутствует OAuth-сессия.' });

  const rateState = await consumeRateLimit({ store, req, session });
  applyInfrastructureHeaders(res, null, rateState);
  if (!rateState.allowed) {
    return sendJson(res, 429, {
      code: 'TOO_MANY_REQUESTS',
      error: 'Слишком много запросов. Повторите попытку позже.',
      resetAt: new Date(rateState.resetAt).toISOString(),
    });
  }

  const cacheKey = makeCacheKey({
    username,
    privateContributionsIncluded: auth.privateContributionsIncluded,
    session,
  });

  try {
    const result = await loadProfile({
      store,
      cacheKey,
      fetcher: () => fetchGitHubProfile(username, auth.token, auth),
      waitUntil: typeof req.waitUntil === 'function' ? req.waitUntil.bind(req) : null,
    });
    applyInfrastructureHeaders(res, result, rateState);
    setResponseCachePolicy(res, auth.privateContributionsIncluded);
    logInfrastructureMetric({
      cache: result.cache,
      store: result.store,
      upstreamDurationMs: result.upstreamDurationMs,
      status: 200,
    });
    return sendJson(res, 200, result.data);
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') return sendJson(res, 404, { code: error.code, error: 'Пользователь не найден. Проверьте username.' });
    if (error.code === 'GITHUB_RATE_LIMIT') return sendJson(res, 429, { code: error.code, error: 'Лимит GitHub API исчерпан.', resetAt: error.resetAt || null });
    console.error('Auto Resume API error:', error.code || error.name || 'unknown');
    return sendJson(res, 502, { code: 'GITHUB_UPSTREAM_ERROR', error: 'GitHub временно не отвечает. Попробуйте ещё раз позже.' });
  }
};

function resolveAuthContext(username, session, serverToken) {
  if (session?.token && session?.user?.login) {
    const self = session.user.login.toLowerCase() === String(username).toLowerCase();
    const scopes = Array.isArray(session.scopes) ? session.scopes : [];
    return {
      token: session.token,
      authenticated: true,
      self,
      login: session.user.login,
      scopes,
      privateContributionsIncluded: self && scopes.includes('read:user'),
      source: self ? 'github-graphql-oauth-self' : 'github-graphql-oauth-public',
    };
  }
  return {
    token: serverToken || '',
    authenticated: false,
    self: false,
    login: null,
    scopes: [],
    privateContributionsIncluded: false,
    source: 'github-graphql',
  };
}

async function fetchGitHubProfile(username, token, auth) {
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
        'User-Agent': 'Onmaynec-Auto-Resume-v3.2',
        'X-GitHub-Api-Version': process.env.GITHUB_API_VERSION || '2022-11-28',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(`GitHub GraphQL HTTP ${response.status}`);
      if (response.status === 401) error.code = 'OAUTH_SESSION_EXPIRED';
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
      version: 3,
      generatedAt: new Date().toISOString(),
      source: auth.source,
      auth: {
        authenticated: auth.authenticated,
        self: auth.self,
        login: auth.login,
        privateContributionsIncluded: auth.privateContributionsIncluded,
        privateRepositoryCode: false,
      },
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
    query AutoResumeV3($login: String!, $from: DateTime!, $to: DateTime!, ${monthVariables}) {
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

function setResponseCachePolicy(res, privateResponse) {
  res.setHeader('Cache-Control', privateResponse
    ? 'private, no-store, max-age=0'
    : 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
  if (privateResponse) res.setHeader('Vary', 'Cookie');
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

module.exports._private = { buildMonthRanges, buildQuery, normalizeLanguageMonth, normalizeRepository, resolveAuthContext, setResponseCachePolicy };
