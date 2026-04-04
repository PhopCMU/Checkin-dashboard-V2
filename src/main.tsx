import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AlertProvider } from "./contexts/AlertContext";
import { ConfirmProvider } from "./contexts/useConfirm.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfirmProvider>
        <AlertProvider>
          <App />
        </AlertProvider>
      </ConfirmProvider>
    </ErrorBoundary>
  </StrictMode>,
);
