import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Loader2,
  Building2,
  Shield,
  Info,
  CheckCircle,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  Server,
} from "lucide-react";
import {
  getUserInfo,
  isAuthenticatedLocally,
  removeToken,
  saveToken,
  userEncode,
} from "../utils/authService";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  // useState
  const [loading, setLoading] = useState(false);
  const [loadingExchange, setLoadingExchange] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const location = useLocation();
  const hasExchangedCode = React.useRef(false);

  // ดึง code จาก URL
  const query = new URLSearchParams(location.search);
  const code = query.get("code");

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setError("");
    setInfo("กำลังนำทางไปยังระบบ CMU IT Account...");

    try {
      const clientId = import.meta.env.VITE_PUBLIC_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_PUBLIC_CALLBACK_URL;
      const scope = import.meta.env.VITE_PUBLIC_SCOPE;
      const authUrlBase = import.meta.env.VITE_PUBLIC_AUTH_URL;

      const authUrl = `${authUrlBase}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${encodeURIComponent(scope)}`;

      window.location.href = authUrl;
    } catch (err) {
      setError(
        "ไม่สามารถเชื่อมต่อกับระบบ CMU IT Account ได้ กรุณาลองใหม่อีกครั้ง",
      );
      setInfo("");
      setLoading(false);
    }
  };

  // ✅ Auto-login ถ้ามี session ที่ยังไม่หมดอายุ
  useEffect(() => {
    if (isAuthenticatedLocally()) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (code && !hasExchangedCode.current) {
      hasExchangedCode.current = true;
      exchangeCodeForSession(code);
    }
  }, [code, navigate]);

  const exchangeCodeForSession = async (authCode: string) => {
    removeToken(); // ล้าง token เก่าก่อนเริ่ม
    setLoadingExchange(true);
    setInfo("กำลังยืนยันการเข้าสู่ระบบ...");
    setError("");

    try {
      // 1. แลก code เป็นข้อมูลผู้ใช้ (อาจผ่าน token ชั่วคราว)
      const exchangeRes = await api.post("/api/auth/exchange-code-admin", {
        code: authCode,
      });

      let userInfo;
      if (!exchangeRes.data) {
        throw new Error("ไม่ได้รับข้อมูลผู้ใช้");
      }

      if (exchangeRes.data.accessToken) {
        userInfo = await getUserInfo(exchangeRes.data.accessToken);
      } else if (exchangeRes.data.user) {
        userInfo = exchangeRes.data.user;
      } else {
        throw new Error("ไม่ได้รับข้อมูลผู้ใช้");
      }

      // 2. ตรวจสอบ cmuitaccount_name
      if (!userInfo?.cmuitaccount_name) {
        setError("ไม่พบข้อมูลบัญชี CMU IT Account ของคุณในระบบ");
        return;
      }

      // 3. ส่งข้อมูลไปสร้าง token ของระบบคุณ
      const registerRes = await userEncode(userInfo);
      if (!registerRes?.accessToken) {
        setError("ระบบยืนยันตัวตนล้มเหลว");
        navigate("/sign-in", { replace: true });
        return;
      }

      // 4. เก็บ token ที่มีข้อมูลผู้ใช้ใน payload
      saveToken(registerRes.accessToken);

      // 5. ✅ redirect
      setInfo("ยืนยันการเข้าสู่ระบบสำเร็จ");
      setTimeout(() => {
        setLoadingExchange(false);
        navigate("/dashboard", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("Authentication flow error:", err);
      removeToken();
      navigate("/sign-in", { replace: true });
      setLoadingExchange(false);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setError(
            "คุณไม่มีสิทธิ์เข้าใช้งานระบบ (ต้องเป็นบุคลากรคณะสัตวแพทยศาสตร์)",
          );
        } else if (err.response?.status === 400) {
          setError("รหัสยืนยันไม่ถูกต้องหรือหมดอายุ");
        } else {
          setError(
            err.response?.data?.message ||
              "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          );
        }
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  const handleMicrosoftSignOut = async () => {
    removeToken();
    window.location.href =
      import.meta.env.VITE_PUBLIC_LOGOUT_URL +
      "https://vetcheckin.cmu.ac.th/admin/sign-in";
  };

  if (loadingExchange) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col justify-center items-center z-50 p-4">
        <div className="bg-linear-to-br from-slate-900 to-blue-900/80 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-700/30 backdrop-blur-sm">
          {/* Header with icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {/* Blue glowing orb effect */}
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <div className="relative w-20 h-20 bg-linear-to-br from-blue-500 via-indigo-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Server className="w-10 h-10 text-white" />
              </div>
              <Loader2 className="absolute -top-2 -right-2 w-8 h-8 text-cyan-300 animate-spin" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">
              กำลังประมวลผล
            </h2>
            <div className="mt-2 h-1 w-24 bg-linear-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
          </div>

          {/* Loading info */}
          <div className="text-center mb-8">
            <p className="text-blue-200/80 mb-4">{info}</p>
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-6 animate-fade-in">
              <div className="bg-linear-to-r from-red-900/40 to-rose-900/40 border border-red-700/50 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-rose-300 mt-0.5 shrink-0" />
                  <div className="ml-3 flex-1">
                    <h3 className="font-semibold text-rose-100 mb-1">
                      พบข้อผิดพลาด
                    </h3>
                    <p className="text-rose-200/80 text-sm mb-4">{error}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-linear-to-r from-rose-600 to-pink-600 text-white font-medium rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-rose-600/20"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        รีเฟรช
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress indicator (optional) */}
          {!error && (
            <div className="mt-6">
              <div className="h-1.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"></div>
              </div>
              <p className="text-blue-300/60 text-xs text-center mt-2">
                กรุณารอสักครู่...
              </p>
            </div>
          )}
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <div className="flex flex-col items-center justify-center mb-6">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 
                          flex items-center justify-center shadow-lg mb-4"
            >
              <Building2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Faculty of Veterinary Medicine, CMU
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mt-2">
              ระบบบริหารจัดการลงเวลาเข้างานคณะสัตวแพทยศาสตร์
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          {/* Left Panel - Information */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                เข้าสู่ระบบด้วยบัญชีองค์กร
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      ปลอดภัย
                    </h3>
                    <p className="text-gray-600">
                      เข้าสู่ระบบด้วยบัญชี Microsoft
                      องค์กรของมหาวิทยาลัยเชียงใหม่
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      สำหรับบุคลากร
                    </h3>
                    <p className="text-gray-600">
                      เฉพาะบุคลากรของคณะสัตวแพทยศาสตร์ มหาวิทยาลัยเชียงใหม่
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      ระบบครบวงจร
                    </h3>
                    <p className="text-gray-600">
                      จัดการงานบริหาร ลงเวลาเข้าออกงาน และติดตามการปฏิบัติงาน
                      ของคณะสัตวแพทยศาสตร์
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  ข้อกำหนดการใช้งาน
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>ต้องเป็นบัญชี @cmu.ac.th</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>ต้องได้รับสิทธิ์การเข้าถึงจากผู้ดูแลระบบ</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>ต้องเชื่อมต่อกับเครือข่ายของมหาวิทยาลัย</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Login */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  ใช้บัญชี Microsoft ของมหาวิทยาลัยเชียงใหม่
                </p>
                {info && (
                  <div className="mb-6 mt-5 animate-fadeIn">
                    <div
                      className="inline-flex items-center gap-3 px-5 py-3.5 
                           bg-linear-to-r from-blue-50/80 to-indigo-50/80 
                           backdrop-blur-sm border border-blue-100 rounded-xl 
                           shadow-sm transition-all duration-300 hover:shadow-md
                           hover:scale-[1.02]"
                    >
                      <div className="shrink-0">
                        <div className="p-2 bg-linear-to-br from-blue-100 to-blue-50 rounded-lg">
                          <Info className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-blue-800 leading-relaxed">
                        {info}
                      </p>
                      <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        ใหม่
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Microsoft Logout Button */}
              <div className="space-y-6">
                <button
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-4 px-6 py-4 
                           bg-white border-2 border-gray-300 rounded-xl 
                           hover:bg-gray-50 hover:border-blue-500 
                           active:scale-[0.98] transition-all duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           group"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-7 h-7"
                          viewBox="0 0 23 23"
                          aria-label="Microsoft Logo"
                        >
                          <path fill="#F35325" d="M1 1h10v10H1z" />
                          <path fill="#81BC06" d="M12 1h10v10H12z" />
                          <path fill="#05A6F0" d="M1 12h10v10H1z" />
                          <path fill="#FFBA08" d="M12 12h10v10H12z" />
                        </svg>
                        <div className="text-left">
                          <span className="block font-semibold text-gray-900 group-hover:text-blue-600">
                            Sign in with Microsoft
                          </span>
                          <span className="block text-xs text-gray-500">
                            @cmu.ac.th เท่านั้น
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </button>

                <button
                  onClick={handleMicrosoftSignOut}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-4 px-6 py-4 
                           bg-white border-2 border-gray-300 rounded-xl 
                           hover:bg-gray-50 hover:border-blue-500 
                           active:scale-[0.98] transition-all duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           group"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-7 h-7"
                          viewBox="0 0 23 23"
                          aria-label="Microsoft Logo"
                        >
                          <path fill="#F35325" d="M1 1h10v10H1z" />
                          <path fill="#81BC06" d="M12 1h10v10H12z" />
                          <path fill="#05A6F0" d="M1 12h10v10H1z" />
                          <path fill="#FFBA08" d="M12 12h10v10H12z" />
                        </svg>
                        <div className="text-left">
                          <span className="block font-semibold text-gray-900 group-hover:text-blue-600">
                            Sign out with Microsoft
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Help Text */}
                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                  <p className="mb-2">มีปัญหาในการเข้าสู่ระบบ?</p>
                  <p>
                    ติดต่อฝ่ายไอที:{" "}
                    <a
                      href="tel:053948095"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      053-948-095 (ภพ)
                    </a>
                  </p>
                </div>
              </div>

              {/* Organization Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 
                                flex items-center justify-center"
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      มหาวิทยาลัยเชียงใหม่
                    </p>
                    <p className="text-sm text-gray-600">คณะสัตวแพทยศาสตร์</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>ระบบนี้ใช้การยืนยันตัวตนด้วย Microsoft Azure AD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} CMU Veterinary System. All rights
                reserved.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                เวอร์ชั่น 2.0.0 • อัพเดตล่าสุด มกราคม 2026
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-gray-900">
                นโยบายความเป็นส่วนตัว
              </a>
              <a href="/terms" className="hover:text-gray-900">
                ข้อกำหนดการใช้งาน
              </a>
              <a href="/help" className="hover:text-gray-900">
                ช่วยเหลือ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
