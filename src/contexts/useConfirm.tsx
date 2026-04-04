import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

// 1. กำหนด Interface สำหรับ Context
interface ConfirmContextType {
  confirm: (title: string, message: string) => Promise<boolean>;
}

// 2. สร้าง Context
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// 3. สร้าง Provider (เพื่อครอบ Application)
export const ConfirmProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // ใช้ ref เพื่อเก็บฟังก์ชัน resolve ของ Promise
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ isOpen: true, title, message });
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setState({ isOpen: false, title: "", message: "" });
    if (resolveRef.current) resolveRef.current(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setState({ isOpen: false, title: "", message: "" });
    if (resolveRef.current) resolveRef.current(false);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* --- UI ของ Confirm Modal --- */}
      {state.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-9999 p-4 transition-opacity duration-200 opacity-100">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 transform transition-all duration-200 scale-100">
            {/* Header Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {state.title}
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed">
                {state.message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

// 4. Hook สำหรับเรียกใช้งาน
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};
