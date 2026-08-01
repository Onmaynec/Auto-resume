from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, value):
    (ROOT / path).write_text(value, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'missing replacement marker in {path}: {old[:80]!r}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement):
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'expected one regex replacement in {path}, got {count}')
    write(path, updated)


# Wire the serverless profile endpoint to distributed infrastructure.
regex_once(
    'api/github.js',
    r"const \{ readSession \} = require\('./_auth'\);\n\nconst CACHE_TTL_MS = .*?globalThis\.__autoResumeV3RequestWindows = requestWindows;\n",
    "const { readActiveSession } = require('./_session-state');\n"
    "const { getGlobalStore } = require('./_store');\n"
    "const {\n"
    "  applyInfrastructureHeaders,\n"
    "  consumeRateLimit,\n"
    "  loadProfile,\n"
    "  logInfrastructureMetric,\n"
    "  makeCacheKey,\n"
    "} = require('./_profile-gateway');\n\n"
    "const USERNAME_RE = /^[a-z\\d](?:[a-z\\d-]{0,37}[a-z\\d])?$/i;\n"
    "const store = getGlobalStore();\n",
)

regex_once(
    'api/github.js',
    r"  const session = readSession\(req\);\n  const auth = resolveAuthContext\(username, session, process\.env\.GITHUB_TOKEN \|\| process\.env\.GH_TOKEN\);.*?  try \{\n    const data = await fetchGitHubProfile\(username, auth\.token, auth\);\n    responseCache\.set\(cacheKey, \{ data, expiresAt: Date\.now\(\) \+ CACHE_TTL_MS \}\);\n    pruneMaps\(\);\n    res\.setHeader\('X-Auto-Resume-Cache', 'MISS'\);\n    setResponseCachePolicy\(res, auth\.privateContributionsIncluded\);\n    return sendJson\(res, 200, data\);\n",
    "  const sessionState = await readActiveSession(req, process.env.SESSION_SECRET);\n"
    "  const session = sessionState.session;\n"
    "  const auth = resolveAuthContext(username, session, process.env.GITHUB_TOKEN || process.env.GH_TOKEN);\n"
    "  if (!auth.token) return sendJson(res, 503, { code: 'PROXY_NOT_CONFIGURED', error: 'На сервере не задан GITHUB_TOKEN и отсутствует OAuth-сессия.' });\n\n"
    "  const rateState = await consumeRateLimit({ store, req, session });\n"
    "  applyInfrastructureHeaders(res, null, rateState);\n"
    "  if (!rateState.allowed) {\n"
    "    return sendJson(res, 429, {\n"
    "      code: 'TOO_MANY_REQUESTS',\n"
    "      error: 'Слишком много запросов. Повторите попытку позже.',\n"
    "      resetAt: new Date(rateState.resetAt).toISOString(),\n"
    "    });\n"
    "  }\n\n"
    "  const cacheKey = makeCacheKey({\n"
    "    username,\n"
    "    privateContributionsIncluded: auth.privateContributionsIncluded,\n"
    "    session,\n"
    "  });\n\n"
    "  try {\n"
    "    const result = await loadProfile({\n"
    "      store,\n"
    "      cacheKey,\n"
    "      fetcher: () => fetchGitHubProfile(username, auth.token, auth),\n"
    "      waitUntil: typeof req.waitUntil === 'function' ? req.waitUntil.bind(req) : null,\n"
    "    });\n"
    "    applyInfrastructureHeaders(res, result, rateState);\n"
    "    setResponseCachePolicy(res, auth.privateContributionsIncluded);\n"
    "    logInfrastructureMetric({\n"
    "      cache: result.cache,\n"
    "      store: result.store,\n"
    "      upstreamDurationMs: result.upstreamDurationMs,\n"
    "      status: 200,\n"
    "    });\n"
    "    return sendJson(res, 200, result.data);\n",
)

regex_once(
    'api/github.js',
    r"\nfunction consumeRequest\(clientId\) \{.*?\nfunction setResponseCachePolicy",
    "\nfunction setResponseCachePolicy",
)

text = read('api/github.js').replace('Onmaynec-Auto-Resume-v3', 'Onmaynec-Auto-Resume-v3.2')
write('api/github.js', text)

# Version metadata and syntax checks.
pkg = json.loads(read('package.json'))
pkg['version'] = '3.2.0'
check = pkg['scripts']['check']
marker = 'node --check api/_auth.js'
addition = 'node --check api/_store.js && node --check api/_profile-gateway.js && node --check api/_session-state.js && node --check api/_auth.js'
if marker not in check:
    raise SystemExit('package check marker missing')
pkg['scripts']['check'] = check.replace(marker, addition, 1)
write('package.json', json.dumps(pkg, ensure_ascii=False, indent=2) + '\n')

replace_once('js/version.mjs', "APP_VERSION = '3.1.0'", "APP_VERSION = '3.2.0'")
replace_once('sw.js', "APP_VERSION = '3.1.0'", "APP_VERSION = '3.2.0'")

for path in ['index.html', 'js/i18n.mjs']:
    write(path, read(path).replace('v3.1', 'v3.2'))

# Environment configuration.
env_path = '.env.example'
env = read(env_path).rstrip() + '''

# Optional shared Upstash Redis / Vercel KV REST storage.
# Leave empty to use the safe in-memory fallback.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# Vercel KV aliases are also supported: KV_REST_API_URL / KV_REST_API_TOKEN.
AUTO_RESUME_STORE_NAMESPACE=auto-resume:v3.2

# HMAC secret used to anonymize IP/session rate-limit keys.
# Falls back to SESSION_SECRET when omitted.
RATE_LIMIT_SECRET=
API_RATE_LIMIT=20
API_RATE_WINDOW_MS=600000

# Optional distributed logout denylist. Stores only a hash of sid and revokedAt.
SESSION_DENYLIST_ENABLED=false
'''
write(env_path, env)

# Changelog and README.
changelog = read('CHANGELOG.md')
section = '''## v3.2.0 — 2026-08-01

- добавлен общий Upstash Redis / Vercel KV REST-адаптер без обязательной npm-зависимости;
- публичный и authenticated-self кэш разделены независимыми namespace;
- добавлен распределённый fixed-window rate limiting по HMAC-отпечатку IP или OAuth-сессии;
- реализованы stale-while-revalidate, локальная дедупликация и distributed lock против cache stampede;
- при сбое Redis приложение автоматически использует безопасный memory fallback;
- добавлен опциональный session denylist с TTL без хранения OAuth-токена;
- добавлены privacy-safe заголовки и метрики HIT/MISS/STALE, backend latency и degraded mode;
- обновлены environment template, threat model и deployment documentation;
- добавлены unit и integration тесты Redis REST, TTL, partitioning, rate limits, fallback и denylist;
- версия проекта повышена до 3.2.0.

'''
if '## v3.2.0 ' not in changelog:
    changelog = changelog.replace('# Changelog\n\n', '# Changelog\n\n' + section, 1)
write('CHANGELOG.md', changelog)

readme = read('README.md').replace('# ✨ Auto Resume v3.1', '# ✨ Auto Resume v3.2', 1)
new_readme_section = '''## 🗄️ Что нового в v3.2

- общий serverless-кэш через Upstash Redis REST или совместимые Vercel KV переменные;
- распределённый rate limiting между разными serverless-инстансами;
- stale-while-revalidate и защита от одновременных одинаковых GitHub GraphQL-запросов;
- автоматический memory fallback при отсутствии или временном сбое Redis;
- опциональный denylist для принудительного завершения OAuth-сессий;
- Redis никогда не получает OAuth-токен, текст вакансии или содержимое резюме.

'''
if '## 🗄️ Что нового в v3.2' not in readme:
    readme = readme.replace('## 🔄 Что нового в v3.1', new_readme_section + '## 🔄 Что нового в v3.1', 1)
redis_deploy = '''## 🧱 Redis/KV для production

Для общего кэша и rate limiting между serverless-инстансами задайте:

```text
UPSTASH_REDIS_REST_URL=https://…upstash.io
UPSTASH_REDIS_REST_TOKEN=…
RATE_LIMIT_SECRET=случайная_строка
```

Также поддерживаются алиасы `KV_REST_API_URL` и `KV_REST_API_TOKEN`. Без этих переменных используется memory fallback. `SESSION_DENYLIST_ENABLED=true` включает распределённое завершение сессий; в Redis записываются только HMAC-хэш идентификатора сессии и время отзыва с TTL.

'''
if '## 🧱 Redis/KV для production' not in readme:
    readme = readme.replace('## 🔑 Настройка GitHub OAuth', redis_deploy + '## 🔑 Настройка GitHub OAuth', 1)
write('README.md', readme)

threat_path = 'docs/THREAT_MODEL.md'
threat = read(threat_path).rstrip()
append = '''

## Redis/KV и распределённая инфраструктура v3.2

- OAuth token, cookie, текст вакансии и содержимое резюме никогда не записываются в Redis.
- Ключи rate limiting используют HMAC/хэш IP или session id, а не исходные идентификаторы.
- Authenticated-self данные имеют отдельный cache namespace и не читаются публичным запросом.
- Session denylist опционален и хранит только хэш `sid`, `revokedAt` и TTL до истечения cookie.
- При недоступном Redis запросы переходят на локальный memory fallback; ошибка storage не раскрывается клиенту.
- Метрики содержат только тип cache result, backend, latency, degraded flag и HTTP status.
'''
if '## Redis/KV и распределённая инфраструктура v3.2' not in threat:
    threat += append
write(threat_path, threat + '\n')

# Keep legacy static assertions aligned with the current release.
for path in (ROOT / 'tests').glob('*.mjs'):
    value = path.read_text(encoding='utf-8')
    value = value.replace('3.1.0', '3.2.0')
    value = value.replace('v3\\.1', 'v3\\.2')
    value = value.replace('v3.1', 'v3.2')
    path.write_text(value, encoding='utf-8')
