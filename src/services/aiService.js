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
    console.log("Starting extractResumeInfo with text length:", resumeText?.length || 0);

    // Check if we have actual text to process
    if (!resumeText || resumeText.trim().length < 10) {
      console.error("Resume text too short or empty");
      return { name: "", email: "", phone: "" };
    }

    // Attempt Gemini; if not configured, return best-effort regex fallback
    const regexFallback = () => {
      console.log("Using regex fallback for resume info extraction");
      console.log("First 100 chars of resume:", resumeText.substring(0, 100));

      // Extract first line which often contains the name
      const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
      const firstLine = lines[0]?.trim() || '';

      // Check if first line looks like a name (no special chars, reasonable length)
      const isNameLike = (text) => {
        return text.length > 2 && text.length < 50 &&
          /^[A-Za-z\s.'-]+$/.test(text) &&
          !text.includes('@') &&
          !text.includes('resume') &&
          !text.includes('cv');
      };

      let nameFromFirstLine = null;
      if (isNameLike(firstLine)) {
        nameFromFirstLine = firstLine;
        console.log("Extracted name from first line:", nameFromFirstLine);
      }

      // For the specific resume format we've observed
      // Look for a pattern like "AYUSH KUMAR  +91-9546053231   •   ayush043b@gmail.com"
      const fullInfoMatch = resumeText.match(/([A-Z][A-Za-z\s.'-]+)[\s•]*([+\d\-\s()]+)[\s•]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

      if (fullInfoMatch) {
        console.log("Found complete resume header match");
        return {
          name: fullInfoMatch[1]?.trim(),
          phone: fullInfoMatch[2]?.trim(),
          email: fullInfoMatch[3]?.trim(),
        };
      }

      // If the combined pattern doesn't work, try individual patterns

      // More robust name extraction - look for name patterns or common indicators
      let nameMatch = nameFromFirstLine ? { 1: nameFromFirstLine } :
        resumeText.match(/^([A-Z][A-Za-z\s.'-]+)(?:\s+[\+\d]|[\s•])/) ||
        resumeText.match(/(?:name|full name|candidate)[:\s]+([A-Za-z][A-Za-z\s.'-]+)/i) ||
        resumeText.match(/([A-Za-z][A-Za-z\s.'-]{2,30})(?:\s*\n|$)/) ||
        resumeText.match(/([A-Za-z]+\s+[A-Za-z]+)/);

      // More robust email extraction with common variations
      const emailMatch = resumeText.match(/[\s•:|]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/) ||
        resumeText.match(/(?:e-?mail|e-?mail\s*address|contact)[:\s|]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
        resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      // More robust phone extraction with international formats
      const phoneMatch = resumeText.match(/([+\d][\d\s\-+()]{7,}\d)[\s•|]/) ||
        resumeText.match(/(?:phone|mobile|cell|telephone|contact)[:\s|]*([\+\d][\d\s\-+()]{7,}\d)/i) ||
        resumeText.match(/([\+\d][\d\s\-+()]{7,}\d)/);

      // Extract the name from the first capture group if available
      const name = nameMatch ? (nameMatch[1] || nameMatch[0]) : '';

      console.log("Individual matches:", {
        name: nameMatch ? nameMatch[1] || nameMatch[0] : null,
        email: emailMatch ? emailMatch[1] || emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[1] || phoneMatch[0] : null
      });

      // Return extracted info or fallbacks with empty strings instead of defaults
      return {
        name: name || '',
        email: emailMatch?.[1] || emailMatch?.[0] || '',
        phone: phoneMatch?.[1] || phoneMatch?.[0] || '',
      };
    };

    if (!genAI) {
      console.log("Gemini API not configured, using regex fallback");
      return regexFallback();
    }

    // Always log the first part of the resume for debugging
    console.log("Resume text preview (first 200 chars):",
      resumeText.substring(0, 200).replace(/\n/g, "\\n"));

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

  async generateMCQQuestions({ role, count = 10, questionDistribution, complexity = 'balanced', focusArea = 'full-coverage', resumeText }) {
    if (!genAI) {
      const qs = pickMCQQuestions(questionDistribution);
      return { questions: qs };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // NEW: Generate complexity-specific instructions
      const getComplexityInstructions = (complexity) => {
        switch (complexity) {
          case 'fundamentals':
            return `Focus on fundamental concepts, basic implementations, and core principles. 
          Avoid overly complex scenarios. Test understanding of basic concepts thoroughly.
          Questions should be accessible but test real understanding of fundamentals.`;

          case 'advanced':
            return `Include complex patterns, advanced architectural concepts, optimization techniques, 
          and edge cases. Test deep understanding and problem-solving abilities.
          Challenge the candidate with sophisticated scenarios and advanced concepts.`;

          case 'resume-focused':
            return `Generate questions that specifically test the candidate's claimed experience from their resume. 
          Focus on technologies, projects, and skills mentioned in their background.
          Ask about specific implementations and challenges they would have faced.`;

          case 'balanced':
          default:
            return `Provide a balanced mix of fundamental concepts and advanced topics. 
          Test both theoretical knowledge and practical application.
          Ensure questions progress logically from basic to more complex.`;
        }
      };

      // NEW: Generate focus area instructions
      const getFocusInstructions = (focusArea) => {
        switch (focusArea) {
          case 'frameworks':
            return `Emphasize framework-specific concepts, library usage, ecosystem tools, 
          and framework best practices. Include questions about popular frameworks relevant to the role.
          Focus on React, Angular, Vue, or other relevant frameworks.`;

          case 'algorithms':
            return `Focus heavily on data structures, algorithms, complexity analysis, 
          problem-solving approaches, and computational thinking.
          Include questions about Big O notation, sorting, searching, and optimization.`;

          case 'system-design':
            return `Emphasize system architecture, scalability patterns, distributed systems, 
          database design, and high-level design decisions.
          Focus on microservices, load balancing, caching, and system trade-offs.`;

          case 'practical':
            return `Focus on real-world implementation scenarios, debugging approaches, 
          best practices, code quality, and practical development challenges.
          Include questions about testing, deployment, monitoring, and maintenance.`;

          case 'full-coverage':
          default:
            return `Cover all technical areas relevant to the role with balanced emphasis. 
          Include a mix of theoretical and practical questions across all domains.`;
        }
      };

      const complexityInstructions = getComplexityInstructions(complexity);
      const focusInstructions = getFocusInstructions(focusArea);

      const prompt = `Generate ${count} multiple choice questions (MCQs) for a technical interview for the role of "${role}".

COMPLEXITY MODE: ${complexity}
${complexityInstructions}

TECHNICAL FOCUS: ${focusArea}
${focusInstructions}

Format your response as a JSON object with a "questions" array containing ${count} question objects.
Each question object should have:
- "id": A unique string identifier
- "level": Difficulty level ("easy", "medium", or "hard")
- "text": The question text
- "options": Array of 4 possible answers (strings)
- "correctAnswer": The correct answer string (must be one of the options)
- "seconds": Time in seconds allowed for this question

Use the candidate's resume to make relevant questions based on their experience:
${resumeText.slice(0, 1000)}

Distribution should follow:
${questionDistribution.map(d => `${d.count} ${d.level} questions (${d.seconds} seconds each)`).join(', ')}

IMPORTANT INSTRUCTIONS:
1. Make questions highly relevant to the selected role: ${role}
2. Apply the complexity preference: ${complexity}
3. Emphasize the focus area: ${focusArea}
4. If complexity is "resume-focused", create questions that specifically test technologies and experiences mentioned in the resume
5. Ensure questions test practical knowledge, not just memorization
6. Include scenario-based questions when appropriate
7. Make sure all options are plausible to avoid obvious answers
8. For advanced complexity, include edge cases and optimization considerations
9. For fundamentals complexity, focus on core concepts and basic implementations

Return ONLY valid JSON without explanation or markdown formatting.`;

      const r = await model.generateContent(prompt);
      const responseText = r.response.text();

      // Extract JSON from response (handling potential markdown code blocks)
      let jsonStr = responseText.replace(/```json|```/g, '').trim();

      // Parse the JSON
      const parsedResponse = JSON.parse(jsonStr);

      if (Array.isArray(parsedResponse.questions) && parsedResponse.questions.length) {
        // Ensure each question has the required fields and validate structure
        const validatedQuestions = parsedResponse.questions.map((q, idx) => ({
          id: q.id || `mcq-${complexity}-${focusArea}-${idx}`,
          level: q.level || 'medium',
          text: q.text,
          options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer,
          seconds: q.seconds || 30,
          // NEW: Add metadata about settings used
          metadata: {
            complexity,
            focusArea,
            role,
            generatedAt: new Date().toISOString()
          }
        }));

        console.log(`✅ Generated ${validatedQuestions.length} questions with complexity: ${complexity}, focus: ${focusArea}`);
        return { questions: validatedQuestions };
      }
    } catch (e) {
      console.error('Error generating enhanced MCQ questions:', e);
    }

    // Fallback to predefined questions with some basic filtering based on settings
    console.log('🔄 Using fallback questions with settings-based filtering');
    let qs = pickMCQQuestions(questionDistribution);

    // Simple fallback enhancement based on complexity
    if (complexity === 'fundamentals') {
      // Prefer easier questions from the fallback bank
      qs = qs.map(q => ({ ...q, seconds: Math.max(q.seconds - 10, 20) }));
    } else if (complexity === 'advanced') {
      // Give more time for harder questions
      qs = qs.map(q => ({ ...q, seconds: q.seconds + 15 }));
    }

    return { questions: qs };
  },

  async scoreAnswers({ questions, answers }) {
    // Calculate completion ratio - percentage of questions that were answered
    const totalQuestions = questions.length;
    const answeredQuestions = answers.length;
    const completionRatio = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;

    // Create a map of answers by questionId for easier lookup
    const answersMap = {};
    answers.forEach(answer => {
      if (answer.questionId) {
        answersMap[answer.questionId] = answer;
      }
    });

    // Function to apply completion penalty to the raw score
    const applyCompletionPenalty = (rawScore) => {
      // Apply a scaled penalty based on completion ratio
      // If completionRatio is 1.0 (100%), no penalty
      // If completionRatio is 0.0 (0%), score is capped at a very low value

      // This formula ensures:
      // - 100% completion: full score (no penalty)
      // - 75% completion: penalty of about 20% 
      // - 50% completion: penalty of about 40%
      // - 25% completion: penalty of about 70%
      // - <10% completion: very significant penalty (>90%)

      const completionPenaltyFactor = Math.pow(completionRatio, 1.5);
      const adjustedScore = Math.round(rawScore * completionPenaltyFactor);

      return adjustedScore;
    };

    // Non-AI fallback scoring logic
    if (!genAI) {
      // Naive heuristic scoring fallback 
      const perAnswer = answers.map((a) => ({ score: Math.min(10, Math.max(0, Math.round((a.answer?.length || 0) / 50))), explanation: 'Heuristic length-based score.' }));
      const rawTotal = Math.round((perAnswer.reduce((s, a) => s + a.score, 0) / (Math.max(1, answers.length) * 10)) * 100) || 0;

      // Apply completion penalty
      const adjustedTotal = applyCompletionPenalty(rawTotal);

      // Add explanation about completion penalty if applicable
      let summary = 'Auto-generated summary (fallback). Candidate provided answers evaluated heuristically.';
      if (completionRatio < 1.0) {
        summary += ` Only ${Math.round(completionRatio * 100)}% of questions were answered, which reduced the final score.`;
      }

      return {
        perAnswer,
        totalScore: adjustedTotal,
        summary,
        completionRatio: Math.round(completionRatio * 100)
      };
    }

    // AI-based scoring
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Strict JSON only. Score each answer 0-10 with explanation. Also return final totalScore(0-100) and 3-4 line summary.
Important: Consider that the candidate answered ${answeredQuestions} out of ${totalQuestions} questions (${Math.round(completionRatio * 100)}% completion rate).
Format: { perAnswer:[{score, explanation}], totalScore, summary }
Questions:${JSON.stringify(questions)}
Answers:${JSON.stringify(answers)}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await model.generateContent(prompt);
        const text = r.response.text();
        const json = JSON.parse(text.replace(/```json|```/g, ''));

        if (json?.perAnswer && typeof json.totalScore === 'number') {
          // Apply completion penalty to the AI-provided score
          const rawScore = json.totalScore;
          const adjustedScore = applyCompletionPenalty(rawScore);

          // Update the summary to reflect the completion penalty if needed
          let updatedSummary = json.summary || '';
          if (completionRatio < 1.0 && adjustedScore < rawScore) {
            updatedSummary += ` Note: Score adjusted from ${rawScore} to ${adjustedScore} because only ${Math.round(completionRatio * 100)}% of questions were answered.`;
          }

          return {
            ...json,
            totalScore: adjustedScore,
            summary: updatedSummary,
            completionRatio: Math.round(completionRatio * 100)
          };
        }
      } catch (e) {
        await sleep(300 * (attempt + 1));
      }
    }

    // Fallback if AI fails
    const perAnswer = answers.map((a) => ({ score: 5, explanation: 'Fallback score.' }));
    const rawTotal = Math.round((perAnswer.reduce((s, a) => s + a.score, 0) / (Math.max(1, answers.length) * 10)) * 100) || 0;
    const adjustedTotal = applyCompletionPenalty(rawTotal);

    let summary = 'Fallback summary due to AI unavailability.';
    if (completionRatio < 1.0) {
      summary += ` Only ${Math.round(completionRatio * 100)}% of questions were answered, which reduced the final score.`;
    }

    return {
      perAnswer,
      totalScore: adjustedTotal,
      summary,
      completionRatio: Math.round(completionRatio * 100)
    };
  },
};
