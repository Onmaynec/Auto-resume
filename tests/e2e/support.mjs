export const guestAuthState = {
  configured: false,
  authenticated: false,
  user: null,
  scopes: [],
  capabilities: {},
};

export function authenticatedState(login = 'octocat') {
  return {
    configured: true,
    authenticated: true,
    user: {
      id: 1,
      login,
      name: 'Octo Cat',
      avatarUrl: '/icons/app-icon.svg',
    },
    scopes: ['read:user'],
    capabilities: {
      privateContributions: true,
      privateRepositoryCode: false,
    },
    expiresAt: '2026-08-02T12:00:00.000Z',
  };
}

function monthKey(offset) {
  const date = new Date(Date.UTC(2026, 7 + offset, 1));
  return date.toISOString().slice(0, 7);
}

export function profileFixture(login = 'octocat', { authenticated = false } = {}) {
  const calendar = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 6, 5 + index));
    const count = (index * 3) % 11;
    return {
      date: date.toISOString().slice(0, 10),
      count,
      level: count > 8 ? 'FOURTH_QUARTILE' : count > 5 ? 'THIRD_QUARTILE' : count > 2 ? 'SECOND_QUARTILE' : count ? 'FIRST_QUARTILE' : 'NONE',
    };
  });

  return {
    version: 3,
    generatedAt: '2026-08-01T12:00:00.000Z',
    source: 'github-graphql',
    auth: {
      authenticated,
      self: authenticated,
      privateContributionsIncluded: authenticated,
      privateRepositoryCode: false,
    },
    user: {
      login,
      name: login === 'hubot' ? 'Hubot' : 'Octo Cat',
      avatar_url: '/icons/app-icon.svg',
      html_url: `https://github.com/${login}`,
      bio: 'Full-stack developer building accessible web applications and developer tooling.',
      location: 'Internet',
      followers: login === 'hubot' ? 74 : 128,
      following: 12,
      public_repos: 3,
      blog: 'https://example.com',
      created_at: '2011-01-25T18:44:36Z',
    },
    repos: [
      {
        id: 101,
        name: 'resume-engine',
        full_name: `${login}/resume-engine`,
        html_url: `https://github.com/${login}/resume-engine`,
        description: 'Accessible resume builder with offline-first drafts and structured exports.',
        language: 'JavaScript',
        language_color: '#f1e05a',
        languages: { JavaScript: 32000, HTML: 8000, CSS: 5000 },
        topics: ['resume', 'pwa', 'accessibility'],
        stargazers_count: 42,
        forks_count: 7,
        fork: false,
        pushed_at: '2026-07-28T10:00:00Z',
      },
      {
        id: 102,
        name: 'api-observer',
        full_name: `${login}/api-observer`,
        html_url: `https://github.com/${login}/api-observer`,
        description: 'Privacy-safe serverless metrics and resilient cache tooling.',
        language: 'TypeScript',
        language_color: '#3178c6',
        languages: { TypeScript: 28000, JavaScript: 3000 },
        topics: ['serverless', 'observability'],
        stargazers_count: 28,
        forks_count: 4,
        fork: false,
        pushed_at: '2026-07-24T10:00:00Z',
      },
      {
        id: 103,
        name: 'design-system',
        full_name: `${login}/design-system`,
        html_url: `https://github.com/${login}/design-system`,
        description: 'Reusable components with keyboard navigation and WCAG-focused defaults.',
        language: 'CSS',
        language_color: '#663399',
        languages: { CSS: 14000, HTML: 6000, JavaScript: 4000 },
        topics: ['design-system', 'wcag'],
        stargazers_count: 19,
        forks_count: 2,
        fork: false,
        pushed_at: '2026-07-20T10:00:00Z',
      },
    ],
    contributions: {
      total: 312,
      commits: 184,
      restricted: authenticated ? 17 : 0,
      calendar,
    },
    languageHistory: [-2, -1, 0].map((offset, index) => ({
      key: monthKey(offset),
      label: monthKey(offset),
      total: 34 + index * 9,
      languages: {
        JavaScript: { count: 18 + index * 4, color: '#f1e05a' },
        TypeScript: { count: 10 + index * 3, color: '#3178c6' },
        CSS: { count: 6 + index * 2, color: '#663399' },
      },
    })),
    rateLimit: {
      limit: 5000,
      remaining: 4991,
      resetAt: '2026-08-01T13:00:00.000Z',
    },
  };
}

export async function installApiMocks(page, { authState = guestAuthState } = {}) {
  let currentAuth = JSON.parse(JSON.stringify(authState));

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/auth/session**', async (route) => {
    if (route.request().method() === 'DELETE') {
      currentAuth = {
        ...currentAuth,
        authenticated: false,
        user: null,
        scopes: [],
        capabilities: {},
      };
      await route.fulfill({ status: 200, json: { ok: true, revoked: false } });
      return;
    }
    await route.fulfill({ status: 200, json: currentAuth });
  });

  await page.route('**/api/github**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const username = requestUrl.searchParams.get('username') || 'octocat';
    await route.fulfill({
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
      json: profileFixture(username, {
        authenticated: Boolean(currentAuth.authenticated && currentAuth.user?.login?.toLowerCase() === username.toLowerCase()),
      }),
    });
  });

  return {
    getAuthState: () => JSON.parse(JSON.stringify(currentAuth)),
  };
}

export async function loadProfile(page, login = 'octocat') {
  await page.locator('#username').fill(login);
  await page.locator('#searchForm button[type="submit"]').click();
  await page.locator('#dashboard').waitFor({ state: 'visible' });
}
