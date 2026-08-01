from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, content):
    (ROOT / path).write_text(content, encoding='utf-8')


index = read('index.html')
index = index.replace('Auto Resume v3.0', 'Auto Resume v3.1')

style_anchor = '  <link rel="stylesheet" href="auth.css" />\n'
if 'href="update.css"' not in index:
    if style_anchor not in index:
        raise RuntimeError('Missing auth.css anchor in index.html')
    index = index.replace(style_anchor, style_anchor + '  <link rel="stylesheet" href="update.css" />\n', 1)

banner = '''  <section id="updateBanner" class="update-banner hidden" role="status" aria-live="polite" aria-labelledby="updateTitle">
    <div class="update-banner__head">
      <div class="update-banner__copy">
        <span id="updateKicker" class="kicker">GitHub Release</span>
        <h2 id="updateTitle">Доступно обновление</h2>
        <p id="updateMessage">Новая версия приложения готова к установке.</p>
      </div>
    </div>
    <div class="update-banner__actions">
      <button id="updateApplyBtn" class="btn btn-primary" type="button">Обновить сейчас</button>
      <button id="updateLaterBtn" class="btn btn-secondary" type="button">Позже</button>
      <a id="updateNotes" class="text-button" href="https://github.com/Onmaynec/Auto-resume/releases" target="_blank" rel="noreferrer">Что изменилось ↗</a>
    </div>
    <small id="updateStatus" class="update-banner__status"></small>
  </section>
'''
footer_anchor = '  <footer class="container footer">'
if 'id="updateBanner"' not in index:
    if footer_anchor not in index:
        raise RuntimeError('Missing footer anchor in index.html')
    index = index.replace(footer_anchor, banner + footer_anchor, 1)

script_anchor = '  <script type="module" src="app.js"></script>\n'
if 'src="js/update.mjs"' not in index:
    if script_anchor not in index:
        raise RuntimeError('Missing app.js anchor in index.html')
    index = index.replace(script_anchor, script_anchor + '  <script type="module" src="js/update.mjs"></script>\n', 1)

write('index.html', index)
write('js/i18n.mjs', read('js/i18n.mjs').replace('v3.0', 'v3.1'))

for path in ['.release/apply_v31.py', '.github/workflows/apply-v31.yml']:
    target = ROOT / path
    if target.exists():
        target.unlink()
