const {
  clearSessionCookie,
  getOAuthConfig,
  publicSession,
  sameOriginRequest,
  sendJson,
} = require('../_auth');
const { denySession, readActiveSession } = require('../_session-state');

module.exports = async function handler(req, res) {
  const config = getOAuthConfig();
  if (req.method === 'GET') {
    if (!config.configured) return sendJson(res, 200, publicSession(null, false));
    const state = await readActiveSession(req, config.sessionSecret);
    if (state.denied) clearSessionCookie(req, res);
    return sendJson(res, 200, publicSession(state.session, true));
  }

  if (req.method === 'DELETE') {
    if (!sameOriginRequest(req)) return sendJson(res, 403, { code: 'CSRF_BLOCKED' });
    const state = config.configured
      ? await readActiveSession(req, config.sessionSecret)
      : { session: null, denied: false };
    const session = state.session;
    const mode = String(req.query?.revoke || 'none');
    let revoked = false;
    if (session?.token && ['token', 'grant'].includes(mode)) {
      revoked = await revokeGitHubAccess(session.token, mode, config).catch(() => false);
    }
    const invalidated = await denySession(session).catch(() => ({ value: false, backend: 'error' }));
    clearSessionCookie(req, res);
    return sendJson(res, 200, {
      ok: true,
      revoked,
      mode,
      sessionInvalidated: Boolean(invalidated.value),
      sessionStore: invalidated.backend,
    });
  }

  res.setHeader('Allow', 'GET, DELETE');
  return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED' });
};

async function revokeGitHubAccess(token, mode, config) {
  if (!config.clientId || !config.clientSecret) return false;
  const endpoint = mode === 'grant' ? 'grant' : 'token';
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/${endpoint}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Onmaynec-Auto-Resume-v3.2',
      'X-GitHub-Api-Version': process.env.GITHUB_API_VERSION || '2022-11-28',
    },
    body: JSON.stringify({ access_token: token }),
  });
  return response.status === 204;
}

module.exports._private = { revokeGitHubAccess };
