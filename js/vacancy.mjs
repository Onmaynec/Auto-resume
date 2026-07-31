const TECHNOLOGIES = [
  ['JavaScript', ['javascript', 'js', 'ecmascript']],
  ['TypeScript', ['typescript', 'ts']],
  ['React', ['react', 'reactjs', 'next.js', 'nextjs']],
  ['Vue', ['vue', 'vuejs', 'nuxt']],
  ['Angular', ['angular']],
  ['Node.js', ['node.js', 'nodejs', 'node']],
  ['Python', ['python', 'django', 'flask', 'fastapi']],
  ['Java', ['java', 'spring', 'spring boot']],
  ['C#', ['c#', '.net', 'asp.net', 'dotnet']],
  ['C++', ['c++', 'cpp']],
  ['Go', ['golang', 'go developer', ' go ']],
  ['Rust', ['rust']],
  ['PHP', ['php', 'laravel', 'symfony']],
  ['Ruby', ['ruby', 'rails']],
  ['Kotlin', ['kotlin', 'android']],
  ['Swift', ['swift', 'ios']],
  ['HTML', ['html', 'html5']],
  ['CSS', ['css', 'css3', 'sass', 'scss', 'tailwind']],
  ['SQL', ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite']],
  ['MongoDB', ['mongodb', 'mongo']],
  ['Redis', ['redis']],
  ['Docker', ['docker', 'container']],
  ['Kubernetes', ['kubernetes', 'k8s']],
  ['AWS', ['aws', 'amazon web services']],
  ['Azure', ['azure']],
  ['GCP', ['gcp', 'google cloud']],
  ['GraphQL', ['graphql']],
  ['REST API', ['rest api', 'restful']],
  ['Git', ['git', 'github', 'gitlab']],
  ['CI/CD', ['ci/cd', 'continuous integration', 'github actions']],
  ['Testing', ['testing', 'tests', 'jest', 'vitest', 'pytest', 'playwright', 'cypress']],
  ['Linux', ['linux', 'unix']],
  ['Agile', ['agile', 'scrum', 'kanban']],
];

export function extractRequirements(description) {
  const haystack = ` ${String(description || '').toLowerCase()} `;
  return TECHNOLOGIES
    .filter(([, aliases]) => aliases.some((alias) => haystack.includes(alias)))
    .map(([name]) => name);
}

export function collectProfileSkills(profile) {
  const skills = new Set();
  Object.keys(profile.languages || {}).forEach((item) => skills.add(normalizeSkill(item)));
  for (const repo of profile.repos || []) {
    if (repo.language) skills.add(normalizeSkill(repo.language));
    for (const topic of repo.topics || []) skills.add(normalizeSkill(topic));
    for (const language of Object.keys(repo.languages || {})) skills.add(normalizeSkill(language));
    const text = `${repo.name || ''} ${repo.description || ''}`.toLowerCase();
    for (const [name, aliases] of TECHNOLOGIES) {
      if (aliases.some((alias) => text.includes(alias.trim()))) skills.add(normalizeSkill(name));
    }
  }
  return skills;
}

export function analyzeVacancy(description, profile) {
  const requirements = extractRequirements(description);
  const profileSkills = collectProfileSkills(profile);
  const matched = requirements.filter((skill) => profileSkills.has(normalizeSkill(skill)));
  const missing = requirements.filter((skill) => !profileSkills.has(normalizeSkill(skill)));
  const score = requirements.length ? Math.round((matched.length / requirements.length) * 100) : 0;
  const rankedRepos = [...(profile.repos || [])]
    .map((repo) => ({ repo, relevance: repoRelevance(repo, requirements) }))
    .sort((a, b) => b.relevance - a.relevance)
    .filter((item) => item.relevance > 0)
    .slice(0, 5)
    .map((item) => item.repo);

  return {
    score,
    requirements,
    matched,
    missing,
    rankedRepos,
    headline: buildHeadline(matched, requirements),
    summaryHint: buildSummaryHint(matched, missing, score),
  };
}

export function repoRelevance(repo, requirements) {
  const text = [
    repo.name,
    repo.description,
    repo.language,
    ...(repo.topics || []),
    ...Object.keys(repo.languages || {}),
  ].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  for (const requirement of requirements) {
    const aliases = TECHNOLOGIES.find(([name]) => name === requirement)?.[1] || [requirement.toLowerCase()];
    if (aliases.some((alias) => text.includes(alias.trim()))) score += 10;
  }
  score += Math.min(10, Number(repo.stargazers_count || 0));
  score += Math.min(6, Number(repo.forks_count || 0));
  if (repo.description) score += 2;
  if (repo.homepage) score += 2;
  if (repo.archived) score -= 20;
  return score;
}

function buildHeadline(matched, requirements) {
  const source = matched.length ? matched : requirements;
  if (!source.length) return 'Software Developer';
  return `${source.slice(0, 3).join(' / ')} Developer`;
}

function buildSummaryHint(matched, missing, score) {
  if (!matched.length) return 'В вакансии не найдено совпадений с публичным GitHub-профилем. Добавьте релевантные проекты или уточните описание вакансии.';
  const strength = score >= 75 ? 'сильное' : score >= 45 ? 'частичное' : 'начальное';
  const missingText = missing.length ? ` Стоит подтвердить или развить: ${missing.slice(0, 5).join(', ')}.` : '';
  return `Профиль показывает ${strength} соответствие требованиям. Подтверждённые навыки: ${matched.slice(0, 7).join(', ')}.${missingText}`;
}

function normalizeSkill(value) {
  return String(value || '').toLowerCase().replace(/[.\s_-]+/g, '');
}
