import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const fallbackQuestionBank = [
  { id: 'e1', level: 'easy', text: 'Explain the difference between var, let, and const in JavaScript.' },
  { id: 'e2', level: 'easy', text: 'What is a pure function? Why is it useful?' },
  { id: 'm1', level: 'medium', text: 'How does React reconciliation work and what are keys used for?' },
  { id: 'm2', level: 'medium', text: 'Describe how Redux Toolkit simplifies Redux patterns.' },
  { id: 'h1', level: 'hard', text: 'Design a scalable system for real-time chat. Consider data model, scaling, and security.' },
  { id: 'h2', level: 'hard', text: 'Explain CAP theorem and how it influences database design choices.' },
];

function pickQuestions(levels) {
  const out = [];
  for (const { level, count } of levels) {
    const pool = fallbackQuestionBank.filter((q) => q.level === level);
    for (let i = 0; i < count; i++) {
      out.push({ ...pool[i % pool.length] });
    }
  }
  return out.map((q, idx) => ({ ...q, id: q.id + '-' + idx }));
}

export const aiService = {
  async extractResumeInfo({ resumeText }) {
    // Attempt Gemini; if not configured, return best-effort regex fallback
    const regexFallback = () => {
      const nameMatch = resumeText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/);
      const phoneMatch = resumeText.match(/(\+?\d[\d\s\-]{7,}\d)/);
      return {
        name: nameMatch?.[0] || '',
        email: emailMatch?.[0] || '',
        phone: phoneMatch?.[0] || '',
      };
    };

    if (!genAI) return regexFallback();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Extract candidate info as JSON with keys name, email, phone. If missing, set to empty string. Resume text: ${resumeText}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await model.generateContent(prompt);
        const text = r.response.text();
        const json = JSON.parse(text.replace(/```json|```/g, ''));
        return { name: json.name || '', email: json.email || '', phone: json.phone || '' };
      } catch (e) {
        await sleep(300 * (attempt + 1));
      }
    }
    return regexFallback();
  },

  async generateQuestions({ role, levels, resumeText }) {
    if (!genAI) {
      const qs = pickQuestions(levels);
      return { questions: qs };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Return JSON {questions:[{id, level, text}]} for an interview for role ${role}. Levels: ${levels
      .map((l) => `${l.level}:${l.count}`)
      .join(', ')}. Use the resume context: ${resumeText.slice(0, 2000)}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await model.generateContent(prompt);
        const text = r.response.text();
        const json = JSON.parse(text.replace(/```json|```/g, ''));
        if (Array.isArray(json.questions) && json.questions.length) return json;
      } catch (e) {
        await sleep(300 * (attempt + 1));
      }
    }
    const qs = pickQuestions(levels);
    return { questions: qs };
  },

  async scoreAnswers({ questions, answers }) {
    if (!genAI) {
      // Naive heuristic scoring fallback
      const perAnswer = answers.map((a) => ({ score: Math.min(10, Math.max(0, Math.round((a.answer?.length || 0) / 50))), explanation: 'Heuristic length-based score.' }));
      const total = Math.round((perAnswer.reduce((s, a) => s + a.score, 0) / (answers.length * 10)) * 100) || 0;
      return { perAnswer, totalScore: total, summary: 'Auto-generated summary (fallback). Candidate provided answers evaluated heuristically.' };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Strict JSON only. Score each answer 0-10 with explanation. Also return final totalScore(0-100) and 3-4 line summary.
Format: { perAnswer:[{score, explanation}], totalScore, summary }
Questions:${JSON.stringify(questions)}
Answers:${JSON.stringify(answers)}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await model.generateContent(prompt);
        const text = r.response.text();
        const json = JSON.parse(text.replace(/```json|```/g, ''));
        if (json?.perAnswer && typeof json.totalScore === 'number') return json;
      } catch (e) {
        await sleep(300 * (attempt + 1));
      }
    }
    // Fallback
    const perAnswer = answers.map((a) => ({ score: 5, explanation: 'Fallback score.' }));
    const total = Math.round((perAnswer.reduce((s, a) => s + a.score, 0) / (answers.length * 10)) * 100) || 0;
    return { perAnswer, totalScore: total, summary: 'Fallback summary due to AI unavailability.' };
  },
};
