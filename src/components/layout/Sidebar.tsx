import {
  Home,
  Users,
  Calendar,
  BetweenHorizontalStart,
  GitBranchPlus,
  LogOut,
  ChevronRight,
  TimerReset,
  LocationEdit,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const Sidebar = ({ isOpen, onClose, user }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const baseMenuItems = [
    { icon: Home, label: "แดชบอร์ด", path: "/dashboard" },
    {
      icon: BetweenHorizontalStart,
      label: "ส่งออกข้อมูล",
      path: "/reports",
      showIf: (u: any) => {
        const isTargetUser =
          u?.codeId === import.meta.env.VITE_CODE_ORGANZATION;
        const hasPermission =
          u.permission === "hr" || u.permission === "superadmin";
        return hasPermission && isTargetUser;
      },
    },
    {
      icon: Users,
      label: "กำหนดสิทธิ์",
      path: "/usepermission",
      showIf: (u: any) =>
        u.permission === "superadmin" &&
        u?.codeId === import.meta.env.VITE_CODE_ORGANZATION &&
        u.email === import.meta.env.VITE_TARGET_EMAIL,
    },
    {
      icon: TimerReset,
      label: "ลงเวลาย้อนหลัง",
      path: "/import-time",
      showIf: (u: any) => {
        const isTargetUser =
          u?.codeId === import.meta.env.VITE_CODE_ORGANZATION;
        const hasPermission =
          u.permission === "superadmin" || u.permission === "admin";
        const hasActiveHead = u.unitHeads?.[0]?.isActive;
        const hasValidUnitId = typeof u.unitHeads?.[0]?.unitId === "number";
        const isHead = u.userUnits?.[0]?.role === "HEAD";

        return (
          hasPermission &&
          isTargetUser &&
          hasActiveHead &&
          hasValidUnitId &&
          isHead
        );
      },
    },
    {
      icon: GitBranchPlus,
      label: "กำหนดหน่วยงาน",
      path: "/assignDepartment",
      showIf: (u: any) =>
        (u.permission === "admin" ||
          u.permission === "superadmin" ||
          u.permission === "hr") &&
        u?.codeId === import.meta.env.VITE_CODE_ORGANZATION,
    },
    {
      icon: LocationEdit,
      label: "Locations",
      path: "/add-location",
      showIf: (u: any) =>
        u.permission === "superadmin" &&
        u?.codeId === import.meta.env.VITE_CODE_ORGANZATION &&
        u.email === import.meta.env.VITE_TARGET_EMAIL,
    },
  ];

  // กรองเฉพาะรายการที่แสดงได้
  const visibleMenuItems = baseMenuItems.filter(
    (item) => !item.showIf || item.showIf(user),
  );

  const bottomItems = [{ icon: LogOut, label: "ออกจากระบบ", path: "/logout" }];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    navigate("/login");
    onClose();
  };

  return (
    <>
      {/* Overlay สำหรับมือถือ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className="relative">
        <aside
          className={`
            fixed  top-0 left-0 h-screen bg-linear-to-b from-gray-900 to-gray-800 
            text-white z-50 transition-all duration-300 ease-in-out
            w-72 shadow-2xl border-r border-gray-700/50 flex flex-col
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:w-72 lg:h-screen lg:sticky lg:top-0
          `}
        >
          {/* Close Button - แสดงเฉพาะมือถือ */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-6 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Logo/Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  VET CHECK IN
                </h1>
                <p className="text-xs text-gray-400">ระบบลงเวลางาน</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu - ส่วนที่สามารถ scroll ได้ */}
          <div className="flex-1 overflow-y-auto py-4 sidebar-scrollbar">
            <nav className="px-4">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                  เมนูหลัก
                </h3>
                <ul className="space-y-1">
                  {visibleMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <li key={index}>
                        <Link
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                            ${
                              active
                                ? "bg-linear-to-r from-blue-500/20 to-purple-500/20 text-white border-l-4 border-blue-500"
                                : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${
                                active ? "text-blue-400" : "text-gray-400"
                              }`}
                            />
                            <span
                              className={`font-medium ${
                                active ? "font-semibold" : ""
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          {active && (
                            <ChevronRight className="w-4 h-4 text-blue-400" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Bottom Menu */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                  เมนูอื่นๆ
                </h3>
                <ul className="space-y-1">
                  {bottomItems.map((item, index) => {
                    const Icon = item.icon;
                    const isLogout = item.path === "/logout";

                    return (
                      <li key={index}>
                        {isLogout ? (
                          <button
                            onClick={handleLogout}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-gray-300 
                              hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                          </button>
                        ) : (
                          <Link
                            to={item.path}
                            onClick={onClose}
                            className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 
                              hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
          </div>

          {/* Footer - ส่วนล่างสุด */}
          <div className="border-t border-gray-700/50 p-4 bg-gray-900/50">
            <div className="px-4 py-3 bg-gray-800/30 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">สถานะระบบ</span>
                {user.permission ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-emerald-400">
                      ใช้งานได้ปกติ
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs text-red-400">
                      ไม่สามารถใช้งานได้
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                v.{import.meta.env.VITE_APP_VERSION}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

// Import X icon
const X = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default Sidebar;
