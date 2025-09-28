import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiService } from '../services/aiService.js';

const initialState = {
  inProgress: false,
  paused: false,
  status: 'idle', // idle | in_progress | completed
  profile: { name: '', email: '', phone: '' },
  resume: { text: '', fileName: '', fileType: '', fileDataUrl: '' },
  questions: [],
  currentQuestionIndex: 0,
  answers: [], // { questionId, answer, secondsSpent, score, explanation }
  finalScore: null,
  finalSummary: '',
};

export const generateQuestions = createAsyncThunk(
  'interviewee/generateQuestions',
  async (_, { getState, rejectWithValue }) => {
    const { interviewee } = getState();
    try {
      const res = await aiService.generateQuestions({
        role: 'full-stack engineer',
        levels: [
          { level: 'easy', count: 2, seconds: 20 },
          { level: 'medium', count: 2, seconds: 60 },
          { level: 'hard', count: 2, seconds: 120 },
        ],
        resumeText: interviewee.resume.text,
      });
      return res;
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to generate questions');
    }
  }
);

export const scoreAnswers = createAsyncThunk(
  'interviewee/scoreAnswers',
  async (_, { getState, rejectWithValue }) => {
    const { interviewee } = getState();
    try {
      const res = await aiService.scoreAnswers({
        questions: interviewee.questions,
        answers: interviewee.answers,
      });
      return res; // { perAnswer: [{score, explanation}], totalScore, summary }
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to score answers');
    }
  }
);

const intervieweeSlice = createSlice({
  name: 'interviewee',
  initialState,
  reducers: {
    setProfile(state, action) {
      state.profile = { ...state.profile, ...action.payload };
    },
    setResume(state, action) {
      state.resume = { ...state.resume, ...action.payload };
    },
    startInterview(state) {
      state.inProgress = true;
      state.paused = false;
      state.status = 'in_progress';
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.finalScore = null;
      state.finalSummary = '';
    },
    resumeInterview(state) {
      state.paused = false;
    },
    pauseInterview(state) {
      state.paused = true;
    },
    recordAnswer(state, action) {
      const { questionId, answer, secondsSpent } = action.payload;
      const idx = state.answers.findIndex((a) => a.questionId === questionId);
      if (idx >= 0) {
        state.answers[idx] = { ...state.answers[idx], answer, secondsSpent };
      } else {
        state.answers.push({ questionId, answer, secondsSpent });
      }
    },
    nextQuestion(state) {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    setQuestions(state, action) {
      state.questions = action.payload;
    },
    completeInterview(state, action) {
      const { totalScore, summary, perAnswer } = action.payload || {};
      state.status = 'completed';
      state.inProgress = false;
      state.paused = false;
      state.finalScore = totalScore ?? null;
      state.finalSummary = summary ?? '';
      if (Array.isArray(perAnswer)) {
        state.answers = state.answers.map((a, i) => ({ ...a, ...perAnswer[i] }));
      }
    },
    resetInterview(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQuestions.pending, (state) => {
        state.status = 'in_progress';
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.questions = action.payload.questions;
      })
      .addCase(generateQuestions.rejected, (state) => {})
      .addCase(scoreAnswers.fulfilled, (state, action) => {
        const { perAnswer, totalScore, summary } = action.payload;
        state.finalScore = totalScore;
        state.finalSummary = summary;
        if (Array.isArray(perAnswer)) {
          state.answers = state.answers.map((a, i) => ({ ...a, ...perAnswer[i] }));
        }
      });
  },
});

export const {
  setProfile,
  setResume,
  startInterview,
  resumeInterview,
  pauseInterview,
  recordAnswer,
  nextQuestion,
  setQuestions,
  completeInterview,
  resetInterview,
} = intervieweeSlice.actions;

export default intervieweeSlice.reducer;
