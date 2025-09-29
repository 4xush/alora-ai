import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storageUtils';

/**
 * Hook for handling interview state persistence
 * This handles additional persistence needs beyond Redux-Persist
 */
export const useInterviewPersistence = () => {
    const dispatch = useDispatch();
    const {
        inProgress,
        paused,
        status,
        currentQuestionIndex,
        answers,
        currentInterviewId
    } = useSelector((s) => s.interviewee);

    // Save interview progress on changes
    useEffect(() => {
        if (inProgress && currentInterviewId) {
            const progressData = {
                timestamp: new Date().toISOString(),
                inProgress,
                paused,
                status,
                currentQuestionIndex,
                answersCount: answers.length,
                currentInterviewId
            };

            // Save current progress to localStorage for recovery
            saveToStorage(`${STORAGE_KEYS.INTERVIEW_PROGRESS}_${currentInterviewId}`, progressData);
            console.log('Interview progress saved to localStorage', progressData);
        }
    }, [inProgress, paused, currentQuestionIndex, answers.length, currentInterviewId, status]);

    // State to store resumable interview info
    const [resumableInterviewInfo, setResumableInterviewInfo] = useState(null);

    // Check for resumable interview on app load/restart
    useEffect(() => {
        // Check if there's a saved interview in progress
        const keys = Object.keys(localStorage);
        const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));

        console.log('Interview persistence: checking for resumable interviews', {
            progressKeysFound: progressKeys.length,
            currentInProgress: inProgress
        });

        if (progressKeys.length > 0 && !inProgress) {
            // Find the most recent interview
            let latestKey = progressKeys[0];
            let latestData = loadFromStorage(latestKey);
            let latestTime = new Date(latestData?.timestamp || 0);

            // Make sure latestData exists and is valid
            if (!latestData) {
                console.log('Found invalid interview progress data, removing', latestKey);
                localStorage.removeItem(latestKey);
                return;
            }

            console.log('Found potential interview to resume:', latestData);

            progressKeys.slice(1).forEach(key => {
                const data = loadFromStorage(key);
                if (!data) {
                    console.log('Found invalid interview progress data, removing', key);
                    localStorage.removeItem(key);
                    return;
                }

                const time = new Date(data.timestamp || 0);
                if (time > latestTime) {
                    latestKey = key;
                    latestData = data;
                    latestTime = time;
                }
            });

            // Only consider interviews that are genuinely in progress
            // with questions shown to the user
            if (latestData &&
                latestData.inProgress === true &&
                latestData.status === 'in_progress' &&
                !latestData.completed) {
                console.log('Found in-progress interview to resume', latestData);

                setResumableInterviewInfo({
                    interviewId: latestData.currentInterviewId,
                    questionIndex: latestData.currentQuestionIndex,
                    timestamp: latestData.timestamp
                });

                // Always show the modal for better discoverability
                console.log('Setting show_resume_interview_modal flag to force modal display');
                localStorage.setItem('show_resume_interview_modal', 'true');

                // Set a flag in sessionStorage to prevent infinite loops if user keeps refreshing
                if (!sessionStorage.getItem('interview_resume_attempted')) {
                    sessionStorage.setItem('interview_resume_attempted', 'true');

                    // Auto-show the resume modal when navigating to pre-interview or dashboard
                    if (window.location.pathname.includes('dashboard') ||
                        window.location.pathname.includes('pre-interview')) {
                        console.log('On correct page for resume modal, will show it');
                    }
                }
            }
        }
    }, [dispatch, inProgress]);

    // Function to resume an interview
    const resumeInterviewSession = (interviewId) => {
        console.log('Attempting to resume interview with ID:', interviewId);

        if (!interviewId) {
            // If no specific ID provided, check for any resumable interview
            const keys = Object.keys(localStorage);
            const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));

            if (progressKeys.length > 0) {
                // Use the first available interview
                const keyParts = progressKeys[0].split('_');
                interviewId = keyParts[keyParts.length - 1];
                console.log('No specific ID provided, using found ID:', interviewId);
            } else {
                console.log('No resumable interviews found in localStorage');
                return false;
            }
        }

        try {
            // Find the saved interview data
            const savedData = loadFromStorage(`${STORAGE_KEYS.INTERVIEW_PROGRESS}_${interviewId}`);

            if (savedData && savedData.inProgress && savedData.status === 'in_progress') {
                console.log('Found valid interview data to resume:', savedData);

                // Import the action from the slice
                const { resumeInterview } = require('../../store/intervieweeSlice');

                // Dispatch the resume action
                dispatch(resumeInterview());

                // Make sure to clear all resume modal flags
                localStorage.removeItem('show_resume_interview_modal');
                sessionStorage.removeItem('interview_resume_attempted');

                // Log the successfully resumed interview
                console.log('Interview successfully resumed with data:', savedData);

                return true;
            } else {
                console.log('Found invalid or completed interview data:', savedData);
                localStorage.removeItem(`${STORAGE_KEYS.INTERVIEW_PROGRESS}_${interviewId}`);
            }
        } catch (err) {
            console.error('Failed to resume interview:', err);
        }

        return false;
    };

    // Check if there's a saved interview that can be resumed
    const checkForResumableInterview = () => {
        const keys = Object.keys(localStorage);
        const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));

        // If there are no progress keys, no interviews can be resumed
        if (progressKeys.length === 0) {
            return false;
        }

        // Check if any of the progress keys contain valid resumable interview data
        return progressKeys.some(key => {
            const data = loadFromStorage(key);
            return data &&
                data.inProgress === true &&
                data.status === 'in_progress' &&
                !data.completed;
        });
    };

    return {
        hasSavedProgress: checkForResumableInterview(),
        resumeInterviewSession,
        resumableInterviewInfo
    };
};

export default useInterviewPersistence;
