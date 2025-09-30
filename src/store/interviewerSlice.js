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

      // Use the provided ID if it exists (which should be the interview ID)
      // Only generate a new ID if one wasn't provided
      let attemptId;
      if (candidateData.id) {
        attemptId = candidateData.id;
      } else {
        // Create a more robust and unique attemptId as fallback
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substr(2, 9);
        const sanitizedEmail = email ? email.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15) : 'unknown';
        attemptId = `interview_${sanitizedEmail}_${timestamp}_${randomPart}`;
      }

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

        // Use the existing attempts array without creating duplicates
        let attempts = [...candidate.attempts];

        // Update or add the current attempt, but don't add it twice
        if (attemptIndex >= 0) {
          // Update existing attempt
          attempts[attemptIndex] = {
            ...attempts[attemptIndex],
            ...candidateData,
            updatedAt: new Date().toISOString(),
          };
        }
        // The else case is not needed here - we already added to candidate.attempts above

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
      state.sortKey = action.payload.key;
      state.sortOrder = action.payload.order;
    },
    removeInProgressAttempt(state, action) {
      const { interviewId } = action.payload;
      if (!interviewId) return;

      state.candidates.forEach(candidate => {
        if (candidate.attempts) {
          const initialCount = candidate.attempts.length;
          candidate.attempts = candidate.attempts.filter(attempt => {
            // Keep the attempt if it's NOT the one we want to remove
            return !(attempt.id === interviewId && attempt.status === 'in_progress');
          });

          // If an attempt was removed, we might need to update the candidate's summary fields
          if (candidate.attempts.length < initialCount) {
            // Recalculate latest score and status from the remaining completed attempts
            const completedAttempts = candidate.attempts
              .filter(a => a.status === "Completed" && a.score != null)
              .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

            const latestCompleted = completedAttempts[0] || null;
            candidate.latestScore = latestCompleted ? latestCompleted.score : null;

            // Recalculate latest status from all remaining attempts
            const allAttempts = candidate.attempts
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            const latestAttempt = allAttempts[0] || null;
            candidate.latestStatus = latestAttempt ? latestAttempt.status : 'No attempts';
          }
        }
      });

      // Optional: Clean up candidates with no attempts left
      state.candidates = state.candidates.filter(c => c.attempts && c.attempts.length > 0);
    }
  },
});

export const { upsertCandidate, setSearch, setSort, removeInProgressAttempt } = interviewerSlice.actions;
export default interviewerSlice.reducer;
