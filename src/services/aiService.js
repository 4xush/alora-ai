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

const fallbackMCQQuestionBank = [
  {
    id: 'mcq1',
    level: 'easy',
    text: 'Which of the following is NOT a JavaScript data type?',
    options: ['String', 'Boolean', 'Float', 'Object'],
    correctAnswer: 'Float',
    seconds: 30
  },
  {
    id: 'mcq2',
    level: 'easy',
    text: 'Which HTML tag is used to define an internal style sheet?',
    options: ['<script>', '<css>', '<style>', '<link>'],
    correctAnswer: '<style>',
    seconds: 30
  },
  {
    id: 'mcq3',
    level: 'medium',
    text: 'Which CSS property is used to control the spacing between elements?',
    options: ['spacing', 'margin', 'padding', 'border'],
    correctAnswer: 'margin',
    seconds: 45
  },
  {
    id: 'mcq4',
    level: 'medium',
    text: 'What does the useState hook return?',
    options: ['Current state only', 'Function to update state only', 'Both current state and function to update it', 'Component props'],
    correctAnswer: 'Both current state and function to update it',
    seconds: 45
  },
  {
    id: 'mcq5',
    level: 'hard',
    text: 'Which of the following is NOT a valid way to create a React component?',
    options: ['Function declaration', 'Class that extends React.Component', 'Arrow function', 'Using the React.createComponent() method'],
    correctAnswer: 'Using the React.createComponent() method',
    seconds: 60
  },
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

function pickMCQQuestions(questionDistribution) {
  const out = [];
  for (const { level, count, seconds } of questionDistribution) {
    const pool = fallbackMCQQuestionBank.filter((q) => q.level === level);
    for (let i = 0; i < count; i++) {
      const question = { ...pool[i % pool.length], seconds };
      out.push(question);
    }
  }
  return out.map((q, idx) => ({ ...q, id: q.id + '-' + idx }));
}

export const aiService = {
  async extractResumeInfo({ resumeText }) {
    // Attempt Gemini; if not configured, return best-effort regex fallback
    const regexFallback = () => {
      console.log("Using regex fallback for resume info extraction");

      // More robust name extraction - look for name patterns or common indicators
      let nameMatch = resumeText.match(/(?:name|full name|candidate)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i) ||
        resumeText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:\s*\n|$)/) ||
        resumeText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);

      // More robust email extraction
      const emailMatch = resumeText.match(/(?:e-?mail|contact)[:\s]*([\w.-]+@[\w.-]+\.[A-Za-z]{2,})/i) ||
        resumeText.match(/([\w.-]+@[\w.-]+\.[A-Za-z]{2,})/);

      // More robust phone extraction
      const phoneMatch = resumeText.match(/(?:phone|mobile|cell|contact)[:\s]*(\+?\d[\d\s\-().]{7,}\d)/i) ||
        resumeText.match(/(\+?\d[\d\s\-().]{7,}\d)/);

      // Extract the name from the first capture group if available
      const name = nameMatch ? (nameMatch[1] || nameMatch[0]) : '';

      // For demo purposes, use placeholders if nothing is found
      return {
        name: name || 'John Doe',
        email: emailMatch?.[1] || emailMatch?.[0] || 'candidate@example.com',
        phone: phoneMatch?.[1] || phoneMatch?.[0] || '555-123-4567',
      };
    };

    if (!genAI) return regexFallback();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

  async generateMCQQuestions({ role, count = 10, questionDistribution, resumeText }) {
    if (!genAI) {
      const qs = pickMCQQuestions(questionDistribution);
      return { questions: qs };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Generate ${count} multiple choice questions (MCQs) for a technical interview for the role of "${role}".
      
Format your response as a JSON object with a "questions" array containing ${count} question objects.
Each question object should have:
- "id": A unique string identifier
- "level": Difficulty level ("easy", "medium", or "hard")
- "text": The question text
- "options": Array of 4 possible answers (strings)
- "correctAnswer": The correct answer string (must be one of the options)
- "seconds": Time in seconds allowed for this question

Use the candidate's resume to make relevant questions: ${resumeText.slice(0, 1000)}

Distribution should follow:
${questionDistribution.map(d => `${d.count} ${d.level} questions (${d.seconds} seconds each)`).join(', ')}

Return ONLY valid JSON without explanation or markdown formatting.`;

      const r = await model.generateContent(prompt);
      const responseText = r.response.text();

      // Extract JSON from response (handling potential markdown code blocks)
      let jsonStr = responseText.replace(/```json|```/g, '').trim();

      // Parse the JSON
      const parsedResponse = JSON.parse(jsonStr);

      if (Array.isArray(parsedResponse.questions) && parsedResponse.questions.length) {
        // Ensure each question has the required fields
        const validatedQuestions = parsedResponse.questions.map((q, idx) => ({
          id: q.id || `mcq-${idx}`,
          level: q.level || 'medium',
          text: q.text,
          options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer,
          seconds: q.seconds || 30
        }));

        return { questions: validatedQuestions };
      }
    } catch (e) {
      console.error('Error generating MCQ questions:', e);
    }

    // Fallback to predefined questions
    const qs = pickMCQQuestions(questionDistribution);
    return { questions: qs };
  },

  async scoreAnswers({ questions, answers }) {
    if (!genAI) {
      // Naive heuristic scoring fallback
      const perAnswer = answers.map((a) => ({ score: Math.min(10, Math.max(0, Math.round((a.answer?.length || 0) / 50))), explanation: 'Heuristic length-based score.' }));
      const total = Math.round((perAnswer.reduce((s, a) => s + a.score, 0) / (answers.length * 10)) * 100) || 0;
      return { perAnswer, totalScore: total, summary: 'Auto-generated summary (fallback). Candidate provided answers evaluated heuristically.' };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
