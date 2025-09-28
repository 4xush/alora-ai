import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    duration: 10, // in minutes
    role: 'Full-stack Engineer',
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
    },
});

export const { setDuration, setRole } = settingsSlice.actions;
export default settingsSlice.reducer;
