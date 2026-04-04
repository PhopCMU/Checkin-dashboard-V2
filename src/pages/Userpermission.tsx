import {
  Search,
  Filter,
  Users,
  User,
  Shield,
  Save,
  X,
  Edit2,
  AlertCircle,
  Key,
  Crown,
  Briefcase,
} from "lucide-react";
import { getUserFromToken } from "../utils/authService";
import { useAlert } from "../contexts/AlertContext";
import { useEffect, useRef, useState } from "react";
import { Get_data_users } from "../services/serviceGet";
import { Navigate } from "react-router-dom";
import { canEditStaff } from "../utils/util";
import { useCheckSubPermission } from "../utils/helper";
import { PutUpdateUserPermission } from "../services/servicePut";
import type { UpdateUserPermissionPayload } from "../types/types";

const Userpermission = () => {
  const user = getUserFromToken() || {};
  const { showAlert } = useAlert();
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterPermission, setFilterPermission] = useState<string>("all");
  const [editingPermissions, setEditingPermissions] = useState<
    Record<string, string>
  >({});
  const [originalPermissions, setOriginalPermissions] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedStaff = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Permission
  const r = useCheckSubPermission("read");
  // const e = useCheckSubPermission("edit");
  // const d = useCheckSubPermission("delete");
  // const c = useCheckSubPermission("create");
  // const bd = useCheckSubPermission("backdate");
  // const bp = useCheckSubPermission("bypass");

  // 🔒 Authorization check
  if (
    user.permission !== "superadmin" ||
    user.codeId !== import.meta.env.VITE_CODE_ORGANZATION ||
    user.email !== import.meta.env.VITE_TARGET_EMAIL ||
    user.sub !== 1
  ) {
    return <Navigate to="dashboard" replace />;
  }

  // 🔑 Fetch staff
  useEffect(() => {
    if (!r) return;
    if (!hasFetchedStaff.current) {
      hasFetchedStaff.current = true;
      fetchAllStaffNames();
    }
  }, []);

  const fetchAllStaffNames = async () => {
    setIsLoading(true);
    try {
      const response = await Get_data_users(user.email ?? "");
      const data = Array.isArray(response) ? response : [];
      setAllStaff(data);

      // เก็บ permission เริ่มต้น สำหรับ cancel
      const original = data.reduce(
        (acc, staff) => {
          acc[staff.id] = staff.permission;
          return acc;
        },
        {} as Record<string, string>,
      );
      setOriginalPermissions(original);
    } catch (error) {
      console.error("Error fetching staff names:", error);
      setAllStaff([]);
      showAlert({
        type: "error",
        title: "เกิดข้อผิดพลาด!",
        message: "ไม่สามารถดึงข้อมูลพนักงานได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = allStaff.filter((staff) => {
    // 🔍 ค้นหาด้วยชื่อ-นามสกุล (ไม่สน case)
    const matchesSearch =
      searchQuery === "" ||
      `${staff.firstname} ${staff.lastname}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      staff.id.toString().includes(searchQuery);

    // 🎛️ ตัวกรองบทบาท
    const matchesPermission =
      filterPermission === "all" || staff.permission === filterPermission;

    return matchesSearch && matchesPermission;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = filteredStaff.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPermission]);

  // 📝 เมื่อเปลี่ยนค่าใน select
  const handlePermissionChange = (userId: string, newPermission: string) => {
    setEditingPermissions((prev) => ({
      ...prev,
      [userId]: newPermission,
    }));
  };

  // 💾 บันทึกการเปลี่ยนแปลง
  const handleSave = async (userId: string) => {
    const newPermission = editingPermissions[userId];
    const staff = allStaff.find((s) => s.id === userId);
    if (!staff || staff.permission === newPermission) return;

    setIsLoading(true);
    try {
      // TODO: เรียก API เพื่ออัปเดต permission
      // await updatePermissionAPI(userId, newPermission);

      const payload: UpdateUserPermissionPayload = {
        email: user.email ?? "",
        newPermission: newPermission,
        staffEmail: staff.email,
      };

      const resp = await PutUpdateUserPermission(payload);

      if (!resp) {
        throw new Error("API response indicates failure");
      }

      // อัปเดตสถานะใน UI
      setAllStaff((prev) =>
        prev.map((s) => {
          if (s.id === userId) {
            return { ...s, permission: newPermission };
          }
          return s;
        }),
      );

      await fetchAllStaffNames();
      showAlert({
        type: "success",
        title: "สำเร็จ!",
        message: `อัปเดตสิทธิ์ของ ${staff.firstname} ${
          staff.lastname
        } เป็น ${getPermissionLabel(newPermission)}`,
      });
    } catch (err) {
      showAlert({
        type: "error",
        title: "ล้มเหลว!",
        message: "ไม่สามารถอัปเดตสิทธิ์ได้",
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚫 ยกเลิกการเปลี่ยนแปลง
  const handleCancel = (userId: string) => {
    originalPermissions[userId];
    setEditingPermissions((prev) => {
      const newEdit = { ...prev };
      delete newEdit[userId];
      return newEdit;
    });
  };

  // แก้ไขหลายคนพร้อมกัน
  const handleBatchEdit = () => {
    const selectedIds = Object.keys(editingPermissions);
    if (selectedIds.length === 0) {
      showAlert({
        type: "warning",
        title: "แจ้งเตือน",
        message: "กรุณาเลือกผู้ใช้ที่ต้องการแก้ไขก่อน",
      });
      return;
    }

    // TODO: เรียก API เพื่ออัปเดตหลายคน
    showAlert({
      type: "info",
      title: "กำลังพัฒนา",
      message: "ฟังก์ชันแก้ไขหลายคนพร้อมกันกำลังอยู่ในระหว่างการพัฒนา",
    });
  };

  // 📋 รายการสิทธิ์ที่เลือกได้
  const permissionOptions = [
    {
      value: "superadmin",
      label: "ผู้ดูแลระบบ",
      icon: Crown,
      color: "from-red-500 to-pink-600",
    },
    {
      value: "admin",
      label: "ผู้ดูแล",
      icon: Shield,
      color: "from-purple-500 to-indigo-600",
    },
    {
      value: "hr",
      label: "เจ้าหน้าที่งานบุคคล",
      icon: Briefcase,
      color: "from-emerald-500 to-teal-600",
    },
    {
      value: "user",
      label: "ผู้ใช้ทั่วไป",
      icon: User,
      color: "from-blue-500 to-cyan-600",
    },
  ];

  const filterOptions = [
    { value: "all", label: "ทั้งหมด", color: "bg-gray-200" },
    ...permissionOptions.map((opt) => ({
      ...opt,
      color: "bg-linear-to-r " + opt.color.split(" ").slice(1).join(" "),
    })),
  ];

  const getPermissionLabel = (value: string) => {
    return permissionOptions.find((opt) => opt.value === value)?.label || value;
  };

  const getPermissionIcon = (value: string) => {
    const option = permissionOptions.find((opt) => opt.value === value);
    return option ? option.icon : User;
  };

  const getPermissionColor = (value: string) => {
    const option = permissionOptions.find((opt) => opt.value === value);
    return option ? option.color : "from-gray-500 to-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold">
                  จัดการสิทธิ์ผู้ใช้
                </h1>
                <p className="text-blue-100">
                  กำหนดบทบาทและสิทธิ์การเข้าถึงสำหรับผู้ใช้งานระบบ
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {allStaff.length} ผู้ใช้ทั้งหมด
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {Object.keys(editingPermissions).length} กำลังแก้ไข
                  </div>
                </div>
              </div>
              <button
                onClick={handleBatchEdit}
                disabled={Object.keys(editingPermissions).length === 0}
                className="flex items-center gap-3 px-5 py-3 bg-white/20 hover:bg-white/30 
                         disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm 
                         rounded-xl transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>บันทึกการแก้ไขทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {filterOptions.map((filter) => {
            const Icon =
              filter.value === "all" ? Users : getPermissionIcon(filter.value);
            const count =
              filter.value === "all"
                ? allStaff.length
                : allStaff.filter((s) => s.permission === filter.value).length;

            return (
              <div
                key={filter.value}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 
                         hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setFilterPermission(filter.value)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg ${filter.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div
                    className={`px-2 py-1 text-xs font-bold rounded-full 
                                ${
                                  filterPermission === filter.value
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                  >
                    {count}
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {filter.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                คำแนะนำการใช้งาน
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• คลิกที่บทบาทในตารางเพื่อเปลี่ยนสิทธิ์ผู้ใช้งาน</li>
                <li>• ใช้ช่องค้นหาเพื่อหาผู้ใช้งานด้วยชื่อหรือรหัส</li>
                <li>• ฟิลเตอร์บทบาทช่วยกรองผู้ใช้งานตามสิทธิ์ที่กำหนด</li>
                <li>• กดบันทึกหลังจากเปลี่ยนสิทธิ์เพื่อใช้งานได้ทันที</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาจากชื่อ นามสกุล หรือรหัสผู้ใช้..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                           hover:border-gray-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Permission Filter */}
            <div className="relative min-w-200px">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={filterPermission}
                onChange={(e) => setFilterPermission(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                         appearance-none cursor-pointer"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-gray-600">
              พบ <span className="font-bold">{filteredStaff.length}</span> คน
              จากทั้งหมด {allStaff.length} คน
              {searchQuery && ` สำหรับ "${searchQuery}"`}
            </div>
            <div className="text-gray-500">
              {Object.keys(editingPermissions).length > 0 && (
                <span className="text-amber-600 font-medium">
                  ⚡ มี {Object.keys(editingPermissions).length}{" "}
                  รายการที่ยังไม่ได้บันทึก
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">รายชื่อผู้ใช้</h3>
                <p className="text-sm text-gray-600">คลิกที่บทบาทเพื่อแก้ไข</p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                กำลังโหลด...
              </div>
            )}
          </div>

          {/* Table Body */}
          {isLoading && allStaff.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่พบผู้ใช้
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"`
                  : "ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข"}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterPermission("all");
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedStaff.map((staff) => {
                const currentPerm = staff.permission;
                const editingPerm = editingPermissions[staff.id];
                const isChanged =
                  editingPerm !== undefined && editingPerm !== currentPerm;
                const PermissionIcon = getPermissionIcon(
                  editingPerm || currentPerm,
                );
                const permissionColor = getPermissionColor(
                  editingPerm || currentPerm,
                );
                const permissionLabel = getPermissionLabel(currentPerm);

                // 🔒 ป้องกันการแก้ไข id=1 หรือ อีเมล เว้นแต่ผู้ใช้คือ sophon.m@cmu.ac.th
                const isLockedUser =
                  staff.email === import.meta.env.VITE_TARGET_EMAIL ||
                  staff.id === 1;

                const canEdit = canEditStaff(staff.email, user.email);
                const isCurrentUserSuperAdmin =
                  user.email === import.meta.env.VITE_TARGET_EMAIL;

                return (
                  <div
                    key={staff.id}
                    className={`p-6 transition-colors border-l-4 ${
                      isLockedUser
                        ? "border-l-red-500 bg-red-50/30 hover:bg-red-50/50"
                        : "border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isLockedUser
                                ? "bg-linear-to-br from-red-500 to-orange-600"
                                : "bg-linear-to-br from-blue-500 to-purple-600"
                            }`}
                          >
                            <span className="text-white font-bold text-lg">
                              {staff.firstname.charAt(0)}
                            </span>
                          </div>

                          {/* Lock Icon for locked user */}
                          {isLockedUser && (
                            <div
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full 
                            flex items-center justify-center border-2 border-white"
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}

                          {/* Edit Indicator */}
                          {isChanged && (
                            <div
                              className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full 
                            flex items-center justify-center animate-pulse"
                            >
                              <Edit2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">
                              {staff.firstname} {staff.lastname}
                            </h4>

                            {/* Locked Badge */}
                            {isLockedUser && (
                              <span
                                className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 
                               rounded-full border border-red-200 flex items-center gap-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                ระบบล็อค
                              </span>
                            )}

                            {/* Super Admin Badge for current user if viewing locked user */}
                            {isLockedUser && isCurrentUserSuperAdmin && (
                              <span
                                className="px-2 py-0.5 text-xs font-medium bg-linear-to-r from-red-500 to-pink-600 
                               text-white rounded-full flex items-center gap-1"
                              >
                                <Key className="w-3 h-3" />
                                คุณสามารถแก้ไขได้
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-600">
                              รหัส:{" "}
                              <span className="font-mono font-medium">
                                {staff.id}
                              </span>
                            </span>
                            {staff.email && (
                              <span className="text-gray-500">
                                • {staff.email}
                              </span>
                            )}
                            <span className="text-gray-500">•</span>
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 
                            bg-linear-to-r ${permissionColor} text-white rounded-full`}
                            >
                              <PermissionIcon className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {permissionLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Permission Selector */}
                      <div className="flex items-center gap-4">
                        {canEdit ? (
                          <div className="relative min-w-200px">
                            <div
                              className={`w-10 h-10 rounded-lg ${permissionColor} 
                            flex items-center justify-center absolute left-3 top-1/2 
                            transform -translate-y-1/2 pointer-events-none`}
                            >
                              <PermissionIcon
                                className={`w-5 h-5${
                                  isChanged ? "text-amber-800" : "text-gray-500"
                                }`}
                              />
                            </div>
                            <select
                              value={editingPerm ?? currentPerm}
                              onChange={(e) =>
                                handlePermissionChange(staff.id, e.target.value)
                              }
                              disabled={!canEdit}
                              className={`pl-12 pr-8 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 
                         outline-none cursor-pointer w-full appearance-none
                         ${
                           isChanged
                             ? "border-amber-300 bg-amber-50 text-amber-800"
                             : "border-gray-300 bg-gray-50"
                         }
                         ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {permissionOptions.map((opt) => {
                                return (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                            </div>
                          </div>
                        ) : (
                          // 🔒 Display only mode for locked user
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl ${permissionColor} 
                            flex items-center justify-center`}
                            >
                              <PermissionIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {permissionLabel}
                              </div>
                              <div className="text-sm text-gray-500">
                                ไม่สามารถแก้ไขได้
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {isChanged && canEdit && (
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <button
                              onClick={() => handleSave(staff.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-500 to-green-600 
                         text-white hover:opacity-90 rounded-lg transition-opacity"
                            >
                              <Save className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                บันทึก
                              </span>
                            </button>
                            <button
                              onClick={() => handleCancel(staff.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 
                         hover:bg-gray-300 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                ยกเลิก
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Warning for non-editable */}
                        {!canEdit && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                              เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขได้
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Locked User Explanation */}
                    {isLockedUser && !isCurrentUserSuperAdmin && (
                      <div className="mt-4 pt-4 border-t border-red-100">
                        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                          <svg
                            className="w-4 h-4 shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>

                          <div>
                            <span className="font-medium">
                              บัญชีนี้ถูกล็อคด้วยระบบความปลอดภัย
                            </span>
                            <p className="text-red-600 mt-0.5">
                              ระบบล็อคบัญชีผู้ใช้ ID=1
                              เพื่อป้องกันการเปลี่ยนแปลงที่ไม่ได้รับอนุญาต
                              เฉพาะผู้ดูแลระบบระดับสูง (Super Admin)
                              เท่านั้นที่สามารถแก้ไขสิทธิ์ของบัญชีนี้ได้
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Result Info */}
              <div className="text-sm text-gray-700">
                <span className="font-medium">{startIndex + 1}</span> -{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredStaff.length)}
                </span>{" "}
                จากทั้งหมด{" "}
                <span className="font-medium">{filteredStaff.length}</span>{" "}
                รายการ
                <span className="text-gray-500 ml-2">
                  • หน้า <span className="font-medium">{currentPage}</span> /{" "}
                  <span className="font-medium">{totalPages}</span>
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 
                     bg-white disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-gray-50 hover:border-gray-400 active:scale-95
                     transition-all duration-200 group"
                  aria-label="หน้าที่ย้อนกลับ"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 group-hover:text-gray-800 group-disabled:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* First Page Button (แสดงเมื่อไม่ใช่หน้าแรก) */}
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium
                         text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                         transition-colors duration-200"
                      aria-label="ไปหน้าแรก"
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className="flex items-center justify-center w-10 h-10 text-gray-400">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}

                {/* Page Numbers */}
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  const half = Math.floor(maxVisible / 2);

                  let startPage = Math.max(1, currentPage - half);
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxVisible - 1,
                  );

                  // Adjust if we're near the end
                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium
                           transition-all duration-200 ${
                             currentPage === i
                               ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105"
                               : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                           }`}
                        aria-label={`ไปหน้าที่ ${i}`}
                        aria-current={currentPage === i ? "page" : undefined}
                      >
                        {i}
                      </button>,
                    );
                  }

                  return pages;
                })()}

                {/* Last Page Button (แสดงเมื่อไม่ใช่หน้าสุดท้าย) */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && (
                      <span className="flex items-center justify-center w-10 h-10 text-gray-400">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium
                         text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                         transition-colors duration-200"
                      aria-label="ไปหน้าสุดท้าย"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 
                     bg-white disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-gray-50 hover:border-gray-400 active:scale-95
                     transition-all duration-200 group"
                  aria-label="หน้าถัดไป"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 group-hover:text-gray-800 group-disabled:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Page Selector (สำหรับเลือกหน้าที่ต้องการโดยตรง) */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-gray-600">ไปที่หน้า:</span>
                <div className="relative">
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg 
                     bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    aria-label="เลือกหน้า"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <option key={page} value={page}>
                          {page}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Page Selector */}
            <div className="mt-4 md:hidden">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600">เลือกหน้า:</span>
                <div className="relative">
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-300 rounded-lg 
                     bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <option key={page} value={page}>
                          หน้า {page}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Userpermission;