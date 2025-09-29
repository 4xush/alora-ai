import { createSlice } from '@reduxjs/toolkit';

const interviewerSlice = createSlice({
  name: 'interviewer',
  initialState: {
    candidates: [], // Now stores candidate profiles and their attempts
    search: '',
    sortKey: 'name',
    sortOrder: 'ascend',
  },
  reducers: {
    upsertCandidate(state, action) {
      const candidateData = action.payload;
      const email = candidateData.email;
      const attemptId = candidateData.id || Date.now().toString();

      // If we have an email, find candidate by email, otherwise use id
      const existingCandidateIndex = email
        ? state.candidates.findIndex(c => c.email === email)
        : state.candidates.findIndex(c => c.id === candidateData.id);

      if (existingCandidateIndex >= 0) {
        // Candidate exists, add/update attempt
        const candidate = state.candidates[existingCandidateIndex];

        // Initialize attempts array if it doesn't exist
        if (!candidate.attempts) {
          candidate.attempts = [];
        }

        // Check if this attempt already exists
        const attemptIndex = candidate.attempts.findIndex(a => a.id === attemptId);

        if (attemptIndex >= 0) {
          // Update existing attempt
          candidate.attempts[attemptIndex] = {
            ...candidate.attempts[attemptIndex],
            ...candidateData,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Add new attempt
          candidate.attempts.push({
            ...candidateData,
            id: attemptId,
            attemptNumber: candidate.attempts.length + 1,
            createdAt: new Date().toISOString(),
          });
        }

        // Find the latest attempt with a score (after this update)
        const attempts = [...candidate.attempts];
        if (attemptIndex >= 0) {
          attempts[attemptIndex] = {
            ...attempts[attemptIndex],
            ...candidateData,
            updatedAt: new Date().toISOString(),
          };
        } else {
          attempts.push({
            ...candidateData,
            id: attemptId,
            attemptNumber: candidate.attempts.length + 1,
            createdAt: new Date().toISOString(),
          });
        }

        // Get the most recent completed attempt with a score
        const completedAttempts = attempts
          .filter(a => a.status === "Completed" && a.score != null)
          .sort((a, b) => {
            const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
            const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
            return dateB - dateA; // Most recent first
          });

        const latestAttempt = completedAttempts.length > 0 ? completedAttempts[0] : null;

        // Update candidate profile info with truly latest score
        state.candidates[existingCandidateIndex] = {
          ...candidate,
          name: candidateData.name || candidate.name,
          email: email || candidate.email,
          phone: candidateData.phone || candidate.phone,
          attempts: attempts,
          latestScore: latestAttempt ? latestAttempt.score : candidate.latestScore,
          latestStatus: latestAttempt ? latestAttempt.status : (candidateData.status || candidate.latestStatus),
        };
      } else {
        // New candidate, create entry with first attempt
        const firstAttempt = {
          ...candidateData,
          id: attemptId,
          attemptNumber: 1,
          createdAt: new Date().toISOString(),
        };

        state.candidates.push({
          id: email || candidateData.id,
          name: candidateData.name,
          email: email,
          phone: candidateData.phone,
          latestScore: candidateData.score,
          latestStatus: candidateData.status,
          attempts: [firstAttempt]
        });
      }
    },
    setSearch(state, action) {
      state.search = action.payload;
    },
    setSort(state, action) {
      const { key, order } = action.payload;
      state.sortKey = key;
      state.sortOrder = order;
    },
  },
});

export const { upsertCandidate, setSearch, setSort } = interviewerSlice.actions;
export default interviewerSlice.reducer;
