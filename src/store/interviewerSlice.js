import { createSlice } from '@reduxjs/toolkit';

const interviewerSlice = createSlice({
  name: 'interviewer',
  initialState: {
    candidates: [], // { id, name, email, phone, score, status, summary, resumeText, transcript: [{q,a,score,explanation}] }
    search: '',
    sortKey: 'name',
    sortOrder: 'ascend',
  },
  reducers: {
    upsertCandidate(state, action) {
      const c = action.payload;
      const idx = state.candidates.findIndex((x) => x.id === c.id);
      if (idx >= 0) state.candidates[idx] = { ...state.candidates[idx], ...c };
      else state.candidates.push(c);
    },
    setSearch(state, action) {
      state.search = action.payload;
    },
    setSort(state, action) {
      const { key, order } = action.payload;
      state.sortKey = key;
      state.sortOrder = order;
    },
  },
});

export const { upsertCandidate, setSearch, setSort } = interviewerSlice.actions;
export default interviewerSlice.reducer;
