// ENHANCED SECTION FOR aiService.js
// Replace the existing generateMCQQuestions function with this enhanced version

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
}