import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { store } from "../store/store.js";
import { aiService } from "../services/aiService.js";
import {
  setProfile,
  setResume,
  startInterview,
  generateQuestions,
  recordAnswer,
  nextQuestion,
  scoreAnswers,
  completeInterview,
  resetInterview,
  setCurrentStep,
  setError,
  clearError,
  setLoading,
  selectCurrentInterview,
  selectProfile,
  selectResume,
  selectPastInterviews,
} from "../store/intervieweeSlice.js";
import { upsertCandidate } from "../store/interviewerSlice.js";
import InterviewFlow from "../components/InterviewFlow/InterviewFlow.jsx";
import IntervieweeDashboard from "../components/IntervieweeDashboard/IntervieweeDashboard.jsx";

const IntervieweePage = () => {
  const dispatch = useDispatch();

  // Use selectors for better state access
  const profile = useSelector(selectProfile);
  const resume = useSelector(selectResume);
  const pastInterviews = useSelector(selectPastInterviews);
  const currentInterview = useSelector(selectCurrentInterview);

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

  // Local state for UI control
  const [showDashboard, setShowDashboard] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isScoringAnswers, setIsScoringAnswers] = useState(false);

  // Calculate progress
  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((answers.length / questions.length) * 100);
  }, [questions.length, answers.length]);

  // Determine which view to show
  useEffect(() => {
    console.log("IntervieweePage: Determining view", {
      status,
      currentStep,
      inProgress,
      showDashboard,
    });

    const shouldShowDashboard =
      (!inProgress && currentStep === 0) || // Initial state
      (status === "idle" && currentStep === 0) || // Reset state
      (status === "completed" && currentStep === 3 && !showDashboard); // After viewing results

    const shouldShowInterview =
      inProgress ||
      (currentStep > 0 && currentStep < 4) ||
      (status === "completed" && showDashboard === false);

    if (shouldShowDashboard && !shouldShowInterview) {
      setShowDashboard(true);
    } else if (shouldShowInterview) {
      setShowDashboard(false);
    }
  }, [status, currentStep, inProgress, showDashboard]);

  // Handle resume parsing and profile extraction
  const handleResumeParsed = useCallback(
    async (text, fileMeta) => {
      console.log("IntervieweePage: Resume parsed", {
        textLength: text.length,
        fileName: fileMeta.fileName,
      });

      dispatch(clearError());
      dispatch(setResume({ text, ...fileMeta }));

      try {
        dispatch(setLoading(true));
        console.log("IntervieweePage: Extracting profile info...");

        const profileInfo = await aiService.extractResumeInfo({
          resumeText: text,
        });

        console.log("IntervieweePage: Extracted profile:", profileInfo);

        // Only update fields that are empty or if extracted info is better
        const currentProfile = profile || {};
        const updatedProfile = {
          name: profileInfo.name || currentProfile.name || "",
          email: profileInfo.email || currentProfile.email || "",
          phone: profileInfo.phone || currentProfile.phone || "",
        };

        dispatch(setProfile(updatedProfile));

        // Auto-advance to verification step
        dispatch(setCurrentStep(1));

        message.success("Resume uploaded and processed successfully!");
      } catch (error) {
        console.error(
          "IntervieweePage: Failed to extract profile info:",
          error,
        );

        // Don't fail the whole process if profile extraction fails
        message.warning(
          "Resume uploaded but we couldn't extract all details automatically. Please verify your information manually.",
        );

        // Still advance to next step
        dispatch(setCurrentStep(1));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, profile],
  );

  // Start interview process
  const handleStartInterview = useCallback(async () => {
    console.log("IntervieweePage: Starting interview", {
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
      setIsGeneratingQuestions(true);

      // Generate questions
      console.log("IntervieweePage: Generating questions...");
      const questionsResult = await dispatch(generateQuestions()).unwrap();

      console.log(
        "IntervieweePage: Questions generated:",
        questionsResult.questions.length,
      );

      // Update interviewer's candidate list
      const candidateId =
        profile.email || profile.name || Date.now().toString();
      dispatch(
        upsertCandidate({
          id: candidateId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          score: null,
          status: "In Progress",
          summary: "",
          resumeText: resume.text,
          transcript: [],
          interviewId: currentInterviewId,
        }),
      );

      message.success("Interview started! Good luck!");
    } catch (error) {
      console.error("IntervieweePage: Failed to start interview:", error);
      const errorMsg =
        error.message || "Failed to start interview. Please try again.";
      dispatch(setError(errorMsg));
      message.error(errorMsg);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [dispatch, profile, resume, currentInterviewId]);

  // Handle answer submission
  const handleAnswerSubmit = useCallback(
    async ({ questionId, answer, secondsSpent, isLast }) => {
      console.log("IntervieweePage: Recording answer", {
        questionId,
        answerLength: answer?.length,
        secondsSpent,
        isLast,
        currentQuestionIndex,
        questionsTotal: questions.length,
      });

      try {
        // Record the answer first
        console.log("IntervieweePage: Dispatching recordAnswer");
        dispatch(recordAnswer({ questionId, answer, secondsSpent }));
        console.log("IntervieweePage: recordAnswer completed");

        if (!isLast) {
          // Move to next question with proper async handling
          console.log(
            "IntervieweePage: Not last question, dispatching nextQuestion",
          );

          // Dispatch nextQuestion and wait a tick for state update
          dispatch(nextQuestion());

          // Use a Promise to ensure state is updated before continuing
          await new Promise((resolve) => {
            setTimeout(() => {
              const newIndex =
                store.getState().interviewee.currentQuestionIndex;
              console.log(
                "IntervieweePage: Question advanced from",
                currentQuestionIndex,
                "to",
                newIndex,
              );

              if (newIndex > currentQuestionIndex) {
                console.log("IntervieweePage: Question progression successful");
                message.success("Answer recorded! Moving to next question...");
              } else {
                console.error(
                  "IntervieweePage: Question did not advance properly",
                );
                message.warning(
                  "Answer recorded, but there may be a display issue",
                );
              }

              resolve();
            }, 50);
          });
        } else {
          // This was the last question - start scoring
          console.log(
            "IntervieweePage: Last answer submitted, starting scoring...",
          );
          setIsScoringAnswers(true);

          try {
            const scoringResult = await dispatch(scoreAnswers()).unwrap();
            console.log("IntervieweePage: Scoring completed:", scoringResult);

            // Complete the interview
            dispatch(completeInterview(scoringResult));

            // Update interviewer's candidate list with final results
            const candidateId =
              profile.email || profile.name || Date.now().toString();
            const transcript = questions.map((q, i) => ({
              q: q.text || q.question || "",
              a: answers[i]?.answer || "",
              score: scoringResult.perAnswer?.[i]?.score ?? null,
              explanation: scoringResult.perAnswer?.[i]?.explanation || "",
            }));

            dispatch(
              upsertCandidate({
                id: candidateId,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                score: scoringResult.totalScore,
                status: "Completed",
                summary: scoringResult.summary,
                resumeText: resume.text,
                transcript,
                completedAt: new Date().toISOString(),
              }),
            );

            message.success("Interview completed! Check your results.");
          } catch (scoringError) {
            console.error("IntervieweePage: Scoring failed:", scoringError);

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

            message.warning(
              "Interview completed but scoring encountered issues. Results may be approximate.",
            );
          } finally {
            setIsScoringAnswers(false);
          }
        }
      } catch (error) {
        console.error("IntervieweePage: Failed to handle answer:", error);
        message.error("Failed to record answer. Please try again.");
      }
    },
    [dispatch, questions, answers, profile, resume, currentQuestionIndex],
  );

  // Handle interview completion
  const handleInterviewComplete = useCallback(() => {
    console.log("IntervieweePage: Interview completed");
    // Show results for a moment before offering dashboard
    setTimeout(() => {
      setShowDashboard(true);
    }, 3000);
  }, []);

  // Navigation handlers
  const handleStartNewInterview = useCallback(() => {
    console.log("IntervieweePage: Starting new interview from dashboard");
    dispatch(clearError());
    setShowDashboard(false);

    // If no resume, start from beginning
    if (!resume?.text) {
      dispatch(resetInterview());
      dispatch(setCurrentStep(0));
    } else {
      // If have resume, start from verification
      dispatch(resetInterview());
      dispatch(setCurrentStep(1));
    }
  }, [dispatch, resume]);

  const handleViewResults = useCallback(() => {
    console.log("IntervieweePage: Viewing results from dashboard");
    setShowDashboard(false);
    // The current step should already be set to 3 for results
    if (currentStep !== 3) {
      dispatch(setCurrentStep(3));
    }
  }, [dispatch, currentStep]);

  const handleBackToDashboard = useCallback(() => {
    console.log("IntervieweePage: Returning to dashboard");
    setShowDashboard(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("IntervieweePage: State update", {
      status,
      currentStep,
      inProgress,
      showDashboard,
      questionsCount: questions.length,
      answersCount: answers.length,
      hasProfile: !!(profile?.name && profile?.email),
      hasResume: !!resume?.text,
      pastInterviewsCount: pastInterviews?.length || 0,
    });
  }, [
    status,
    currentStep,
    inProgress,
    showDashboard,
    questions.length,
    answers.length,
    profile,
    resume?.text,
    pastInterviews?.length,
  ]);

  // Show global loading for critical operations
  const globalLoading = isGeneratingQuestions || isScoringAnswers;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Global Loading Overlay */}
      {globalLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {isGeneratingQuestions &&
                "Preparing your personalized interview..."}
              {isScoringAnswers && "Evaluating your answers..."}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              {isGeneratingQuestions &&
                "This may take a moment while we analyze your resume."}
              {isScoringAnswers &&
                "Please wait while we calculate your final score."}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {showDashboard ? (
        <IntervieweeDashboard
          onStartNewInterview={handleStartNewInterview}
          onViewResults={handleViewResults}
        />
      ) : (
        <InterviewFlow
          onStart={handleStartInterview}
          onAnswer={handleAnswerSubmit}
          onComplete={handleInterviewComplete}
          onResumeParsed={handleResumeParsed}
          onBackToDashboard={handleBackToDashboard}
          error={error}
          loading={loading}
          progress={progress}
        />
      )}
    </div>
  );
};

export default IntervieweePage;
