import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from "react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  duration?: number; // in milliseconds, default 3000
}

interface AlertContextProps {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Array<AlertOptions & { id: string }>>(
    []
  );

  const showAlert = (options: AlertOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const alert = { ...options, id, duration: options.duration ?? 4000 };
    setAlerts((prev) => [...prev, alert]);

    // Auto dismiss
    setTimeout(() => {
      removeAlert(id);
    }, alert.duration);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="fixed top-6 right-6 z-6000 space-y-3 max-w-md pointer-events-none">
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

// Alert Item Component (แสดงจริง)
const AlertItem: React.FC<{
  alert: AlertOptions & { id: string };
  onDismiss: () => void;
}> = ({ alert, onDismiss }) => {
  const getStyles = () => {
    switch (alert.type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-500",
          text: "text-green-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-500",
          text: "text-red-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-500",
          text: "text-yellow-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-500",
          text: "text-blue-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
    }
  };

  const { bg, text, icon } = getStyles();

  return (
    <div
      className={`flex items-start p-4 rounded-xl border-l-4 shadow-lg transform transition-all duration-300 ${bg} pointer-events-auto`}
    >
      <div className={`flex-shrink-0 w-6 h-6 ${text}`}>{icon}</div>
      <div className="ml-3">
        <h3 className={`text-sm font-bold ${text}`}>{alert.title}</h3>
        <p className={`mt-1 text-sm ${text}`}>{alert.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex ${text} hover:bg-opacity-20 hover:bg-current`}
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};
