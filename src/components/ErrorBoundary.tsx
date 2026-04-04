import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });

    // สามารถส่ง error ไปยังบริการติดตาม error ได้ที่นี่
    // เช่น: Sentry.captureException(error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleResetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      // ถ้ามีการกำหนด fallback UI ให้ใช้ fallback นั้น
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-linear-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">เกิดข้อผิดพลาดในระบบ</h1>
                  <p className="text-white/90 mt-1">ขออภัยในความไม่สะดวก</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-50 rounded-full mb-6">
                  <Bug className="text-red-500" size={64} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  อ๊ะ! มีบางอย่างผิดพลาด
                </h2>

                <p className="text-gray-600 mb-6 max-w-md">
                  ระบบประสบปัญหาขัดข้อง กรุณาลองโหลดหน้าใหม่หรือกลับไปหน้าหลัก
                  หากปัญหายังคงอยู่โปรดติดต่อทีมผู้พัฒนา
                </p>

                {/* Error Details (Collapsible) */}
                {this.state.error && (
                  <details className="w-full mb-6 border border-gray-200 rounded-lg overflow-hidden">
                    <summary className="bg-gray-50 px-4 py-3 cursor-pointer flex justify-between items-center font-medium text-gray-700">
                      <span>รายละเอียดข้อผิดพลาด</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        สำหรับนักพัฒนา
                      </span>
                    </summary>
                    <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto max-h-60">
                      <p className="text-red-400 font-semibold mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="whitespace-pre-wrap text-gray-300">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <RefreshCw size={20} />
                    โหลดหน้าใหม่
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Home size={20} />
                    กลับหน้าหลัก
                  </button>

                  <button
                    onClick={this.handleResetError}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>

                {/* Support Contact */}
                <div className="mt-8 pt-6 border-t border-gray-200 w-full">
                  <p className="text-gray-500 text-sm">
                    ต้องการความช่วยเหลือ?{" "}
                    <a
                      href="mailto:support@example.com"
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      ติดต่อทีมสนับสนุน
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 text-center text-gray-500 text-sm">
              <p>รหัสข้อผิดพลาด: ERR-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
