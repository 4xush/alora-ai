import { saveToStorage, STORAGE_KEYS } from '../utils/storageUtils';

/**
 * Redux middleware to sync specific parts of state to localStorage
 * This is more efficient than subscribing to the entire store
 * as it only runs when relevant actions are dispatched
 */
const storageMiddleware = store => next => action => {
    // Process the action first
    const result = next(action);

    // Only save to localStorage for specific actions that modify pastInterviews
    if (
        action.type === 'interviewee/completeInterview' ||
        action.type === 'interviewee/clearAllHistory'
    ) {
        const { interviewee } = store.getState();
        saveToStorage(STORAGE_KEYS.PAST_INTERVIEWS, interviewee.pastInterviews);
    }

    return result;
};

export default storageMiddleware;
