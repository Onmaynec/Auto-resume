const {
  callbackUrl,
  getOAuthConfig,
  randomBase64Url,
  redirect,
  safeReturnTo,
  sendJson,
  sha256Base64Url,
  writeFlowCookie,
} = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { code: 'METHOD_NOT_ALLOWED' });
  }

  const config = getOAuthConfig();
  if (!config.configured) return sendJson(res, 503, { code: 'OAUTH_NOT_CONFIGURED' });

  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const returnTo = safeReturnTo(req.query?.returnTo);
  const redirectUri = callbackUrl(req);
  writeFlowCookie(req, res, { state, verifier, returnTo, redirectUri }, config.sessionSecret);

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', config.clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', sha256Base64Url(verifier));
  authorize.searchParams.set('code_challenge_method', 'S256');
  authorize.searchParams.set('allow_signup', 'true');
  return redirect(res, authorize.toString());
};
