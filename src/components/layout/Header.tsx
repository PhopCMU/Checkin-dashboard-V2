import {
  Menu,
  Bell,
  ChevronDown,
  Home,
  Calendar,
  BarChart3,
  LocationEdit,
  PhoneMissed,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import ProfileDropdown from "../ProfileDropdown";

const Header = ({
  onOpenSlideMenu,
  user,
}: {
  onOpenSlideMenu: () => void;
  user: any;
}) => {
  const location = useLocation();

  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // ข้อมูล breadcrumb ตาม path
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/") return [{ name: "แดชบอร์ด", icon: Home }];
    if (path === "/import-time")
      return [{ name: "ลงเวลางานย้อนหลัง", icon: Calendar }];
    if (path === "/reports") return [{ name: "รายงาน", icon: BarChart3 }];
    if (path === "/assignDepartment")
      return [{ name: "กำหนดหน่วยงาน", icon: BarChart3 }];
    if (path === "/usepermission")
      return [{ name: "กำหนดสิทธิ์", icon: PhoneMissed }];
    if (path === "/add-location")
      return [{ name: "Location", icon: LocationEdit }];
    return [{ name: "แดชบอร์ด", icon: Home }];
  };

  const breadcrumb = getBreadcrumb();

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 z-5000 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 py-2">
          {/* First Row: Mobile Compact */}
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
            {/* Left: Menu & Logo */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Menu Button - Mobile & Tablet */}
              <button
                onClick={onOpenSlideMenu}
                className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Logo - Mobile */}
              <div className="lg:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg md:rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TT</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm sm:text-base">
                    VET CMU
                  </span>
                </div>
              </div>

              {/* Breadcrumb - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  {breadcrumb.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center gap-1">
                        {index > 0 && (
                          <ChevronDown className="w-4 h-4 rotate-270" />
                        )}
                        <Icon className="w-4 h-4" />
                        <span className="ml-1 font-medium">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center: Search - Desktop & Tablet */}
            {/* <div className="hidden md:block flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                           hover:border-gray-400 transition-colors text-sm sm:text-base"
                />
              </div>
            </div> */}

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Button */}
              {/* <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Search"
              >
                {searchOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button> */}

              {/* Quick Actions - Mobile & Tablet */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Toggle - Hidden on mobile */}
              {/* <button
                onClick={() => setDarkMode(!darkMode)}
                className="hidden sm:flex p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button> */}

              {/* Notifications */}
              {/* <div className="relative">
                <button
                  className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white 
                                   text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>
              </div> */}

              {/* User Profile */}
              <div className="relative">{<ProfileDropdown user={user} />}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Modal - Mobile */}
      {quickActionsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-5000 sm:hidden"
            onClick={() => setQuickActionsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t rounded-t-xl shadow-lg z-40 sm:hidden animate-slideUp">
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100">
                  <Calendar className="w-6 h-6 text-blue-600 mb-1" />
                  <span className="text-xs font-medium">ลงเวลา</span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100">
                  <BarChart3 className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-xs font-medium">รายงาน</span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100">
                  <Bell className="w-6 h-6 text-purple-600 mb-1" />
                  <span className="text-xs font-medium">แจ้งเตือน</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
