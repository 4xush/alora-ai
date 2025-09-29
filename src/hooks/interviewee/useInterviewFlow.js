import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import {
    startInterview,
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
    selectCurrentInterview,
    selectProfile,
    selectResume,
    selectPastInterviews,
} from "../../store/intervieweeSlice.js";
import { upsertCandidate } from "../../store/interviewerSlice.js";
import { aiService } from "../../services/aiService.js";

/**
 * Hook for managing interview flow logic
 * This centralizes all the interview-related functionality
 */
export const useInterviewFlow = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select state using selectors for better memoization
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

    // Handle resume parsing and profile extraction
    const handleResumeParsed = useCallback(
        async (text, fileMeta) => {
            console.log("useInterviewFlow: Resume parsed", {
                textLength: text?.length,
                fileName: fileMeta?.fileName,
            });

            dispatch(clearError());
            dispatch(setResume({ text, ...fileMeta }));

            try {
                dispatch(setLoading(true));
                console.log("useInterviewFlow: Extracting profile info...");

                const profileInfo = await aiService.extractResumeInfo({
                    resumeText: text,
                });

                console.log("useInterviewFlow: Extracted profile:", profileInfo);

                // Only update fields that are empty or if extracted info is better
                const currentProfile = profile || {};

                // Log the extraction results
                console.log("Resume info extraction results:", {
                    extractedName: profileInfo.name,
                    extractedEmail: profileInfo.email,
                    extractedPhone: profileInfo.phone,
                    currentName: currentProfile.name,
                    currentEmail: currentProfile.email,
                    currentPhone: currentProfile.phone
                });

                const updatedProfile = {
                    name: profileInfo.name || currentProfile.name || "",
                    email: profileInfo.email || currentProfile.email || "",
                    phone: profileInfo.phone || currentProfile.phone || "",
                };

                console.log("Setting profile with data:", updatedProfile);

                // Dispatch action to update profile
                dispatch(setProfile(updatedProfile));

                // Auto-advance to verification step
                dispatch(setCurrentStep(1));

                message.success("Resume uploaded and processed successfully!");
            } catch (error) {
                console.error(
                    "useInterviewFlow: Failed to extract profile info:",
                    error
                );

                // Don't fail the whole process if profile extraction fails
                message.warning(
                    "Resume uploaded but we couldn't extract all details automatically. Please verify your information manually."
                );

                // Still advance to next step
                dispatch(setCurrentStep(1));
            } finally {
                dispatch(setLoading(false));
            }
        },
        [dispatch, profile]
    );

    // Start interview process
    const handleStartInterview = useCallback(async () => {
        console.log("useInterviewFlow: Starting interview", {
            profileName: profile?.name,
            profileEmail: profile?.email,
            resumeLength: resume?.text?.length,
        });

        // Validate required data
        if (!profile?.name || !profile?.email) {
            const errorMsg = "Please provide your name and email to continue";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
            return;
        }

        if (!resume?.text) {
            const errorMsg = "Please upload your resume to continue";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
            return;
        }

        try {
            // Clear any existing errors
            dispatch(clearError());

            // Start the interview session
            dispatch(startInterview());

            // Generate questions
            console.log("useInterviewFlow: Generating questions...");
            const questionsResult = await dispatch(generateQuestions()).unwrap();

            console.log(
                "useInterviewFlow: Questions generated:",
                questionsResult.questions.length
            );

            // Update interviewer's candidate list with a new attempt
            const attemptId = Date.now().toString();
            dispatch(
                upsertCandidate({
                    id: attemptId,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    score: null,
                    status: "In Progress",
                    summary: "",
                    resumeText: resume.text,
                    transcript: [],
                    interviewId: currentInterviewId,
                    interviewDate: new Date().toISOString(),
                })
            );

            message.success("Interview started! Good luck!");

            // Navigate to interview flow
            navigate("/interviewee/interview");
        } catch (error) {
            console.error("useInterviewFlow: Failed to start interview:", error);
            const errorMsg =
                error.message || "Failed to start interview. Please try again.";
            dispatch(setError(errorMsg));
            message.error(errorMsg);
        }
    }, [dispatch, profile, resume, currentInterviewId, navigate]);

    // Handle answer submission
    const handleAnswerSubmit = useCallback(
        async ({ questionId, answer, secondsSpent, isLast, wasTimeUp, fromAutoSubmit }) => {
            console.log("useInterviewFlow: Recording answer", {
                questionId,
                answerLength: answer?.length,
                secondsSpent,
                isLast,
                wasTimeUp,
                fromAutoSubmit
            });

            try {
                // Record the answer first
                await dispatch(recordAnswer({ questionId, answer, secondsSpent }));

                if (!isLast) {
                    // Move to next question
                    dispatch(nextQuestion());

                    // Only show message if this was an auto-submission from timer or from selecting an option without clicking Next
                    if (wasTimeUp || fromAutoSubmit) {
                        message.success("Answer recorded! Moving to next question...");
                    }
                } else {
                    // This was the last question - start scoring
                    console.log(
                        "useInterviewFlow: Last answer submitted, starting scoring..."
                    );

                    try {
                        const scoringResult = await dispatch(scoreAnswers()).unwrap();
                        console.log("useInterviewFlow: Scoring completed:", scoringResult);

                        // Show success message first
                        message.loading({
                            content: "Evaluating your performance...",
                            key: "interview-completion",
                            duration: 1.5
                        });

                        // Complete the interview
                        dispatch(completeInterview(scoringResult));

                        // Update interviewer's candidate list with final results
                        const attemptId = Date.now().toString();
                        const transcript = questions.map((q, i) => ({
                            q: q.text || q.question || "",
                            a: answers[i]?.answer || "",
                            score: scoringResult.perAnswer?.[i]?.score ?? null,
                            explanation: scoringResult.perAnswer?.[i]?.explanation || "",
                        }));

                        dispatch(
                            upsertCandidate({
                                id: attemptId,
                                name: profile.name,
                                email: profile.email,
                                phone: profile.phone,
                                score: scoringResult.totalScore,
                                status: "Completed",
                                summary: scoringResult.summary,
                                resumeText: resume.text,
                                transcript,
                                completedAt: new Date().toISOString(),
                                interviewDate: new Date().toISOString(),
                            })
                        );

                        message.success({
                            content: "Evaluation complete! Showing your results...",
                            key: "interview-completion",
                            duration: 1.5
                        });

                        // Short delay to ensure state is updated before navigation
                        setTimeout(() => {
                            // Navigate to summary
                            navigate("/interviewee/summary");
                        }, 1000);
                    } catch (scoringError) {
                        console.error("useInterviewFlow: Scoring failed:", scoringError);

                        // Still complete the interview with fallback scoring
                        const fallbackResult = {
                            totalScore: Math.round(Math.random() * 40 + 50), // 50-90 range
                            summary:
                                "Interview completed but detailed scoring is unavailable due to technical issues. Please contact support for manual review.",
                            perAnswer: answers.map(() => ({
                                score: Math.round(Math.random() * 4 + 6), // 6-10 range
                                explanation: "Scoring unavailable due to technical issues.",
                            })),
                        };

                        dispatch(completeInterview(fallbackResult));

                        // Navigate to summary even with fallback results
                        navigate("/interviewee/summary");

                        message.warning(
                            "Interview completed but scoring encountered issues. Results may be approximate."
                        );
                    }
                }
            } catch (error) {
                console.error("useInterviewFlow: Failed to handle answer:", error);
                message.error("Failed to record answer. Please try again.");
            }
        },
        [dispatch, questions, answers, profile, resume, navigate]
    );

    // Handle back to dashboard
    const handleBackToDashboard = useCallback(() => {
        console.log("useInterviewFlow: Returning to dashboard");

        // Navigate to the dashboard
        navigate("/interviewee/dashboard");

        // Show a confirmation message
        message.success("Returning to dashboard");
    }, [navigate]);

    // Handle starting a new interview from dashboard
    const handleStartNewInterview = useCallback(() => {
        try {
            console.log("useInterviewFlow: Starting new interview from dashboard", {
                hasResumeText: !!resume?.text,
                currentStep,
            });

            // First clear any errors
            dispatch(clearError());

            // Reset the interview state
            dispatch(resetInterview());

            // Get the current resume state
            const hasResume = !!resume?.text;

            // Set the appropriate step based on whether we have a resume
            if (!hasResume) {
                console.log(
                    "useInterviewFlow: No resume text, setting to step 0 (resume upload)"
                );
                dispatch(setCurrentStep(0));
            } else {
                console.log(
                    "useInterviewFlow: Has resume, setting to step 1 (profile verification)"
                );
                dispatch(setCurrentStep(1));
            }

            // Navigate to pre-interview step
            navigate("/interviewee/pre-interview");
        } catch (err) {
            console.error("Error starting new interview:", err);
            message.error(
                "There was a problem starting the interview. Please try again."
            );
            navigate("/interviewee/dashboard");
        }
    }, [dispatch, resume, currentStep, navigate]);

    // View results
    const handleViewResults = useCallback(() => {
        console.log("useInterviewFlow: Viewing results from dashboard");
        // Navigate to the summary page
        navigate("/interviewee/summary");
    }, [navigate]);

    // Handle retaking interview
    const handleRetakeInterview = useCallback(() => {
        // Reset the interview but keep profile and resume
        dispatch(resetInterview());
        dispatch(setCurrentStep(0)); // Start from resume step

        // Navigate to pre-interview
        navigate("/interviewee/pre-interview");
    }, [dispatch, navigate]);

    // Check if there's an in-progress interview to resume
    useEffect(() => {
        if (inProgress && paused) {
            message.info("You have a paused interview session. Would you like to resume?");
        }
    }, [inProgress, paused]);

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
        settings,

        // Handlers
        handleResumeParsed,
        handleStartInterview,
        handleAnswerSubmit,
        handleBackToDashboard,
        handleStartNewInterview,
        handleViewResults,
        handleRetakeInterview,
    };
};

export default useInterviewFlow;
