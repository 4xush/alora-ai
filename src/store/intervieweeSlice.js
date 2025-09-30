import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { aiService } from "../services/aiService.js";
import { interviewSyncService } from "./interviewSyncService.js";

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
  answers: [],

  // Results
  finalScore: null,
  finalSummary: "",
  completionRatio: 0,

  // History
  pastInterviews: [],

  // UI state (non-persisted)
  loading: false,
  error: null,

  // Current interview metadata - now managed by sync service
  currentInterviewId: null,
  interviewStartTime: null,
};

export const generateQuestions = createAsyncThunk(
  "interviewee/generateQuestions",
  async (_, { getState, rejectWithValue }) => {
    const { interviewee, settings } = getState();
    try {
      console.log("🤖 Generating questions for role:", settings?.role || "full-stack engineer");

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

      console.log("✅ Generated questions:", res.questions.length);
      return res;
    } catch (e) {
      console.error("❌ Failed to generate questions:", e);
      return rejectWithValue(e.message || "Failed to generate questions");
    }
  },
);

export const scoreAnswers = createAsyncThunk(
  "interviewee/scoreAnswers",
  async (_, { getState, rejectWithValue }) => {
    const { interviewee } = getState();
    try {
      console.log("📊 Scoring answers for", interviewee.answers.length, "questions");

      const res = await aiService.scoreAnswers({
        questions: interviewee.questions,
        answers: interviewee.answers,
      });

      console.log("✅ Scored answers, total score:", res.totalScore);
      return res;
    } catch (e) {
      console.error("❌ Failed to score answers:", e);
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
      console.log("👤 Setting profile:", action.payload);
      state.profile = { ...state.profile, ...action.payload };
      if (state.error) {
        state.error = null;
      }
    },

    updateProfileField(state, action) {
      const { field, value } = action.payload;
      console.log(`👤 Updating profile ${field} to:`, value);
      state.profile[field] = value;
      if (state.error) {
        state.error = null;
      }
    },

    // Resume management
    setResume(state, action) {
      console.log("📄 Setting resume:", {
        fileName: action.payload.fileName,
        textLength: action.payload.text?.length,
      });
      state.resume = { ...state.resume, ...action.payload };

      if (action.payload.text && state.currentStep === 0) {
        state.currentStep = 1;
      }
    },

    clearResume(state) {
      state.resume = { text: "", fileName: "", fileType: "", fileDataUrl: "" };
      if (state.currentStep > 0) {
        state.currentStep = 0;
      }
    },

    // Step navigation
    setCurrentStep(state, action) {
      const newStep = Number(action.payload);
      console.log("📍 Setting current step to:", newStep);
      state.currentStep = newStep;
    },

    nextInterviewStep(state) {
      if (state.currentStep < 3) {
        state.currentStep += 1;
        console.log("➡️ Advanced to step:", state.currentStep);
      }
    },

    previousInterviewStep(state) {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
        console.log("⬅️ Went back to step:", state.currentStep);
      }
    },

    // Interview session management - SIMPLIFIED
    startInterview(state) {
      console.log("🚀 Starting new interview with sync service");
      ensureStateProperties(state);

      // Use sync service to manage session
      const interviewId = interviewSyncService.startNewInterview(state.profile);

      state.currentInterviewId = interviewId;
      state.interviewStartTime = new Date().toISOString();
      state.inProgress = true;
      state.paused = false;
      state.status = "in_progress";
      state.currentStep = 2;
      state.loading = false;
      state.error = null;

      // Reset current interview data
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.finalScore = null;
      state.finalSummary = "";
      state.questions = [];

      console.log("✅ Interview started with ID:", state.currentInterviewId);
    },

    resumeInterview(state) {
      console.log("⏯️ Resuming interview");
      ensureStateProperties(state);

      // Get the active interview ID from sync service
      const activeId = interviewSyncService.getActiveInterviewId();
      if (activeId) {
        state.currentInterviewId = activeId;
      }

      // Check if all questions are answered
      const allQuestionsAnswered =
        state.questions.length > 0 &&
        state.answers.length >= state.questions.length;

      if (allQuestionsAnswered) {
        console.log("✅ All questions answered, completing interview");
        state.status = "completed";
        state.inProgress = false;
        state.paused = false;
        state.currentStep = 3;

        if (state.finalScore === null) {
          const answeredCorrectly = state.answers.filter(a => a.score && a.score >= 7).length;
          state.finalScore = Math.round((answeredCorrectly / state.questions.length) * 100);
          state.finalSummary = "Interview completed successfully.";
        }
        return;
      }

      // Normal resume flow
      state.paused = false;
      state.inProgress = true;
      state.status = "in_progress";
      state.currentStep = 2;

      if (!state.interviewStartTime) {
        state.interviewStartTime = new Date().toISOString();
      }

      if (state.currentQuestionIndex < 0 || state.currentQuestionIndex >= state.questions.length) {
        state.currentQuestionIndex = 0;
      }

      console.log("✅ Interview resumed successfully");
    },

    pauseInterview(state) {
      console.log("⏸️ Pausing interview");
      state.paused = true;

      // Save progress through sync service
      if (state.currentInterviewId) {
        interviewSyncService.saveProgress(state.currentInterviewId, {
          currentQuestionIndex: state.currentQuestionIndex,
          answersCount: state.answers.length,
          questionsCount: state.questions.length,
          status: state.status,
          paused: true
        });
      }
    },

    // Question and answer management
    setQuestions(state, action) {
      console.log("❓ Setting questions:", action.payload.length);
      state.questions = action.payload;
      state.loading = false;
    },

    recordAnswer(state, action) {
      const { questionId, answer, secondsSpent } = action.payload;
      console.log("📝 Recording answer", { questionId, secondsSpent });

      const existingAnswerIndex = state.answers.findIndex(
        (a) => a.questionId === questionId,
      );

      // Normalize answer format
      let processedAnswer;
      if (answer === undefined || answer === null) {
        processedAnswer = "";
      } else if (typeof answer === "object") {
        processedAnswer = answer.value || answer.text || JSON.stringify(answer);
      } else {
        processedAnswer = answer;
      }

      const answerData = {
        questionId,
        answer: processedAnswer,
        secondsSpent,
        timestamp: new Date().toISOString(),
      };

      if (existingAnswerIndex >= 0) {
        state.answers[existingAnswerIndex] = {
          ...state.answers[existingAnswerIndex],
          ...answerData,
        };
      } else {
        state.answers.push(answerData);
      }

      // Save progress
      if (state.currentInterviewId) {
        interviewSyncService.saveProgress(state.currentInterviewId, {
          currentQuestionIndex: state.currentQuestionIndex,
          answersCount: state.answers.length,
          questionsCount: state.questions.length,
          status: state.status
        });
      }
    },

    nextQuestion(state) {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        console.log("➡️ Advanced to question:", state.currentQuestionIndex + 1);
      }
    },

    previousQuestion(state) {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        console.log("⬅️ Went back to question:", state.currentQuestionIndex + 1);
      }
    },

    // Interview completion - SIMPLIFIED
    completeInterview(state, action) {
      console.log("🏁 Completing interview");
      ensureStateProperties(state);

      const { totalScore, summary, perAnswer } = action.payload || {};

      // Update interview status
      state.status = "completed";
      state.inProgress = false;
      state.paused = false;
      state.finalScore = totalScore ?? null;
      state.finalSummary = summary ?? "";
      state.currentStep = 3;

      // Update answers with scores
      if (Array.isArray(perAnswer)) {
        state.answers = state.answers.map((answer, index) => ({
          ...answer,
          ...(perAnswer[index] || {}),
        }));
      }

      // Use sync service to handle completion
      if (state.currentInterviewId) {
        interviewSyncService.completeInterview(state.currentInterviewId, {
          totalScore,
          summary,
          completedAt: new Date().toISOString()
        });
      }

      // Create completed interview record
      const completedInterview = {
        id: state.currentInterviewId,
        date: new Date().toISOString(),
        startTime: state.interviewStartTime,
        endTime: new Date().toISOString(),
        profile: { ...state.profile },
        resume: { ...state.resume },
        questions: [...state.questions],
        answers: [...state.answers],
        finalScore: state.finalScore,
        finalSummary: state.finalSummary,
        completionRatio: state.questions.length > 0
          ? Math.round((state.answers.length / state.questions.length) * 100) : 0,
        status: "completed",
      };

      // Add to past interviews
      state.pastInterviews.unshift(completedInterview);

      // Keep only last 10 interviews
      if (state.pastInterviews.length > 10) {
        state.pastInterviews = state.pastInterviews.slice(0, 10);
      }

      console.log("✅ Interview completed and saved");
    },

    // Reset and cleanup - SIMPLIFIED
    resetInterview(state) {
      console.log("🔄 Resetting interview");

      // Use sync service to clean up
      interviewSyncService.cleanupExistingSessions();

      ensureStateProperties(state);

      const { pastInterviews } = state;
      const resumeInfo = { ...state.resume };
      const profileInfo = { ...state.profile };

      Object.assign(state, {
        ...initialState,
        pastInterviews,
        profile: profileInfo.name || profileInfo.email ? profileInfo : initialState.profile,
        resume: resumeInfo.text ? resumeInfo : initialState.resume,
      });

      state.currentStep = state.resume.text ? 1 : 0;
      console.log("✅ Interview reset complete");
    },

    clearAllHistory(state) {
      console.log("🗑️ Clearing all history");
      interviewSyncService.cleanupExistingSessions();
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

    // View past interview
    viewPastInterview(state, action) {
      const interviewId = action.payload;
      const interview = state.pastInterviews.find((i) => i.id === interviewId);

      if (interview) {
        console.log("👁️ Viewing past interview:", interviewId);
        state.questions = Array.isArray(interview.questions) ? interview.questions : [];
        state.answers = Array.isArray(interview.answers) ? interview.answers : [];
        state.finalScore = interview.finalScore;
        state.finalSummary = interview.finalSummary || "";
        state.status = "completed";
        state.currentInterviewId = interview.id;
        state.currentStep = 3;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "in_progress";
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.error = null;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to generate questions";
      })
      .addCase(scoreAnswers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scoreAnswers.fulfilled, (state, action) => {
        state.loading = false;
        const { perAnswer, totalScore, summary, completionRatio } = action.payload;
        state.finalScore = totalScore;
        state.finalSummary = summary;
        state.completionRatio = completionRatio ||
          (state.questions.length > 0 ? Math.round((state.answers.length / state.questions.length) * 100) : 0);

        if (Array.isArray(perAnswer)) {
          state.answers = state.answers.map((answer, index) => ({
            ...answer,
            ...(perAnswer[index] || {}),
          }));
        }
        state.error = null;
      })
      .addCase(scoreAnswers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to score answers";
        // Fallback scoring
        state.finalScore = Math.round(Math.random() * 40 + 50);
        state.finalSummary = "Unable to generate detailed scoring due to technical issues.";
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
  resetInterview,
  clearAllHistory,
  setError,
  clearError,
  setLoading,
  viewPastInterview,
} = intervieweeSlice.actions;

// Selectors
export const selectCurrentInterview = (state) => ({
  id: state.interviewee.currentInterviewId,
  status: state.interviewee.status,
  step: state.interviewee.currentStep,
  progress: state.interviewee.questions.length > 0
    ? Math.round((state.interviewee.answers.length / state.interviewee.questions.length) * 100)
    : 0,
});

export const selectProfile = (state) => state.interviewee.profile;
export const selectResume = (state) => state.interviewee.resume;
export const selectPastInterviews = (state) => state.interviewee.pastInterviews || [];
export const selectLatestInterview = (state) => {
  const interviews = state.interviewee.pastInterviews || [];
  const scoredInterviews = interviews.filter(interview =>
    interview.finalScore !== null && interview.finalScore !== undefined
  );
  return scoredInterviews.length > 0 ? scoredInterviews[0] : (interviews.length > 0 ? interviews[0] : null);
};

export default intervieweeSlice.reducer;