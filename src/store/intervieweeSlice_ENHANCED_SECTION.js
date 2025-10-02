// ENHANCED SECTION FOR intervieweeSlice.js
// Replace the existing generateQuestions thunk with this enhanced version

export const generateQuestions = createAsyncThunk(
  "interviewee/generateQuestions",
  async (_, { getState, rejectWithValue }) => {
    const { interviewee, settings } = getState();
    try {
      console.log("🤖 Generating questions for role:", settings?.role || "full-stack engineer");
      console.log("⚙️ Enhanced settings:", settings);

      // NEW: Dynamic question distribution based on duration
      const getQuestionDistributionByDuration = (duration) => {
        if (duration <= 10) {
          return [
            { level: "easy", count: 2, seconds: 30 },
            { level: "medium", count: 3, seconds: 45 },
            { level: "hard", count: 1, seconds: 60 },
          ]; // 6 questions for short interviews
        } else if (duration <= 20) {
          return [
            { level: "easy", count: 4, seconds: 30 },
            { level: "medium", count: 4, seconds: 45 },
            { level: "hard", count: 2, seconds: 60 },
          ]; // 10 questions (current default)
        } else {
          return [
            { level: "easy", count: 5, seconds: 30 },
            { level: "medium", count: 6, seconds: 45 },
            { level: "hard", count: 4, seconds: 60 },
          ]; // 15 questions for comprehensive interviews
        }
      };

      // NEW: Adjust question distribution based on complexity preference
      const adjustForComplexity = (distribution, complexity) => {
        if (complexity === 'fundamentals') {
          // More easy questions, fewer hard ones
          return distribution.map(level => {
            if (level.level === 'easy') return { ...level, count: level.count + 1 };
            if (level.level === 'hard') return { ...level, count: Math.max(1, level.count - 1) };
            return level;
          });
        } else if (complexity === 'advanced') {
          // More hard questions, fewer easy ones
          return distribution.map(level => {
            if (level.level === 'easy') return { ...level, count: Math.max(1, level.count - 1) };
            if (level.level === 'hard') return { ...level, count: level.count + 1 };
            return level;
          });
        }
        return distribution; // balanced or resume-focused use default distribution
      };

      // NEW: Calculate question distribution based on settings
      const baseDuration = settings?.duration || 10;
      const complexity = settings?.complexity || 'balanced';
      const focusArea = settings?.focusArea || 'full-coverage';
      
      let questionDistribution = getQuestionDistributionByDuration(baseDuration);
      questionDistribution = adjustForComplexity(questionDistribution, complexity);

      const totalQuestions = questionDistribution.reduce((total, level) => total + level.count, 0);

      console.log(`📊 Question distribution for ${baseDuration}min interview:`, questionDistribution);
      console.log(`🎯 Total questions: ${totalQuestions}`);
      console.log(`🔧 Complexity mode: ${complexity}, Focus: ${focusArea}`);

      const res = await aiService.generateMCQQuestions({
        role: settings?.role || "full-stack engineer",
        count: totalQuestions,
        questionDistribution,
        complexity, // NEW: Pass complexity to AI service
        focusArea,  // NEW: Pass focus area to AI service
        resumeText: interviewee.resume.text,
      });

      console.log("✅ Generated questions:", res.questions.length);
      return res;
    } catch (e) {
      console.error("❌ Failed to generate questions:", e);
      return rejectWithValue(e.message || "Failed to generate questions");
    }
  },
);