function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function summarizeProfile(data) {
  const repos = Array.isArray(data?.repos) ? data.repos.filter((repo) => !repo.fork) : [];
  const languageWeights = {};
  let stars = 0;
  let forks = 0;

  for (const repo of repos) {
    stars += number(repo.stargazers_count);
    forks += number(repo.forks_count);
    const languages = repo.languages && Object.keys(repo.languages).length
      ? repo.languages
      : repo.language ? { [repo.language]: 1 } : {};
    for (const [name, weight] of Object.entries(languages)) {
      languageWeights[name] = (languageWeights[name] || 0) + number(weight);
    }
  }

  const topLanguages = Object.entries(languageWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return {
    login: data?.user?.login || '',
    name: data?.user?.name || data?.user?.login || '',
    avatarUrl: data?.user?.avatar_url || '',
    followers: number(data?.user?.followers),
    repos: number(data?.user?.public_repos || repos.length),
    stars,
    forks,
    contributions: number(data?.contributions?.total),
    commits: number(data?.contributions?.commits),
    topLanguages,
  };
}

export function metricWinner(leftValue, rightValue) {
  if (leftValue === rightValue) return 'tie';
  return leftValue > rightValue ? 'left' : 'right';
}

export function compareProfiles(leftData, rightData) {
  const left = summarizeProfile(leftData);
  const right = summarizeProfile(rightData);
  const leftSet = new Set(left.topLanguages.map((name) => name.toLowerCase()));
  const commonLanguages = right.topLanguages.filter((name) => leftSet.has(name.toLowerCase()));

  const metrics = [
    ['Подписчики', left.followers, right.followers],
    ['Публичные репозитории', left.repos, right.repos],
    ['Звёзды проектов', left.stars, right.stars],
    ['Форки проектов', left.forks, right.forks],
    ['Вклады за год', left.contributions, right.contributions],
    ['Коммиты за год', left.commits, right.commits],
  ].map(([label, leftValue, rightValue]) => ({
    label,
    left: leftValue,
    right: rightValue,
    winner: metricWinner(leftValue, rightValue),
  }));

  return { left, right, metrics, commonLanguages };
}
