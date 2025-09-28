import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, theme } from 'antd';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { store, persistor } from './store/store.js';
import IntervieweePage from './pages/IntervieweePage.jsx';
import InterviewerPage from './pages/InterviewerPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import 'antd/dist/reset.css';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <IntervieweePage /> },
      { path: '/interviewer', element: <InterviewerPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#7c3aed',
              colorLink: '#7c3aed',
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          <RouterProvider router={router} />
        </ConfigProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
