/**
 * Centralized Interview State Synchronization Service
 * 
 * This service manages the synchronization between interviewee and interviewer states
 * to prevent duplicate interviews and ensure consistent state across the application.
 */

import { STORAGE_KEYS } from '../utils/storageUtils.js';

class InterviewSyncService {
    constructor() {
        this.activeInterviewId = null;
        this.listeners = new Set();
    }

    /**
     * Generate a truly unique interview ID using UUID-like approach
     */
    generateInterviewId(userEmail = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const emailPart = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8) : 'guest';
        
        return `interview_${emailPart}_${timestamp}_${random}`;
    }

    /**
     * Start a new interview session
     */
    startNewInterview(userProfile) {
        // Clean up any existing sessions first
        this.cleanupExistingSessions();
        
        // Generate new unique ID
        this.activeInterviewId = this.generateInterviewId(userProfile?.email);
        
        // Store active session info
        localStorage.setItem(STORAGE_KEYS.ACTIVE_INTERVIEW, JSON.stringify({
            id: this.activeInterviewId,
            startTime: new Date().toISOString(),
            userEmail: userProfile?.email,
            status: 'in_progress'
        }));

        console.log('🎯 New interview session started:', this.activeInterviewId);
        return this.activeInterviewId;
    }

    /**
     * Get the current active interview ID
     */
    getActiveInterviewId() {
        if (this.activeInterviewId) {
            return this.activeInterviewId;
        }

        // Try to get from localStorage
        try {
            const activeSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
            if (activeSession) {
                const session = JSON.parse(activeSession);
                this.activeInterviewId = session.id;
                return this.activeInterviewId;
            }
        } catch (error) {
            console.warn('Failed to parse active interview session:', error);
        }

        return null;
    }

    /**
     * Mark interview as completed
     */
    completeInterview(interviewId, finalData) {
        console.log('🏁 Completing interview:', interviewId);
        
        // Update active session
        try {
            const activeSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
            if (activeSession) {
                const session = JSON.parse(activeSession);
                if (session.id === interviewId) {
                    session.status = 'completed';
                    session.completedAt = new Date().toISOString();
                    session.finalScore = finalData?.totalScore;
                    localStorage.setItem(STORAGE_KEYS.ACTIVE_INTERVIEW, JSON.stringify(session));
                }
            }
        } catch (error) {
            console.warn('Failed to update active session:', error);
        }

        // Clean up progress data for this specific interview
        this.cleanupInterviewProgress(interviewId);
    }

    /**
     * Clean up abandoned interview sessions
     */
    cleanupExistingSessions() {
        console.log('🧹 Cleaning up existing interview sessions');
        
        // Remove any old progress data
        const keys = Object.keys(localStorage);
        const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));
        progressKeys.forEach(key => {
            console.log('Removing old progress key:', key);
            localStorage.removeItem(key);
        });

        // Remove resume modal flags
        localStorage.removeItem('show_resume_interview_modal');
        
        // Clear active interview
        this.activeInterviewId = null;
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
    }

    /**
     * Clean up progress for a specific interview
     */
    cleanupInterviewProgress(interviewId) {
        if (!interviewId) return;
        
        const progressKey = `${STORAGE_KEYS.INTERVIEW_PROGRESS}_${interviewId}`;
        localStorage.removeItem(progressKey);
        
        // If this was the active interview, clear it
        try {
            const activeSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
            if (activeSession) {
                const session = JSON.parse(activeSession);
                if (session.id === interviewId && session.status === 'completed') {
                    localStorage.removeItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
                    this.activeInterviewId = null;
                }
            }
        } catch (error) {
            console.warn('Failed to clean up active session:', error);
        }
    }

    /**
     * Check if there's a resumable interview
     */
    getResumableInterview() {
        try {
            const activeSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_INTERVIEW);
            if (activeSession) {
                const session = JSON.parse(activeSession);
                if (session.status === 'in_progress') {
                    // Check if progress data exists
                    const progressKey = `${STORAGE_KEYS.INTERVIEW_PROGRESS}_${session.id}`;
                    const progressData = localStorage.getItem(progressKey);
                    
                    if (progressData) {
                        return {
                            interviewId: session.id,
                            startTime: session.startTime,
                            progressData: JSON.parse(progressData)
                        };
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to get resumable interview:', error);
        }
        
        return null;
    }

    /**
     * Save interview progress
     */
    saveProgress(interviewId, progressData) {
        if (!interviewId) return;
        
        const progressKey = `${STORAGE_KEYS.INTERVIEW_PROGRESS}_${interviewId}`;
        const dataToSave = {
            ...progressData,
            timestamp: new Date().toISOString(),
            interviewId
        };
        
        localStorage.setItem(progressKey, JSON.stringify(dataToSave));
    }

    /**
     * Create a consistent interview state object for synchronization
     */
    createInterviewStateSync(interviewId, profile, status, additionalData = {}) {
        return {
            id: interviewId,
            name: profile?.name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
            status: this.normalizeStatus(status),
            interviewDate: new Date().toISOString(),
            ...additionalData
        };
    }

    /**
     * Normalize status values between different parts of the application
     */
    normalizeStatus(status) {
        const statusMap = {
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'idle': 'Not Started',
            'In Progress': 'In Progress',
            'Completed': 'Completed'
        };
        
        return statusMap[status] || status;
    }
}

// Create singleton instance
export const interviewSyncService = new InterviewSyncService();

// Add to storage keys
export const SYNC_STORAGE_KEYS = {
    ...STORAGE_KEYS,
    ACTIVE_INTERVIEW: 'active_interview_session'
};