// src/components/ProfileDropdown.tsx
import { useState } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { removeToken } from "../utils/authService";
import { useNavigate } from "react-router-dom";

// กำหนด type ของ user ให้ชัดเจน (ปรับตามโครงสร้างจริงของคุณ)
interface User {
  fname: string;
  lname: string;
  email: string;
  permission: string;
}

interface ProfileDropdownProps {
  user: User | null | undefined;
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // ถ้ายังไม่มี user → ไม่แสดงอะไร (หรือแสดง loading)
  if (!user) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="hidden lg:block h-6 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const userName = `${user.fname} ${user.lname}`;
  const userRole =
    user.permission === "superadmin"
      ? "ผู้ดูแลระบบ"
      : user.permission === "admin"
        ? "ผู้ช่วยดูแลระบบ"
        : user.permission === "hr"
          ? "เจ้าหน้าที่งานบุคคล"
          : "ผู้ใช้ทั่วไป";

  const menuItems = [
    { icon: User, label: "เร็วๆนี้", path: "./dashboard" },
    {
      icon: LogOut,
      label: "ออกจากระบบ",
      action: () => handleLogout(),
    },
  ];

  const handleLogout = () => {
    removeToken();
    navigate("/sign-in");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow">
            <span className="text-white font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="hidden lg:block text-left min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate max-w-120">
            {userName}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-120">{userRole}</p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{userName}</h3>
                  <p className="text-sm text-gray-500">{userRole}</p>
                  <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="p-2 max-h-96 overflow-y-auto">
              {menuItems.map((item, index) => {
                if (item.action) {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        item.action?.();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </button>
                  );
                } else {
                  return (
                    <a
                      key={index}
                      href={item.path}
                      className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </a>
                  );
                }
              })}
            </div>

            <div className="p-3 border-t bg-gray-50 rounded-b-xl">
              <div className="text-xs text-gray-500 text-center">
                v.{import.meta.env.VITE_APP_VERSION} • © 2026 VET CMU
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;
