import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { selectProfile, selectResume } from '../../store/intervieweeSlice';

/**
 * Hook for handling interview-related navigation and route protection
 */
export const useInterviewNavigation = (step) => {
    const navigate = useNavigate();
    const profile = useSelector(selectProfile);
    const resume = useSelector(selectResume);
    const { inProgress, status } = useSelector((s) => s.interviewee);

    // Validate routes based on state and redirect if necessary
    useEffect(() => {
        console.log('useInterviewNavigation: Validating route', {
            step,
            hasProfile: !!profile?.name,
            hasResume: !!resume?.text,
            inProgress,
            status,
        });

        // Check if the interview was just completed and we need to go to summary
        if (status === 'completed' && step === 'interview') {
            console.log('useInterviewNavigation: Interview completed, redirecting to summary');

            // Replace the current history entry instead of adding a new one
            // This prevents users from navigating back to the interview page
            navigate('/interviewee/summary', { replace: true });
            return;
        }

        const hasResumeData = resume && resume.text;
        const hasProfileData = profile && profile.name;

        // Redirect logic based on current step and state
        switch (step) {
            case 'pre-interview':
                // No special validation needed
                break;

            case 'interview':
                // User needs both resume and profile to start interview
                if (!hasResumeData || !hasProfileData) {
                    console.log(
                        'useInterviewNavigation: Missing required data for interview, redirecting to pre-interview'
                    );
                    message.warning('Please complete your profile before starting an interview');
                    navigate('/interviewee/pre-interview');
                    return;
                }

                // Check if the interview is in progress
                if (!inProgress && status !== 'in_progress') {
                    console.log(
                        'useInterviewNavigation: No active interview, redirecting to pre-interview'
                    );
                    message.warning('Please start an interview first');
                    navigate('/interviewee/pre-interview');
                    return;
                }
                break;

            case 'summary':
                // User should have completed an interview or have past interviews
                if (status !== 'completed' && !hasCompletedInterviews()) {
                    console.log(
                        'useInterviewNavigation: No completed interviews, redirecting to dashboard'
                    );
                    message.warning('Complete an interview first to view results');
                    navigate('/interviewee/dashboard');
                    return;
                }
                break;

            default:
                // Dashboard and other routes have no restrictions
                break;
        }
    }, [step, profile, resume, inProgress, status, navigate]);

    // Get the pastInterviews from the store
    const { pastInterviews } = useSelector((s) => s.interviewee);

    // Check if user has completed interviews
    const hasCompletedInterviews = () => {
        return pastInterviews && pastInterviews.length > 0;
    };

    return {
        isValidRoute: true, // Will be false if redirected
    };
};

export default useInterviewNavigation;
