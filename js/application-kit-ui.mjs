import { els, state } from './config.js';
import {
  APPLICATION_KIT_TONES,
  applicationKitToMarkdown,
  applicationKitToText,
  generateApplicationKit,
} from './application-kit.mjs';

const copy = {
  ru: {
    kicker: 'Локальный пакет отклика',
    title: 'Application Kit',
    note: 'Сопроводительное письмо, доказательства по проектам, план закрытия пробелов и вопросы для интервью создаются только в браузере.',
    privacy: 'Исходный текст вакансии не сохраняется, не добавляется в ссылку и не отправляется API.',
    tone: 'Тон письма',
    concise: 'Краткий',
    balanced: 'Сбалансированный',
    detailed: 'Подробный',
    regenerate: 'Пересобрать',
    copy: 'Копировать',
    markdown: 'Скачать Markdown',
    text: 'Скачать TXT',
    editor: 'Редактируемый пакет отклика',
    ready: 'Пакет создан: соответствие {score}%, проектов с доказательствами — {projects}.',
    copied: 'Пакет отклика скопирован.',
    downloaded: 'Файл создан локально.',
    copyFailed: 'Не удалось скопировать автоматически. Выделите текст в редакторе.',
  },
  en: {
    kicker: 'Local application package',
    title: 'Application Kit',
    note: 'A cover letter, project evidence, gap plan and interview questions are created only in your browser.',
    privacy: 'The original vacancy text is not stored, added to a link or sent to an API.',
    tone: 'Letter tone',
    concise: 'Concise',
    balanced: 'Balanced',
    detailed: 'Detailed',
    regenerate: 'Regenerate',
    copy: 'Copy',
    markdown: 'Download Markdown',
    text: 'Download TXT',
    editor: 'Editable application kit',
    ready: 'Kit created: {score}% match, {projects} evidence projects.',
    copied: 'Application kit copied.',
    downloaded: 'File created locally.',
    copyFailed: 'Automatic copy failed. Select the text in the editor.',
  },
};

export function bootstrapApplicationKit() {
  if (typeof document === 'undefined' || !els?.vacancyResult || document.querySelector('#applicationKitPanel')) return null;
  ensureStylesheet();
  const panel = document.createElement('section');
  panel.id = 'applicationKitPanel';
  panel.className = 'application-kit hidden';
  panel.setAttribute('aria-labelledby', 'applicationKitTitle');
  panel.innerHTML = `
    <div class="application-kit__heading">
      <div>
        <span id="applicationKitKicker" class="kicker"></span>
        <h3 id="applicationKitTitle"></h3>
      </div>
      <span class="application-kit__local" aria-hidden="true">LOCAL</span>
    </div>
    <p id="applicationKitNote" class="section-note"></p>
    <p id="applicationKitPrivacy" class="application-kit__privacy"></p>
    <div class="application-kit__toolbar">
      <label for="applicationKitTone"><span id="applicationKitToneLabel"></span>
        <select id="applicationKitTone"></select>
      </label>
      <button id="applicationKitRegenerate" class="btn btn-primary" type="button"></button>
      <button id="applicationKitCopy" class="btn btn-secondary" type="button"></button>
      <button id="applicationKitMarkdown" class="btn btn-secondary" type="button"></button>
      <button id="applicationKitText" class="btn btn-secondary" type="button"></button>
    </div>
    <label class="application-kit__editor-label" for="applicationKitEditor" id="applicationKitEditorLabel"></label>
    <textarea id="applicationKitEditor" class="application-kit__editor" rows="22" spellcheck="true"></textarea>
    <p id="applicationKitStatus" class="application-kit__status" role="status" aria-live="polite"></p>
  `;
  els.vacancyResult.insertAdjacentElement('afterend', panel);

  const ui = {
    panel,
    kicker: panel.querySelector('#applicationKitKicker'),
    title: panel.querySelector('#applicationKitTitle'),
    note: panel.querySelector('#applicationKitNote'),
    privacy: panel.querySelector('#applicationKitPrivacy'),
    toneLabel: panel.querySelector('#applicationKitToneLabel'),
    tone: panel.querySelector('#applicationKitTone'),
    regenerate: panel.querySelector('#applicationKitRegenerate'),
    copy: panel.querySelector('#applicationKitCopy'),
    markdown: panel.querySelector('#applicationKitMarkdown'),
    text: panel.querySelector('#applicationKitText'),
    editorLabel: panel.querySelector('#applicationKitEditorLabel'),
    editor: panel.querySelector('#applicationKitEditor'),
    status: panel.querySelector('#applicationKitStatus'),
  };

  let kit = null;
  let dirty = false;

  function locale() {
    return state.locale === 'en' || document.documentElement.lang === 'en' ? 'en' : 'ru';
  }

  function messages() {
    return copy[locale()];
  }

  function renderLabels() {
    const text = messages();
    ui.kicker.textContent = text.kicker;
    ui.title.textContent = text.title;
    ui.note.textContent = text.note;
    ui.privacy.textContent = text.privacy;
    ui.toneLabel.textContent = text.tone;
    ui.regenerate.textContent = text.regenerate;
    ui.copy.textContent = text.copy;
    ui.markdown.textContent = text.markdown;
    ui.text.textContent = text.text;
    ui.editorLabel.textContent = text.editor;
    const selected = APPLICATION_KIT_TONES.includes(ui.tone.value) ? ui.tone.value : 'balanced';
    ui.tone.replaceChildren(...APPLICATION_KIT_TONES.map((tone) => {
      const option = document.createElement('option');
      option.value = tone;
      option.textContent = text[tone];
      option.selected = tone === selected;
      return option;
    }));
  }

  function relevantProjects() {
    const output = [];
    const seen = new Set();
    const selected = new Set((state.selectedProjects || []).map((item) => String(item).toLowerCase()));
    const candidates = [
      ...(state.vacancyAnalysis?.rankedRepos || []),
      ...(state.repos || []).filter((repo) => selected.has(String(repo.full_name || repo.name).toLowerCase())),
      ...(state.repos || []),
    ];
    for (const project of candidates) {
      const key = String(project?.full_name || project?.name || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(project);
      if (output.length >= 8) break;
    }
    return output;
  }

  function generate({ preserveStatus = false } = {}) {
    if (!state.vacancyAnalysis || !state.user) {
      kit = null;
      dirty = false;
      ui.editor.value = '';
      ui.panel.classList.add('hidden');
      return null;
    }
    kit = generateApplicationKit({
      locale: locale(),
      tone: ui.tone.value,
      profile: state.user,
      analysis: state.vacancyAnalysis,
      projects: relevantProjects(),
    });
    ui.editor.value = applicationKitToMarkdown(kit);
    ui.panel.classList.remove('hidden');
    ui.panel.dataset.applicationKitReady = 'true';
    dirty = false;
    if (!preserveStatus) {
      ui.status.textContent = format(messages().ready, {
        score: kit.matchScore,
        projects: new Set(kit.evidence.map((item) => item.project)).size,
      });
    }
    return kit;
  }

  async function copyEditor() {
    try {
      await writeClipboard(ui.editor.value);
      ui.status.textContent = messages().copied;
    } catch {
      ui.editor.focus();
      ui.editor.select();
      ui.status.textContent = messages().copyFailed;
    }
  }

  function downloadMarkdown() {
    downloadLocal(ui.editor.value, filename('md'), 'text/markdown;charset=utf-8');
    ui.status.textContent = messages().downloaded;
  }

  function downloadText() {
    const content = dirty ? markdownToPlainText(ui.editor.value) : applicationKitToText(kit);
    downloadLocal(content, filename('txt'), 'text/plain;charset=utf-8');
    ui.status.textContent = messages().downloaded;
  }

  function filename(extension) {
    const login = String(state.user?.login || 'developer').toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'developer';
    return `${login}-application-kit-${locale()}.${extension}`;
  }

  renderLabels();
  els.vacancyButton?.addEventListener('click', () => queueMicrotask(() => generate()));
  document.querySelector('#clearVacancyBtn')?.addEventListener('click', () => generate());
  ui.tone.addEventListener('change', () => generate());
  ui.regenerate.addEventListener('click', () => generate());
  ui.copy.addEventListener('click', copyEditor);
  ui.markdown.addEventListener('click', downloadMarkdown);
  ui.text.addEventListener('click', downloadText);
  ui.editor.addEventListener('input', () => { dirty = true; });
  els.localeSelect?.addEventListener('change', () => queueMicrotask(() => {
    renderLabels();
    if (!dirty && state.vacancyAnalysis) generate({ preserveStatus: true });
  }));

  const api = {
    regenerate: generate,
    get kit() { return kit; },
    get text() { return ui.editor.value; },
    get dirty() { return dirty; },
  };
  window.autoResumeApplicationKit = api;
  return api;
}

function ensureStylesheet() {
  if (document.querySelector('link[data-application-kit-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './application-kit.css';
  link.dataset.applicationKitStyle = 'true';
  document.head.append(link);
}

async function writeClipboard(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('COPY_FAILED');
}

function downloadLocal(content, name, type) {
  const blob = new Blob([`\uFEFF${String(content || '')}`], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function markdownToPlainText(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '- ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\\([\\`*_[\]<>])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function format(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrapApplicationKit, { once: true });
  else bootstrapApplicationKit();
}
