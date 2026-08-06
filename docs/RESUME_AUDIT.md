# Resume Quality Audit — Auto Resume 3.7

Resume Quality Audit остаётся локальной объяснимой проверкой текущего черновика и не связан с хранением Application Tracker.

Audit получает нормализованный resume draft, locale и requirement names. Raw vacancy text, Tracker records, OAuth data и local logo ему не передаются.

Score 0–100 делится на completeness, evidence, ATS readiness и readability. Findings используют стабильные issue codes. Проверка не является гарантией прохождения конкретной ATS, не придумывает достижения, не утверждает наличие missing skills и не переписывает пользовательский текст автоматически.

Audit report живёт отдельно от workspace, backup, public share, API, Redis/KV и Tracker. В public read-only режиме Audit panel скрыт. Markdown/TXT export создаётся локально.

При изменении правил сохраняйте стабильность issue codes, RU/EN copy, deterministic deductions и privacy tests.
