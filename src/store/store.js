import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import localforage from 'localforage';
import intervieweeReducer from './intervieweeSlice.js';
import interviewerReducer from './interviewerSlice.js';
import uiReducer from './uiSlice.js';
import settingsReducer from './settingsSlice.js';

localforage.config({
  name: 'ai-interview-assistant',
  storeName: 'ai-interview-assistant-store',
});

const rootReducer = combineReducers({
  interviewee: intervieweeReducer,
  interviewer: interviewerReducer,
  ui: uiReducer,
  settings: settingsReducer,
});

const persistConfig = {
  key: 'root',
  storage: localforage,
  blacklist: ['ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
