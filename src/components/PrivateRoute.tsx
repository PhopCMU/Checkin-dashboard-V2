import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticatedLocally } from "../utils/authService";

interface Props {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // เช็ค offline ก่อน → เร็วทันใจ
    const isValid = isAuthenticatedLocally();
    setIsAuth(isValid);
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Animated Rings */}
          <div className="relative inline-block">
            {/* Outer Ring */}
            <div className="w-20 h-20 border-4 border-transparent border-t-blue-400 border-r-blue-300 rounded-full animate-spin"></div>

            {/* Inner Ring */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-3 border-transparent border-t-blue-300 border-r-blue-200 rounded-full animate-spin-reverse"></div>

            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Text */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-linear-to-r from-blue-300 to-cyan-200 mb-2">
              กำลังตรวจสอบการเข้าถึง
            </h3>
            <p className="text-slate-300 text-sm">กรุณารอสักครู่...</p>
          </div>
        </div>
      </div>
    );
  }

  return isAuth ? <>{children}</> : <Navigate to="/sign-in" replace />;
};

export default PrivateRoute;
