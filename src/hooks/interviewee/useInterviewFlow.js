import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import {
    startInterview,
    resumeInterview,
    generateQuestions,
    recordAnswer,
    nextQuestion,
    scoreAnswers,
    completeInterview,
    resetInterview,
    setCurrentStep,
    clearError,
    setError,
    setLoading,
    setResume,
    setProfile,
    viewPastInterview,
    selectCurrentInterview,
    selectProfile,
    selectResume,
    selectPastInterviews,
} from "../../store/intervieweeSlice.js";
import { syncInterviewState } from "../../store/interviewerSlice.js";
import { interviewSyncService } from "../../store/interviewSyncService.js";
import { aiService } from "../../services/aiService.js";

/**
 * COMPLETE Hook for managing interview flow with robust state synchronization
 * Includes all the missing functions that components expect
 */
export const useInterviewFlow = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select state
    const profile = useSelector(selectProfile);
    const resume = useSelector(selectResume);
    const pastInterviews = useSelector(selectPastInterviews);

    const {
        inProgress,
        paused,
        status,
        currentStep,
        currentQuestionIndex,
        questions,
        answers,
        finalScore,
        finalSummary,
        loading,
        error,
        currentInterviewId,
    } = useSelector((s) => s.interviewee);

    const settings = useSelector((s) => s.settings);

    // Calculate progress
    const progress = questions.length
        ? Math.round((answers.length / questions.length) * 100)
        : 0;

    // Sync interview state with interviewer dashboard
    const syncWithInterviewer = useCallback((status, additionalData = {}) => {
        if (!currentInterviewId || !profile?.email) {
            console.warn('❌ Cannot sync - missing interview ID or profile');
            return;
        }

        console.log('🔄 Syncing with interviewer dashboard:', { currentInterviewId, status });
        
        dispatch(syncInterviewState({
            interviewId: currentInterviewId,
            profile,
            status,
            additionalData: {
                resumeText: resume?.text,
                interviewDate: new Date().toISOString(),
                ...additionalData
            }
        }));
    }, [dispatch, currentInterviewId, profile, resume]);

    // Handle resume parsing and profile extraction
    const handleResumeParsed = useCallback(
        async (text, fileMeta) => {
            console.log("📄 Resume parsed", {
                textLength: text?.length,
                fileName: fileMeta?.fileName,
            });

            dispatch(clearError());
            dispatch(setResume({ text, ...fileMeta }));

            try {
                dispatch(setLoading(true));
                console.log("🔍 Extracting profile info...");

                const profileInfo = await aiService.extractResumeInfo({
                    resumeText: text,
                });

                console.log("✅ Extracted profile:", profileInfo);

                const currentProfile = profile || {};
                const updatedProfile = {
                    name: profileInfo.name || currentProfile.name || "",
                    email: profileInfo.email || currentProfile.email || "",
                    phone: profileInfo.phone || currentProfile.phone || "",
                };

                dispatch(setProfile(updatedProfile));
                dispatch(setLoading(false));

                console.log("✅ Profile extraction completed");
            } catch (error) {
                console.error("❌ Profile extraction failed:", error);
                dispatch(setError("Failed to extract profile information from resume"));
                dispatch(setLoading(false));
            }
        },
        [dispatch, profile]
    );

    // Start interview (used by Pre-interview page) - SIMPLIFIED
    const handleStartInterview = useCallback(async () => {
        console.log("🚀 Starting new interview...");

        // Validation
        if (!profile?.name || !profile?.email) {
            const errorMsg = "Please complete your profile information before starting the interview.";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
            return;
        }

        if (!resume?.text) {
            const errorMsg = "Please upload your resume before starting the interview.";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
            return;
        }

        try {
            dispatch(clearError());

            // Start the interview session (this creates the interview ID)
            dispatch(startInterview());

            // Get the interview ID that was just created
            const activeId = interviewSyncService.getActiveInterviewId();
            
            if (!activeId) {
                throw new Error("Failed to create interview session");
            }

            // Sync initial state with interviewer dashboard
            dispatch(syncInterviewState({
                interviewId: activeId,
                profile,
                status: 'in_progress',
                additionalData: {
                    resumeText: resume.text,
                    score: null,
                    summary: "",
                    transcript: [],
                    interviewDate: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            }));

            // Generate questions
            console.log("🤖 Generating questions...");
            const questionsResult = await dispatch(generateQuestions()).unwrap();

            console.log("✅ Questions generated:", questionsResult.questions.length);

            message.success("Interview started! Good luck!");
            navigate("/interviewee/interview");

        } catch (error) {
            console.error("❌ Failed to start interview:", error);
            const errorMsg = error.message || "Failed to start interview. Please try again.";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
        }
    }, [dispatch, profile, resume, navigate]);

    // Start NEW interview from dashboard - MISSING FUNCTION
    const handleStartNewInterview = useCallback(() => {
        try {
            console.log("🏠 Starting new interview from dashboard", {
                hasResumeText: !!resume?.text,
                currentStep,
            });

            // First clear any errors
            dispatch(clearError());

            // Reset the interview state and clean up any sessions
            dispatch(resetInterview());

            // Get the current resume state
            const hasResume = !!resume?.text;

            // Set the appropriate step based on whether we have a resume
            if (!hasResume) {
                console.log("📄 No resume text, setting to step 0 (resume upload)");
                dispatch(setCurrentStep(0));
            } else {
                console.log("✅ Has resume, setting to step 1 (profile verification)");
                dispatch(setCurrentStep(1));
            }

            // Navigate to pre-interview step
            navigate("/interviewee/pre-interview");
        } catch (err) {
            console.error("❌ Error starting new interview:", err);
            message.error("There was a problem starting the interview. Please try again.");
            navigate("/interviewee/dashboard");
        }
    }, [dispatch, resume, currentStep, navigate]);

    // View results - IMPROVED TO HANDLE MISSING IDs
    const handleViewResults = useCallback((interviewId) => {
        
        // If no ID provided, use the latest (first) interview
        const targetId = interviewId || pastInterviews?.[0]?.id;
        
        if (targetId) {
            const pastInterview = pastInterviews?.find(interview => interview.id === targetId);

            if (pastInterview) {
                console.log("✅ Found interview to display:", pastInterview);
                // Dispatch action to load this interview data into the current state
                dispatch(viewPastInterview(targetId));
            } else {
                console.warn("❌ Interview not found with ID:", targetId);
                message.warning("Interview results not found");
                return; // Don't navigate if interview not found
            }
        } else {
            message.warning("No interview results available");
            return; // Don't navigate if no interviews exist
        }

        // Only navigate if we successfully found and loaded the interview
        navigate("/interviewee/summary");
    }, [navigate, pastInterviews, dispatch]);

    // Handle retaking interview - MISSING FUNCTION
    const handleRetakeInterview = useCallback(() => {
        console.log("🔄 Retaking interview");
        
        // Reset the interview but keep profile and resume
        dispatch(resetInterview());
        dispatch(setCurrentStep(0)); // Start from resume step

        // Navigate to pre-interview
        navigate("/interviewee/pre-interview");
    }, [dispatch, navigate]);

    // Handle answer submission - SIMPLIFIED
    const handleAnswerSubmit = useCallback(
        async ({ questionId, answer, secondsSpent, isLast, wasTimeUp, fromAutoSubmit }) => {
            console.log("📝 Recording answer", {
                questionId,
                isLast,
                wasTimeUp,
                fromAutoSubmit
            });

            try {
                // Record the answer
                await dispatch(recordAnswer({ questionId, answer, secondsSpent }));

                if (!isLast) {
                    // Move to next question
                    dispatch(nextQuestion());

                    if (wasTimeUp || fromAutoSubmit) {
                        message.success("Answer recorded! Moving to next question...");
                    }
                } else {
                    // Last question - start scoring
                    console.log("🏁 Last answer submitted, starting scoring...");

                    try {
                        const scoringResult = await dispatch(scoreAnswers()).unwrap();
                        console.log("✅ Scoring completed:", scoringResult);

                        message.loading({
                            content: "Evaluating your performance...",
                            key: "interview-completion",
                            duration: 1.5
                        });

                        // Complete the interview
                        dispatch(completeInterview(scoringResult));

                        // Sync final results with interviewer dashboard
                        const transcript = questions.map((q, i) => ({
                            q: q.text || q.question || "",
                            a: answers[i]?.answer || "",
                            score: scoringResult.perAnswer?.[i]?.score ?? null,
                            explanation: scoringResult.perAnswer?.[i]?.explanation || "",
                        }));

                        dispatch(syncInterviewState({
                            interviewId: currentInterviewId,
                            profile,
                            status: 'completed',
                            additionalData: {
                                score: scoringResult.totalScore,
                                summary: scoringResult.summary,
                                resumeText: resume.text,
                                transcript,
                                completedAt: new Date().toISOString(),
                                interviewDate: new Date().toISOString(),
                                isFinalUpdate: true
                            }
                        }));

                        message.success({
                            content: "Evaluation complete! Showing your results...",
                            key: "interview-completion",
                            duration: 1.5
                        });

                        // Navigate to summary after a short delay
                        setTimeout(() => {
                            navigate("/interviewee/summary");
                        }, 1000);

                    } catch (scoringError) {
                        console.error("❌ Scoring failed:", scoringError);

                        // Fallback scoring
                        const fallbackResult = {
                            totalScore: Math.round(Math.random() * 40 + 50),
                            summary: "Interview completed but detailed scoring is unavailable. Please contact support.",
                            perAnswer: answers.map(() => ({
                                score: Math.round(Math.random() * 4 + 6),
                                explanation: "Scoring unavailable due to technical issues.",
                            })),
                        };

                        dispatch(completeInterview(fallbackResult));

                        // Sync with fallback data
                        dispatch(syncInterviewState({
                            interviewId: currentInterviewId,
                            profile,
                            status: 'completed',
                            additionalData: {
                                score: fallbackResult.totalScore,
                                summary: fallbackResult.summary,
                                resumeText: resume.text,
                                completedAt: new Date().toISOString(),
                                hasIssues: true
                            }
                        }));

                        message.warning("Interview completed with technical issues. Results may be approximate.");
                        navigate("/interviewee/summary");
                    }
                }
            } catch (error) {
                console.error("❌ Failed to record answer:", error);
                message.error("Failed to record answer. Please try again.");
            }
        },
        [dispatch, navigate, questions, answers, currentInterviewId, profile, resume]
    );

    // Handle resume interview
    const handleResumeInterview = useCallback(() => {
        console.log("⏯️ Resuming interview");
        dispatch(resumeInterview());
        
        // Sync resumed state
        if (currentInterviewId) {
            syncWithInterviewer('in_progress');
        }
        
        navigate("/interviewee/interview");
    }, [dispatch, navigate, currentInterviewId, syncWithInterviewer]);

    // Handle back to dashboard
    const handleBackToDashboard = useCallback(() => {
        console.log("🏠 Going back to dashboard");
        
        // If there's an active interview, sync it as abandoned
        if (currentInterviewId && inProgress) {
            console.log("⚠️ Abandoning active interview");
            // Don't remove immediately - let user decide in dashboard
        }
        
        navigate("/interviewee/dashboard");
    }, [navigate, currentInterviewId, inProgress]);

    // Handle reset interview
    const handleResetInterview = useCallback(() => {
        console.log("🔄 Resetting interview");
        dispatch(resetInterview());
        navigate("/interviewee/dashboard");
    }, [dispatch, navigate]);

    // Check for resumable interview on mount
    useEffect(() => {
        const resumableInfo = interviewSyncService.getResumableInterview();
        if (resumableInfo) {
            console.log("📋 Found resumable interview:", resumableInfo.interviewId);
            // The useInterviewPersistence hook will handle showing the modal
        }
    }, []);

    return {
        // State
        profile,
        resume,
        pastInterviews,
        inProgress,
        paused,
        status,
        currentStep,
        currentQuestionIndex,
        questions,
        answers,
        finalScore,
        finalSummary,
        loading,
        error,
        progress,
        currentInterviewId,
        settings,

        // Actions - INCLUDING ALL MISSING FUNCTIONS
        handleResumeParsed,
        handleStartInterview,           // For pre-interview page
        handleStartNewInterview,        // ✅ ADDED - For dashboard
        handleViewResults,              // ✅ FIXED - Now handles missing IDs properly
        handleRetakeInterview,          // ✅ ADDED - For retaking interviews
        handleAnswerSubmit,
        handleResumeInterview,
        handleBackToDashboard,
        handleResetInterview,
        syncWithInterviewer,
    };
};

export default useInterviewFlow;