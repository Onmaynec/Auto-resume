const {
  callbackUrl,
  clearFlowCookie,
  constantTimeEqual,
  getOAuthConfig,
  randomBase64Url,
  readFlow,
  redirect,
  sendJson,
  withAuthResult,
  writeSessionCookie,
} = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  }

  const config = getOAuthConfig();
  if (!config.configured) return sendJson(res, 503, { code: 'OAUTH_NOT_CONFIGURED' });

  const flow = readFlow(req, config.sessionSecret);
  clearFlowCookie(req, res);
  const returnTo = flow?.returnTo || '/';

  if (req.query?.error) return redirect(res, withAuthResult(returnTo, 'denied', req.query.error));
  if (!flow || !constantTimeEqual(flow.state, req.query?.state)) return redirect(res, withAuthResult(returnTo, 'error', 'invalid_state'));
  if (!req.query?.code) return redirect(res, withAuthResult(returnTo, 'error', 'missing_code'));

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: String(req.query.code),
        redirect_uri: flow.redirectUri || callbackUrl(req),
        code_verifier: flow.verifier,
      }),
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || tokenPayload.error || !tokenPayload.access_token) {
      return redirect(res, withAuthResult(returnTo, 'error', tokenPayload.error || 'token_exchange'));
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenPayload.access_token}`,
        'User-Agent': 'Onmaynec-Auto-Resume-v3.2',
        'X-GitHub-Api-Version': process.env.GITHUB_API_VERSION || '2022-11-28',
      },
    });
    if (!userResponse.ok) return redirect(res, withAuthResult(returnTo, 'error', 'user_lookup'));
    const user = await userResponse.json();
    const scopes = String(tokenPayload.scope || '').split(',').map((scope) => scope.trim()).filter(Boolean);

    writeSessionCookie(req, res, {
      sid: randomBase64Url(18),
      token: tokenPayload.access_token,
      tokenType: tokenPayload.token_type || 'bearer',
      scopes,
      user: {
        id: user.id,
        login: user.login,
        name: user.name || user.login,
        avatarUrl: user.avatar_url || '',
        profileUrl: user.html_url || '',
      },
    }, config.sessionSecret);
    return redirect(res, withAuthResult(returnTo, 'success'));
  } catch {
    return redirect(res, withAuthResult(returnTo, 'error', 'upstream'));
  }
};
