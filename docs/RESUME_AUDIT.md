# Resume Quality Audit — Auto Resume 3.8

Resume Quality Audit остаётся локальной объяснимой проверкой текущего resume draft. Он не связан с постоянным хранением Tracker или Interview Prep.

Audit получает draft, locale и normalized requirement names. Raw vacancy text, Tracker records, Prep answers/STAR stories/readiness и OAuth data ему не передаются.

Score 0–100 делится на completeness, evidence, ATS readiness и readability. Findings используют стабильные issue codes. Audit не гарантирует прохождение конкретной ATS, не придумывает достижения, не утверждает missing skills как опыт и не переписывает текст автоматически.

Audit report исключён из workspace, backup, public share, API, Redis/KV, Tracker и Prep schemas. Public read-only mode скрывает Audit panel. Markdown/TXT export создаётся локально.

При изменении правил сохраняйте deterministic deductions, stable issue codes, RU/EN copy и privacy contracts.
