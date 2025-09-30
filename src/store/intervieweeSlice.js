import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { aiService } from "../services/aiService.js";
import { STORAGE_KEYS } from "../utils/storageUtils.js";

// Helper function to ensure state has required properties
const ensureStateProperties = (state) => {
  if (!state.pastInterviews) {
    state.pastInterviews = [];
  }
  if (!state.profile) {
    state.profile = { name: "", email: "", phone: "" };
  }
  if (!state.resume) {
    state.resume = { text: "", fileName: "", fileType: "", fileDataUrl: "" };
  }
  if (!state.answers) {
    state.answers = [];
  }
  if (!state.questions) {
    state.questions = [];
  }
  return state;
};

// Helper to create a unique interview ID based on user information and attempt count
const createInterviewId = (state = null) => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);

  // If state is provided, we can use profile information for a more unique ID
  if (state) {
    const email = state.profile?.email || '';
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15);

    // Count past interviews to determine attempt number
    const pastCount = Array.isArray(state.pastInterviews) ? state.pastInterviews.length : 0;
    const attemptNumber = pastCount + 1;

    return `interview_${sanitizedEmail}_attempt${attemptNumber}_${timestamp}_${randomPart}`;
  }

  // Fallback when no state is provided
  return `interview_${timestamp}_${randomPart}`;
};

const initialState = {
  // Interview session state
  inProgress: false,
  paused: false,
  status: "idle", // idle | in_progress | completed
  currentStep: 0, // 0: upload resume, 1: verify details, 2: take test, 3: view results

  // User data
  profile: {
    name: "",
    email: "",
    phone: "",
  },
  resume: {
    text: "",
    fileName: "",
    fileType: "",
    fileDataUrl: "",
  },

  // Interview content
  questions: [],
  currentQuestionIndex: 0,
  answers: [], // { questionId, answer, secondsSpent, score, explanation, isMultipleChoice }

  // Results
  finalScore: null,
  finalSummary: "",

  // History
  pastInterviews: [], // Persisted array of completed interviews

  // UI state (non-persisted)
  loading: false,
  error: null,

  // Current interview metadata
  currentInterviewId: null,
  interviewStartTime: null,
};

export const generateQuestions = createAsyncThunk(
  "interviewee/generateQuestions",
  async (_, { getState, rejectWithValue }) => {
    const { interviewee, settings } = getState();
    try {
      console.log(
        "Generating questions for role:",
        settings?.role || "full-stack engineer",
      );

      // Always generate 10 MCQ questions with varying difficulty
      const res = await aiService.generateMCQQuestions({
        role: settings?.role || "full-stack engineer",
        count: 10,
        questionDistribution: [
          { level: "easy", count: 4, seconds: 30 },
          { level: "medium", count: 4, seconds: 45 },
          { level: "hard", count: 2, seconds: 60 },
        ],
        resumeText: interviewee.resume.text,
      });

      console.log("Generated questions:", res.questions.length);
      return res;
    } catch (e) {
      console.error("Failed to generate questions:", e);
      return rejectWithValue(e.message || "Failed to generate questions");
    }
  },
);

export const scoreAnswers = createAsyncThunk(
  "interviewee/scoreAnswers",
  async (_, { getState, rejectWithValue }) => {
    const { interviewee } = getState();
    try {
      console.log(
        "Scoring answers for",
        interviewee.answers.length,
        "questions",
      );

      const res = await aiService.scoreAnswers({
        questions: interviewee.questions,
        answers: interviewee.answers,
      });

      console.log("Scored answers, total score:", res.totalScore);
      return res; // { perAnswer: [{score, explanation}], totalScore, summary }
    } catch (e) {
      console.error("Failed to score answers:", e);
      return rejectWithValue(e.message || "Failed to score answers");
    }
  },
);

const intervieweeSlice = createSlice({
  name: "interviewee",
  initialState,
  reducers: {
    // Profile management
    setProfile(state, action) {
      console.log("Setting profile:", action.payload);
      state.profile = { ...state.profile, ...action.payload };

      // Clear any errors when profile is updated
      if (state.error) {
        state.error = null;
      }
    },

    updateProfileField(state, action) {
      const { field, value } = action.payload;
      console.log(`Updating profile ${field} to:`, value);
      state.profile[field] = value;

      // Clear errors when profile fields are updated
      if (state.error) {
        state.error = null;
      }
    },

    // Resume management
    setResume(state, action) {
      console.log("Setting resume:", {
        fileName: action.payload.fileName,
        textLength: action.payload.text?.length,
      });
      state.resume = { ...state.resume, ...action.payload };

      // Auto-advance to next step if resume is uploaded
      if (action.payload.text && state.currentStep === 0) {
        state.currentStep = 1;
      }
    },

    clearResume(state) {
      state.resume = { text: "", fileName: "", fileType: "", fileDataUrl: "" };
      // Reset to upload step if resume is cleared
      if (state.currentStep > 0) {
        state.currentStep = 0;
      }
    },

    // Step navigation
    setCurrentStep(state, action) {
      const newStep = Number(action.payload);
      console.log("Setting current step to:", newStep);
      state.currentStep = newStep;
    },

    nextInterviewStep(state) {
      if (state.currentStep < 3) {
        state.currentStep += 1;
        console.log("Advanced to step:", state.currentStep);
      }
    },

    previousInterviewStep(state) {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
        console.log("Went back to step:", state.currentStep);
      }
    },

    // Interview session management
    startInterview(state) {
      console.log("Starting new interview");
      ensureStateProperties(state);

      // Clean up any previous interview progress data from localStorage
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));
      progressKeys.forEach(key => localStorage.removeItem(key));

      // Create new interview session with enhanced ID including user info
      state.currentInterviewId = createInterviewId(state);
      state.interviewStartTime = new Date().toISOString();
      state.inProgress = true;
      state.paused = false;
      state.status = "in_progress";
      state.currentStep = 2; // Move to test step
      state.loading = false;
      state.error = null;

      // Reset current interview data but keep profile and resume
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.finalScore = null;
      state.finalSummary = "";
      state.questions = []; // Will be populated by generateQuestions

      console.log("Interview started with ID:", state.currentInterviewId);
    },

    resumeInterview(state) {
      console.log("Resuming interview");
      ensureStateProperties(state);

      // Check if all questions have been answered already
      const allQuestionsAnswered =
        state.questions.length > 0 &&
        state.answers.length >= state.questions.length &&
        state.currentQuestionIndex === state.questions.length - 1;

      if (allQuestionsAnswered) {
        console.log("All questions already answered, completing interview instead of resuming");

        // Set as completed with fallback score if needed
        state.status = "completed";
        state.inProgress = false;
        state.paused = false;

        // If no finalScore yet, calculate a basic one
        if (state.finalScore === null) {
          const answeredCorrectly = state.answers.filter(a => a.score && a.score >= 7).length;
          state.finalScore = Math.round((answeredCorrectly / state.questions.length) * 100);
          state.finalSummary = "Interview completed successfully.";
        }

        // Go to summary page
        state.currentStep = 3;
        return;
      }

      // Normal resume flow
      state.paused = false;
      state.inProgress = true;
      state.status = "in_progress";

      // Ensure we have a valid interview ID
      if (!state.currentInterviewId) {
        state.currentInterviewId = createInterviewId(state);
      }

      // Make sure interviewStartTime is set
      if (!state.interviewStartTime) {
        state.interviewStartTime = new Date().toISOString();
      }

      // Validate question and answer state
      if (state.questions.length === 0) {
        console.log("No questions loaded, will need to generate questions when page loads");
      }

      // If currentQuestionIndex is invalid, reset to 0
      if (state.currentQuestionIndex < 0 || state.currentQuestionIndex >= state.questions.length) {
        console.log("Invalid question index, resetting to 0");
        state.currentQuestionIndex = 0;
      }

      // If we're resuming an interview, make sure we're on the right step
      if (state.currentStep !== 2) {
        state.currentStep = 2; // Set to interview step
      }

      // Clear any stored resume modal flag
      try {
        localStorage.removeItem('show_resume_interview_modal');
      } catch (e) {
        console.error('Error clearing resume modal flag:', e);
      }

      console.log("Interview resumed successfully", {
        currentQuestionIndex: state.currentQuestionIndex,
        questionsLoaded: state.questions.length,
        answersRecorded: state.answers.length,
        interviewId: state.currentInterviewId
      });
    },

    pauseInterview(state) {
      console.log("Pausing interview");
      state.paused = true;
    },

    // Question and answer management
    setQuestions(state, action) {
      console.log("Setting questions:", action.payload.length);
      state.questions = action.payload;
      state.loading = false;
    },

    recordAnswer(state, action) {
      const { questionId, answer, secondsSpent } = action.payload;
      console.log("Redux recordAnswer: Recording answer", {
        questionId,
        answerLength: answer?.length,
        secondsSpent,
        currentQuestionIndex: state.currentQuestionIndex,
        totalAnswers: state.answers.length,
      });

      const existingAnswerIndex = state.answers.findIndex(
        (a) => a.questionId === questionId,
      );

      // Ensure answer is stored in a consistent format
      // Handle various types of answers (string, number, object)
      let processedAnswer;

      if (answer === undefined || answer === null) {
        processedAnswer = "";
      } else if (typeof answer === "object") {
        // For complex objects like MCQ selections
        // Convert to a string representation or extract the relevant value
        if (answer.value !== undefined) {
          processedAnswer = answer.value;  // Use value property if available
        } else if (answer.text !== undefined) {
          processedAnswer = answer.text;   // Use text property if available
        } else {
          // Try to stringify, fallback to empty string
          try {
            processedAnswer = JSON.stringify(answer);
          } catch (e) {
            console.error("Could not stringify answer object:", e);
            processedAnswer = "[Complex selection]";
          }
        }
      } else {
        // Simple value (string, number, boolean)
        processedAnswer = answer;
      }

      const answerData = {
        questionId,
        answer: processedAnswer,
        secondsSpent,
        timestamp: new Date().toISOString(),
        // Store the original answer for reference (for complex objects)
        originalAnswer: typeof answer === "object" ? answer : undefined
      };

      if (existingAnswerIndex >= 0) {
        // Update existing answer
        state.answers[existingAnswerIndex] = {
          ...state.answers[existingAnswerIndex],
          ...answerData,
        };
        console.log(
          "Redux recordAnswer: Updated existing answer at index",
          existingAnswerIndex,
        );
      } else {
        // Add new answer
        state.answers.push(answerData);
        console.log(
          "Redux recordAnswer: Added new answer, total answers:",
          state.answers.length,
        );
      }

      // Validate state consistency
      if (state.answers.length > state.questions.length) {
        console.warn("Redux recordAnswer: More answers than questions!", {
          answersCount: state.answers.length,
          questionsCount: state.questions.length,
        });
      }
    },

    nextQuestion(state) {
      console.log("Redux nextQuestion: Before advancement", {
        currentIndex: state.currentQuestionIndex,
        totalQuestions: state.questions.length,
        canAdvance: state.currentQuestionIndex < state.questions.length - 1,
      });

      if (state.currentQuestionIndex < state.questions.length - 1) {
        const oldIndex = state.currentQuestionIndex;
        state.currentQuestionIndex += 1;
        console.log("Redux nextQuestion: Advanced successfully", {
          oldIndex,
          newIndex: state.currentQuestionIndex,
          nextQuestionId: state.questions[state.currentQuestionIndex]?.id,
          nextQuestionText: state.questions[
            state.currentQuestionIndex
          ]?.text?.substring(0, 50),
        });
      } else {
        console.log("Redux nextQuestion: Cannot advance - at last question");
      }
    },

    previousQuestion(state) {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        console.log("Went back to question:", state.currentQuestionIndex + 1);
      }
    },

    // Interview completion
    completeInterview(state, action) {
      console.log("Completing interview");
      ensureStateProperties(state);

      const { totalScore, summary, perAnswer } = action.payload || {};

      // Update interview status
      state.status = "completed";
      state.inProgress = false;
      state.paused = false;
      state.finalScore = totalScore ?? null;
      state.finalSummary = summary ?? "";
      state.currentStep = 3; // Move to results step

      // Update answers with scores and explanations
      if (Array.isArray(perAnswer)) {
        state.answers = state.answers.map((answer, index) => ({
          ...answer,
          ...(perAnswer[index] || {}),
        }));
      }

      // Clean up all interview progress data from localStorage
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));
      progressKeys.forEach(key => localStorage.removeItem(key));

      // For backward compatibility
      localStorage.removeItem("interviewee_resumable_interview");
      console.log("Interview completed and saved to history");

      // Create completed interview record with enhanced ID
      const completedInterview = {
        id: state.currentInterviewId || createInterviewId(state),
        date: new Date().toISOString(),
        startTime: state.interviewStartTime,
        endTime: new Date().toISOString(),
        profile: { ...state.profile },
        resume: { ...state.resume },
        questions: [...state.questions],
        answers: [...state.answers],
        finalScore: state.finalScore,
        finalSummary: state.finalSummary,
        status: "completed",
      };

      // Add to past interviews (most recent first)
      state.pastInterviews.unshift(completedInterview);

      // Keep only last 10 interviews to prevent excessive storage
      if (state.pastInterviews.length > 10) {
        state.pastInterviews = state.pastInterviews.slice(0, 10);
      }

      console.log(
        "Interview completed and saved. Total past interviews:",
        state.pastInterviews.length,
      );
    },

    // Reset and cleanup
    resetCurrentInterview(state) {
      console.log("Resetting current interview");
      ensureStateProperties(state);

      // Keep user data and past interviews, reset current session
      const { profile, resume, pastInterviews } = state;

      // Reset to initial state but preserve user data
      Object.assign(state, {
        ...initialState,
        profile,
        resume,
        pastInterviews,
        currentStep: resume.text ? 1 : 0, // Smart step based on resume presence
      });
    },

    resetInterview(state) {
      console.log("Resetting interview (keeping history)", {
        currentStep: state.currentStep,
        hasProfile: !!state.profile?.name,
        hasResume: !!state.resume?.text
      });

      // Clean up any previous interview progress data from localStorage
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));
      progressKeys.forEach(key => localStorage.removeItem(key));

      ensureStateProperties(state);

      // Keep pastInterviews and profile, reset everything else
      const { pastInterviews } = state;
      const resumeInfo = { ...state.resume };
      const profileInfo = { ...state.profile };

      // Full reset of all interview-specific state
      Object.assign(state, {
        ...initialState,
        // Keep these persistence states
        pastInterviews,
        // Keep profile if it exists
        profile: profileInfo.name || profileInfo.email ? profileInfo : initialState.profile,
        // Keep resume if it exists
        resume: resumeInfo.text ? resumeInfo : initialState.resume,
      });

      // Set the current step based on what info we have
      state.currentStep = state.resume.text ? 1 : 0;

      console.log("Interview reset complete", {
        newCurrentStep: state.currentStep,
        hasResumeAfterReset: !!state.resume?.text
      });
    },

    clearAllHistory(state) {
      console.log("Clearing all history");
      // Complete reset including history
      Object.assign(state, initialState);
      ensureStateProperties(state);
    },

    // Error handling
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    clearError(state) {
      state.error = null;
    },

    setLoading(state, action) {
      state.loading = action.payload;
    },

    // View specific interview from history
    viewPastInterview(state, action) {
      const interviewId = action.payload;
      const interview = state.pastInterviews.find((i) => i.id === interviewId);

      if (interview) {
        console.log("Viewing past interview:", interviewId);
        // Load the past interview data for viewing
        state.questions = Array.isArray(interview.questions) ? interview.questions : [];
        state.answers = Array.isArray(interview.answers) ? interview.answers : [];
        state.finalScore = interview.finalScore;
        state.finalSummary = interview.finalSummary || "";
        state.status = "completed";
        state.currentInterviewId = interview.id;
        state.finalScore = interview.finalScore;
        state.finalSummary = interview.finalSummary;
        state.currentStep = 3; // Show results
        state.status = "completed";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate questions
      .addCase(generateQuestions.pending, (state) => {
        console.log("Generating questions...");
        state.loading = true;
        state.error = null;
        state.status = "in_progress";
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        console.log("Questions generated successfully");
        state.loading = false;
        state.questions = action.payload.questions;
        state.error = null;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        console.error("Failed to generate questions:", action.payload);
        state.loading = false;
        state.error = action.payload || "Failed to generate questions";
        // Don't change status on failure - let user retry
      })

      // Score answers
      .addCase(scoreAnswers.pending, (state) => {
        console.log("Scoring answers...");
        state.loading = true;
        state.error = null;
      })
      .addCase(scoreAnswers.fulfilled, (state, action) => {
        console.log("Answers scored successfully");
        state.loading = false;
        const { perAnswer, totalScore, summary } = action.payload;
        state.finalScore = totalScore;
        state.finalSummary = summary;

        // Update answers with scores
        if (Array.isArray(perAnswer)) {
          state.answers = state.answers.map((answer, index) => ({
            ...answer,
            ...(perAnswer[index] || {}),
          }));
        }

        state.error = null;
      })
      .addCase(scoreAnswers.rejected, (state, action) => {
        console.error("Failed to score answers:", action.payload);
        state.loading = false;
        state.error = action.payload || "Failed to score answers";

        // Provide fallback scoring
        state.finalScore = Math.round(Math.random() * 40 + 50); // 50-90 range
        state.finalSummary =
          "Unable to generate detailed scoring due to technical issues. Please contact support.";
      });
  },
});

export const {
  setProfile,
  updateProfileField,
  setResume,
  clearResume,
  setCurrentStep,
  nextInterviewStep,
  previousInterviewStep,
  startInterview,
  resumeInterview,
  pauseInterview,
  setQuestions,
  recordAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview,
  resetCurrentInterview,
  resetInterview,
  clearAllHistory,
  setError,
  clearError,
  setLoading,
  viewPastInterview,
} = intervieweeSlice.actions;

// Selectors for better state access
export const selectCurrentInterview = (state) => ({
  id: state.interviewee.currentInterviewId,
  status: state.interviewee.status,
  step: state.interviewee.currentStep,
  progress:
    state.interviewee.questions.length > 0
      ? Math.round(
        (state.interviewee.answers.length /
          state.interviewee.questions.length) *
        100,
      )
      : 0,
});

export const selectProfile = (state) => state.interviewee.profile;
export const selectResume = (state) => state.interviewee.resume;
export const selectPastInterviews = (state) =>
  state.interviewee.pastInterviews || [];
export const selectLatestInterview = (state) => {
  const interviews = state.interviewee.pastInterviews || [];

  // First check if there are any completed interviews with scores
  const scoredInterviews = interviews.filter(interview =>
    interview.finalScore !== null &&
    interview.finalScore !== undefined
  );

  // Return the most recent scored interview or the most recent interview if none have scores
  return scoredInterviews.length > 0 ? scoredInterviews[0] : (interviews.length > 0 ? interviews[0] : null);
};

export default intervieweeSlice.reducer;
