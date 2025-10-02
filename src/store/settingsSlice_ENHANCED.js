import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    duration: 10, // in minutes
    role: 'Full-stack Engineer',
    complexity: 'balanced', // NEW: balanced, fundamentals, advanced, resume-focused
    focusArea: 'full-coverage', // NEW: full-coverage, frameworks, algorithms, system-design, practical
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setDuration(state, action) {
            state.duration = action.payload;
        },
        setRole(state, action) {
            state.role = action.payload;
        },
        // NEW: Complexity setting
        setComplexity(state, action) {
            state.complexity = action.payload;
        },
        // NEW: Focus area setting
        setFocusArea(state, action) {
            state.focusArea = action.payload;
        },
        // NEW: Update multiple settings at once
        updateSettings(state, action) {
            Object.assign(state, action.payload);
        },
        // NEW: Reset to defaults
        resetSettings(state) {
            Object.assign(state, initialState);
        },
    },
});

export const { 
    setDuration, 
    setRole, 
    setComplexity, 
    setFocusArea, 
    updateSettings, 
    resetSettings 
} = settingsSlice.actions;

export default settingsSlice.reducer;