import { t } from './i18n.mjs';
export function buildResumeText(draft, locale = draft?.locale || 'ru') {
  const projects = (draft.projects || []).map((project) => [project.name, project.description, project.url ? `${t('resume.text.link', {}, locale)}: ${project.url}` : ''].filter(Boolean).join('\n')).join('\n\n');
  const skills = (draft.skills || []).map((item) => typeof item === 'string' ? item : `${item.name} — ${item.percent}%`).join(', ');
  return [draft.name, draft.headline, draft.contact, '', t('resume.text.about', {}, locale), draft.about, '', t('resume.text.projects', {}, locale), projects || t('resume.text.notSpecified', {}, locale), '', t('resume.text.skills', {}, locale), skills || t('resume.text.notSpecified', {}, locale)].filter((line) => line !== undefined && line !== null).join('\n').trim();
}
export function safeFilename(value, fallback = 'resume') { const result = String(value || '').normalize('NFKD').replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80); return result || fallback; }
