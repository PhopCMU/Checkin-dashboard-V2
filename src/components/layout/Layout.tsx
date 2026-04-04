import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { getUserFromToken, removeToken } from "../../utils/authService";
import { useCheckSubPermission } from "../../utils/helper";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = getUserFromToken();

  if (
    !user ||
    user.permission === "user" ||
    user.codeId !== import.meta.env.VITE_CODE_ORGANZATION
  ) {
    removeToken();
    return <Navigate to="/sign-in" replace />;
  }

  useEffect(() => {
    const checkRead = () => {
      const read = useCheckSubPermission("read");
      if (!read) {
        removeToken();
        return <Navigate to="/sign-in" replace />;
      }
    };
    checkRead();
  }, []);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-900 to-gray-950">
      <Header onOpenSlideMenu={openSidebar} user={user} />

      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={user} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Outlet สำหรับแสดงหน้าต่างๆ */}
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
