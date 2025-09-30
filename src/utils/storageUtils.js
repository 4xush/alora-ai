/**
 * Utility functions for working with localStorage
 */

export const STORAGE_KEYS = {
    PAST_INTERVIEWS: 'pastInterviews',
    USER_PROFILE: 'userProfile',
    FIRST_VISIT: 'hasVisitedBefore',
    INTERVIEW_PROGRESS: 'interviewProgress',
    ACTIVE_INTERVIEW: 'active_interview_session'
};

/**
 * Save data to localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {any} data - The data to store
 * @returns {boolean} - Success status
 */
export const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving data to localStorage (${key}):`, error);
        return false;
    }
};

/**
 * Load data from localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} - The stored data or default value
 */
export const loadFromStorage = (key, defaultValue = null) => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Error loading data from localStorage (${key}):`, error);
        return defaultValue;
    }
};

/**
 * Remove data from localStorage with error handling
 * @param {string} key - The localStorage key
 * @returns {boolean} - Success status
 */
export const removeFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing data from localStorage (${key}):`, error);
        return false;
    }
};

/**
 * Clear all app-related data from localStorage
 */
export const clearAllStorage = () => {
    try {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        return true;
    } catch (error) {
        console.error('Error clearing all data from localStorage:', error);
        return false;
    }
};

export default {
    STORAGE_KEYS,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    clearAllStorage,
};
