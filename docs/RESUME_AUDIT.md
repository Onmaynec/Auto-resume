# Resume Quality Audit — Auto Resume 3.9

Resume Quality Audit остаётся локальной объяснимой проверкой resume draft. Он получает draft, locale и normalized requirement names, но не raw vacancy text, Tracker/Prep/Offer records или OAuth data.

Score 0–100 делится на completeness, evidence, ATS readiness и readability. Findings используют stable issue codes. Audit не гарантирует прохождение ATS, не придумывает опыт и не переписывает текст автоматически.

Audit report исключён из workspace, backup, public share, API, Redis/KV, Tracker, Interview Prep и Offer Lab. Public read-only mode скрывает panel. Markdown/TXT export создаётся локально.
