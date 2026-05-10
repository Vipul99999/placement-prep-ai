import { formatDate } from "@/lib/utils";
import type { PrepPackDetail, QuestionPageItem } from "@/types/prep";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPrepPackExportHtml(args: {
  pack: PrepPackDetail;
  questionsByCategory: Record<string, QuestionPageItem[]>;
}) {
  const { pack, questionsByCategory } = args;

  const categoryMarkup = pack.categoryPlan
    .map((category) => {
      const questions = questionsByCategory[category.name] ?? [];

      return `
        <section class="section category">
          <div class="heading">
            <div>
              <p class="eyebrow">${escapeHtml(category.type)} - ${escapeHtml(category.importance)}</p>
              <h2>${escapeHtml(category.name)}</h2>
              <p class="muted">${escapeHtml(category.reason)}</p>
            </div>
            <span class="pill">${questions.length} questions</span>
          </div>
          ${questions
            .map(
              (item) => `
                <article class="card question-card">
                  <div class="card-top">
                    <p class="question">${escapeHtml(item.question.question)}</p>
                    <span class="mini-pill">${escapeHtml(item.question.difficulty)}</span>
                  </div>
                  <p><strong>Short answer:</strong> ${escapeHtml(item.question.answerShort)}</p>
                  <p><strong>Detailed answer:</strong> ${escapeHtml(
                    item.question.answerDetailed || "Generate detailed answer inside the app when needed."
                  )}</p>
                  <p><strong>Example:</strong> ${escapeHtml(item.question.example || "No example generated yet.")}</p>
                  <p><strong>Follow-ups:</strong> ${escapeHtml(item.question.followUps.join(" | "))}</p>
                  <p><strong>Common mistakes:</strong> ${escapeHtml(item.question.commonMistakes.join(" | "))}</p>
                </article>
              `
            )
            .join("")}
        </section>
      `;
    })
    .join("");

  const roadmapMarkup = pack.roadmap
    .map(
      (day) => `
        <article class="card timeline-card">
          <div class="heading">
            <div>
              <p class="eyebrow">Day ${day.day}</p>
              <h3>${escapeHtml(day.title)}</h3>
            </div>
            <span class="pill">${day.estimatedHours} hrs</span>
          </div>
          <p><strong>Topics:</strong> ${escapeHtml(day.topics.join(" | "))}</p>
          <p><strong>Tasks:</strong> ${escapeHtml(day.tasks.join(" | "))}</p>
        </article>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(pack.companyName)} ${escapeHtml(pack.role)} Prep Pack</title>
        <style>
          :root {
            --ink: #102027;
            --ocean: #0f766e;
            --sky: #0ea5e9;
            --sand: #fff6ec;
            --accent: #ff7a59;
            --white: #ffffff;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background:
              radial-gradient(circle at top left, rgba(255,122,89,0.14), transparent 32%),
              radial-gradient(circle at top right, rgba(14,165,233,0.14), transparent 28%),
              linear-gradient(180deg, #fff9f2 0%, #f4fbf9 100%);
            color: var(--ink);
            font-family: Arial, sans-serif;
          }
          main { max-width: 980px; margin: 0 auto; padding: 28px 20px 64px; }
          .hero {
            background: linear-gradient(135deg, #102027 0%, #0f766e 58%, #0ea5e9 100%);
            border-radius: 28px;
            padding: 30px;
            margin-bottom: 24px;
            color: var(--white);
            box-shadow: 0 20px 40px rgba(16,32,39,0.16);
          }
          .hero .eyebrow, .hero .muted { color: rgba(255,255,255,0.82); }
          .hero-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-top: 18px; }
          .hero-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 16px; }
          .section { margin-top: 30px; }
          .category { page-break-inside: avoid; }
          .card {
            background: rgba(255,255,255,0.96);
            border-radius: 20px;
            padding: 18px;
            margin-top: 14px;
            box-shadow: 0 10px 30px rgba(16,32,39,0.08);
            border: 1px solid rgba(16,32,39,0.06);
          }
          .heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
          .eyebrow { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ocean); font-weight: 700; margin: 0 0 8px; }
          .pill, .mini-pill {
            background: #fff1de;
            border-radius: 999px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }
          .mini-pill { background: rgba(14,165,233,0.12); color: var(--ink); }
          .muted { color: #425a60; line-height: 1.7; }
          h1, h2, h3, p { margin-top: 0; }
          h1 { font-size: 36px; margin-bottom: 10px; }
          h2 { font-size: 26px; margin-bottom: 10px; }
          h3 { font-size: 20px; margin-bottom: 8px; }
          .question { font-size: 18px; font-weight: 700; line-height: 1.45; margin-bottom: 12px; }
          .card-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
          .timeline-card { border-left: 6px solid rgba(15,118,110,0.2); }
          @media print {
            body { background: #ffffff; }
            .hero { box-shadow: none; }
            .card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <section class="hero">
            <p class="eyebrow">${escapeHtml(pack.companyName)}</p>
            <h1>${escapeHtml(pack.role)} Prep Pack</h1>
            <p class="muted">${escapeHtml(pack.analysis.summary)}</p>
            <div class="hero-grid">
              <div class="hero-card"><strong>Total questions</strong><p>${pack.totalQuestions}</p></div>
              <div class="hero-card"><strong>Preparation days</strong><p>${pack.preparationDays}</p></div>
              <div class="hero-card"><strong>Difficulty</strong><p>${escapeHtml(pack.difficulty)}</p></div>
              <div class="hero-card"><strong>Created</strong><p>${escapeHtml(formatDate(pack.createdAt))}</p></div>
            </div>
          </section>

          <section class="section">
            <p class="eyebrow">Skill Breakdown</p>
            <div class="card">
              <p><strong>Primary skills:</strong> ${escapeHtml(pack.analysis.primarySkills.join(" | "))}</p>
              <p><strong>Secondary skills:</strong> ${escapeHtml(pack.analysis.secondarySkills.join(" | "))}</p>
              <p><strong>Core subjects:</strong> ${escapeHtml(pack.analysis.coreSubjects.join(" | "))}</p>
              <p><strong>Interview rounds:</strong> ${escapeHtml(pack.analysis.interviewRounds.join(" | "))}</p>
            </div>
          </section>

          <section class="section">
            <p class="eyebrow">Roadmap</p>
            ${roadmapMarkup}
          </section>

          ${categoryMarkup}
        </main>
      </body>
    </html>
  `.trim();
}
