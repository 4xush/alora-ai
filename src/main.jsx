import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { store, persistor } from "./store/store.js";
import "antd/dist/reset.css";
import "./styles.css";

// Debug persisted state
persistor.subscribe(() => {
  const state = store.getState();
  console.log("Redux persist state:", state);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#7c3aed",
              colorLink: "#7c3aed",
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
