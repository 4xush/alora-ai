import { createSlice } from '@reduxjs/toolkit';
import { interviewSyncService } from './interviewSyncService.js';

const interviewerSlice = createSlice({
  name: 'interviewer',
  initialState: {
    candidates: [], // Simplified structure - one candidate can have multiple attempts
    search: '',
    sortKey: 'name',
    sortOrder: 'ascend',
  },
  reducers: {
    // SIMPLIFIED: Single action to sync interview state
    syncInterviewState(state, action) {
      const { interviewId, profile, status, additionalData = {} } = action.payload;
      
      console.log('🔄 Syncing interview state:', { interviewId, status });

      if (!interviewId || !profile?.email) {
        console.warn('❌ Invalid sync data - missing interviewId or profile email');
        return;
      }

      // Find existing candidate by email
      const existingCandidateIndex = state.candidates.findIndex(c => c.email === profile.email);
      
      if (existingCandidateIndex >= 0) {
        // Update existing candidate
        const candidate = state.candidates[existingCandidateIndex];
        
        // Initialize attempts if needed
        if (!candidate.attempts) {
          candidate.attempts = [];
        }

        // Find existing attempt by interview ID
        const attemptIndex = candidate.attempts.findIndex(a => a.id === interviewId);
        
        if (attemptIndex >= 0) {
          // Update existing attempt
          candidate.attempts[attemptIndex] = {
            ...candidate.attempts[attemptIndex],
            ...additionalData,
            id: interviewId,
            status: interviewSyncService.normalizeStatus(status),
            updatedAt: new Date().toISOString(),
          };
          console.log('✅ Updated existing attempt for candidate:', profile.email);
        } else {
          // Add new attempt
          candidate.attempts.push({
            id: interviewId,
            attemptNumber: candidate.attempts.length + 1,
            status: interviewSyncService.normalizeStatus(status),
            createdAt: new Date().toISOString(),
            ...additionalData,
          });
          console.log('✅ Added new attempt for existing candidate:', profile.email);
        }

        // Update candidate summary with latest completed attempt
        const completedAttempts = candidate.attempts
          .filter(a => a.status === "Completed" && a.score != null)
          .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0) - new Date(a.completedAt || a.updatedAt || 0));

        const latestCompleted = completedAttempts[0];
        if (latestCompleted) {
          candidate.latestScore = latestCompleted.score;
          candidate.latestStatus = latestCompleted.status;
        } else {
          // If no completed attempts, use the latest attempt status
          const latestAttempt = candidate.attempts
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
          candidate.latestStatus = latestAttempt?.status || 'No attempts';
        }

      } else {
        // Create new candidate
        const newAttempt = {
          id: interviewId,
          attemptNumber: 1,
          status: interviewSyncService.normalizeStatus(status),
          createdAt: new Date().toISOString(),
          ...additionalData,
        };

        state.candidates.push({
          id: profile.email, // Use email as unique candidate ID
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          latestScore: additionalData.score || null,
          latestStatus: interviewSyncService.normalizeStatus(status),
          attempts: [newAttempt]
        });
        console.log('✅ Created new candidate:', profile.email);
      }
    },

    // Clean up abandoned attempts (for when user abandons interview)
    removeAbandonedAttempt(state, action) {
      const { interviewId } = action.payload;
      
      console.log('🧹 Removing abandoned attempt:', interviewId);

      if (!interviewId) return;

      state.candidates.forEach(candidate => {
        if (candidate.attempts) {
          const initialCount = candidate.attempts.length;
          
          // Remove only in-progress attempts with matching ID
          candidate.attempts = candidate.attempts.filter(attempt => 
            !(attempt.id === interviewId && attempt.status === 'In Progress')
          );

          // If an attempt was removed, recalculate candidate summary
          if (candidate.attempts.length < initialCount) {
            console.log('✅ Removed abandoned attempt for:', candidate.email);
            
            // Recalculate latest score and status
            const completedAttempts = candidate.attempts
              .filter(a => a.status === "Completed" && a.score != null)
              .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0) - new Date(a.completedAt || a.updatedAt || 0));

            const latestCompleted = completedAttempts[0];
            if (latestCompleted) {
              candidate.latestScore = latestCompleted.score;
              candidate.latestStatus = latestCompleted.status;
            } else {
              // No completed attempts, find latest non-completed
              const allAttempts = candidate.attempts
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              const latestAttempt = allAttempts[0];
              candidate.latestScore = null;
              candidate.latestStatus = latestAttempt ? latestAttempt.status : 'No attempts';
            }
          }
        }
      });

      // Remove candidates with no attempts
      state.candidates = state.candidates.filter(c => c.attempts && c.attempts.length > 0);
      
      // Also clean up through sync service
      interviewSyncService.cleanupInterviewProgress(interviewId);
    },

    // UI state management
    setSearch(state, action) {
      state.search = action.payload;
    },

    setSort(state, action) {
      state.sortKey = action.payload.key;
      state.sortOrder = action.payload.order;
    },

    // Clean up all interview data
    clearAllCandidates(state) {
      console.log('🗑️ Clearing all candidate data');
      state.candidates = [];
      interviewSyncService.cleanupExistingSessions();
    }
  },
});

export const { 
  syncInterviewState, 
  removeAbandonedAttempt, 
  setSearch, 
  setSort, 
  clearAllCandidates 
} = interviewerSlice.actions;

export default interviewerSlice.reducer;