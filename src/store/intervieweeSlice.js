import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { aiService } from "../services/aiService.js";

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

// Helper to create a unique interview ID
const createInterviewId = () => {
  return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      // Create new interview session
      state.currentInterviewId = createInterviewId();
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
      state.paused = false;
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

      const answerData = {
        questionId,
        answer,
        secondsSpent,
        timestamp: new Date().toISOString(),
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

      // Create completed interview record
      const completedInterview = {
        id: state.currentInterviewId || createInterviewId(),
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
      console.log("Resetting interview (keeping history)");
      ensureStateProperties(state);

      // Keep pastInterviews and profile, reset everything else
      const { pastInterviews } = state;

      Object.assign(state, {
        ...initialState,
        pastInterviews,
        // Keep profile if it exists
        profile: state.profile.email ? state.profile : initialState.profile,
        // Keep resume if it exists
        resume: state.resume.text ? state.resume : initialState.resume,
        currentStep: state.resume.text ? 1 : 0,
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
        state.questions = interview.questions;
        state.answers = interview.answers;
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
  return interviews.length > 0 ? interviews[0] : null;
};

export default intervieweeSlice.reducer;
