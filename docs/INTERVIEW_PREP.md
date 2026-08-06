# Interview Prep Lab — Auto Resume 3.9

Interview Prep остаётся отдельной local database `auto-resume:interview-prep:v1`. Он хранит allowlisted session data, questions, answers, self-ratings и STAR stories.

Tracker relation ограничена application ID/company/role. Raw vacancy text, resume content, Application Kit и Audit report не сохраняются. Вопросы строятся из normalized skill/gap/project names; missing skills остаются gap questions.

Readiness 0–100 остаётся explainable heuristic: answer coverage 45, confidence 25, complete STAR evidence 20, planning 10. Это не hiring prediction.

Offer Decision Lab не копирует Interview Prep answers, STAR stories или readiness. Эти базы полностью независимы.

Prep data исключены из workspace backup, public share, API, Redis/KV и analytics. Public read-only mode скрывает panel. Dedicated JSON/Markdown exports создаются локально.
