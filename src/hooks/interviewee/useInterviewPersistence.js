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
        currentInterviewId,
        questions,
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
        // This effect should run once on mount to detect any resumable interviews.
        const keys = Object.keys(localStorage);
        const progressKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.INTERVIEW_PROGRESS));

        console.log('Interview persistence: checking for resumable interviews', {
            progressKeysFound: progressKeys.length,
        });

        if (progressKeys.length > 0) {
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
                    answersCount: latestData.answersCount,
                    totalQuestions: questions.length,
                    timestamp: latestData.timestamp
                });

                // Set a flag in localStorage to ensure the modal is shown on the next page
                console.log('Setting show_resume_interview_modal flag to force modal display');
                localStorage.setItem('show_resume_interview_modal', 'true');
            } else {
                // If no valid in-progress interview is found, ensure the flag is cleared
                console.log('No valid in-progress interviews found, clearing modal flag.');
                localStorage.removeItem('show_resume_interview_modal');
            }
        } else {
            // If there are no progress keys, clear the flag
            localStorage.removeItem('show_resume_interview_modal');
        }
    }, []); // Run only once on component mount

    // Expose a flag indicating if there's a resumable interview
    const hasSavedProgress = !!resumableInterviewInfo;

    return {
        hasSavedProgress,
        resumableInterviewInfo,
    };
};

export default useInterviewPersistence;
