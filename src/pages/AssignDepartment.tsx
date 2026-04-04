import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Users,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  User,
  Settings,
  UserCheck,
  Target,
  AlertCircle,
  Mail,
  MoreVertical,
  ShieldUser,
  CheckCircle,
} from "lucide-react";
import {
  Get_data_list_organization,
  Get_departments,
} from "../services/serviceGet";
import { getUserFromToken } from "../utils/authService";
import { Post_Add_Department, Post_Organzation } from "../services/servicePost";
import { canEditUser } from "../utils/util";
import { useCheckSubPermission } from "../utils/helper";
import { useConfirm } from "../contexts/useConfirm";
import { DeleteAssignDepartment } from "../services/serviceDelete";

interface Department {
  id: number;
  name: string;
}

const AssignDepartment = () => {
  const userPermission = getUserFromToken() || {};
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null,
  );
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [selectedUserDept, setSelectedUserDept] = useState<number | null>(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<
    string[]
  >([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const hasUsers = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Permission
  const r = useCheckSubPermission("read");
  const e = useCheckSubPermission("edit");
  const d = useCheckSubPermission("delete");
  const c = useCheckSubPermission("create");

  // Confirmation Modal
  const confirm = useConfirm();

  // Main Departments
  const mainDepartments = [
    { id: 1, name: "สำนักงานคณะ" },
    { id: 2, name: "สำนักวิชาสัตวแพทยศาสตร์" },
    { id: 3, name: "โรงพยาบาลสัตว์" },
    { id: 4, name: "ศูนย์บริการ" },
  ];

  // New Department Form
  const [newDept, setNewDept] = useState({
    departname: "",
    organzationId: "", // ← เก็บเป็น string ก่อน
  });

  const permissionLabels: { [key: string]: string } = {
    read: "อ่าน",
    create: "สร้าง",
    edit: "แก้ไข",
    delete: "ลบ",
    backdate: "ย้อนหลัง",
    bypass: "ข้าม",
    export: "ส่งออก",
  };

  // ดึงข้อมูลจากฐานข้อมูล
  useEffect(() => {
    if (r) {
      if (!hasUsers.current) {
        hasUsers.current = true;
        fetchUsers();
      }
    }
  }, [r]);

  // useEffect สำหรับล้าง error อัตโนมัติ
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000); // 2 วินาที

      // cleanup: ล้าง timeout ถ้า component ถูก unmount หรือ error เปลี่ยนก่อนครบ 2 วินาที
      return () => clearTimeout(timer);
    }
  }, [error]);

  const startEditing = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const userUnit = user.userUnits?.[0];
    // const deptId = userUnit?.unitId || null;
    const permissions = userUnit?.permissions || [];
    const role = userUnit?.role || "MEMBER"; // ✅ default เป็น "MEMBER"
    const currentUnitId = user.userUnits?.[0]?.unit?.id || null;

    setSelectedRole(role);
    setEditingUser(userId);
    setSelectedUserDept(currentUnitId);
    setSelectedUserPermissions(permissions);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await Get_data_list_organization(
        userPermission.email ?? "",
      );
      if (response.length === 0) return;

      const data = Array.isArray(response) ? response : [];
      setUsers(data);
      fetchDepartments();
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await Get_departments(userPermission.email ?? "");
      const data = Array.isArray(response) ? response : [];

      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    // 1. Search Logic
    // รวมชื่อ-นามสกุลเป็นตัวพิมพ์เล็กเพื่อค้นหาง่ายขึ้น

    const searchLower = searchTerm.toLowerCase();

    const matchSearch =
      user.firstname.toLowerCase().includes(searchLower) ||
      user.lastname.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);

    // 2. Department/Unit Logic (ส่วนที่แก้ไข)
    const matchDept =
      !selectedDepartment || // ถ้าไม่ได้เลือกหน่วยงาน ให้แสดงทั้งหมด
      user.userUnits.some((u: any) => u.unit.id === selectedDepartment);
    // ใช้ .some() เพื่อตรวจสอบว่า "มี" unit.id ตัวใดตัวหนึ่งตรงกับที่เลือกไหม

    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setNewDept((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new department
  const handleAddDepartment = async () => {
    const departname = newDept.departname.trim();
    const organzationId = Number(newDept.organzationId);

    if (!organzationId) {
      setError("กรุณาเลือกหน่วยงานหลัก");
      return;
    }

    if (!departname) {
      setError("กรุณากรอกชื่อหน่วยงาน");
      return;
    }

    const payload = {
      departname,
      organzationId,
    };

    const resp = await Post_Add_Department(payload);

    if (!resp.success) {
      setError("ไม่สามารถเพิ่มหน่วยงานได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setInfo("เพิ่มหน่วยงานสำเร็จ!");
    await fetchDepartments();
    setTimeout(() => {
      setInfo("");
      setNewDept({ departname: "", organzationId: "" });
      setShowAddDeptModal(false);
    }, 2000);
  };

  // เมื่อเลือก role เป็น HEAD → เพิ่มสิทธิ์อัตโนมัติ
  useEffect(() => {
    if (selectedRole === "HEAD") {
      // เพิ่มสิทธิ์พื้นฐานสำหรับหัวหน้า
      if (!selectedUserPermissions.includes("read")) {
        setSelectedUserPermissions([...selectedUserPermissions, "read"]);
      }
    }
  }, [selectedRole]);

  // Assign department to user
  const handleAssignDepartment = async (
    userId: number,
    unitId: number | null,
    permissions: string[] = [],
    role: string = "MEMBER",
  ) => {
    // 🔒 ตรวจสอบเพิ่มเติม: ห้ามแก้ไข sophon.m@cmu.ac.th โดยผู้อื่น
    const targetUser = users.find((u) => u.id === userId);
    if (
      targetUser?.email === import.meta.env.VITE_TARGET_EMAIL &&
      userPermission.email !== import.meta.env.VITE_TARGET_EMAIL
    ) {
      setError("คุณไม่มีสิทธิ์แก้ไขผู้ใช้นี้");
      return;
    }

    // ✅ ตรวจสอบ input ก่อนดำเนินการ
    if (permissions.length === 0) {
      setError("กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ");
      return;
    }

    if (unitId === null) {
      setError("กรุณาเลือกหน่วยงานก่อนบันทึก");
      return;
    }

    const email = userPermission.email ?? "";
    if (!email) {
      setError("ไม่พบอีเมลผู้ใช้งาน กรุณาลองอีกครั้ง");
      return;
    }

    const data = { userId, unitId, permissions, role };

    try {
      const response = await Post_Organzation(email, data);

      if (!response?.success) {
        setError(response?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        return;
      }

      // ✅ แสดงข้อความสำเร็จทันที
      setInfo("อัปเดตหน่วยงานและสิทธิ์สำเร็จ!");

      // ✅ ซ่อนข้อความหลัง 3 วินาที และรีเฟรชข้อมูล
      setTimeout(async () => {
        // ✅ รีเซ็ตฟอร์ม/สถานะ
        setEditingUser(null);
        setSelectedRole("MEMBER");
        setError(null);
        setInfo(null); // ซ่อนข้อความ
        await fetchUsers(); // ดึงข้อมูลใหม่หลังซ่อน
      }, 2000);
    } catch (err) {
      console.error("Error assigning department:", err);
      setError("เกิดข้อผิดพลาดขณะเชื่อมต่อกับระบบ");
      setInfo(null); // ปิดข้อความสำเร็จถ้ามี error
    }
  };

  // Delete department
  const handleDeleteDepartment = async (deptId: number) => {
    if (!deptId) return setError("ไม่พบหน่วยงาน กรุณาลองใหม่อีกครั้ง");

    try {
      const isConfirme = await confirm(
        "ยืนยันการลบหน่วยงาน",
        "คุณต้องการลบหน่วยงานนี้หรือไม่?",
      );

      if (!isConfirme) {
        return;
      }

      const resp = await DeleteAssignDepartment(deptId);

      if (!resp.success) {
        setError("ไม่สามารถลบหน่วยงานได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      await fetchDepartments();
      setInfo("ลบหน่วยงานสำเร็จ!");
      setTimeout(() => {
        setError(null);
        setInfo(null);
      }, 1000);
    } catch (error) {
      setError("ไม่สามารถลบหน่วยงานได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="space-y-8 bg-linear-to-br from-gray-50 to-blue-50 min-h-screen rounded-3xl">
      {/* Header with Stats */}
      <div className="relative overflow-hidden">
        <div className="space-y-8 p-6 min-h-screen">
          {/* Header Section - Modern Minimal Dark Theme */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 py-6 lg:py-8 bg-linear-to-r from-gray-900 to-gray-800 rounded-2xl shadow-2xl shadow-gray-900/50 mb-8">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-800 rounded-xl">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  จัดการหน่วยงาน
                </h1>
              </div>
              <p className="text-gray-300 ml-11 px-0.5 border-l-2 border-gray-600/70 pl-4">
                จัดการโครงสร้างหน่วยงานและกำหนดให้ผู้ใช้
              </p>
            </div>

            <button
              disabled={!c}
              onClick={() => (c ? setShowAddDeptModal(true) : null)}
              className="group relative inline-flex items-center gap-3 px-6 py-3.5
               bg-gray-800/80 hover:bg-gray-700/90 text-gray-100 rounded-xl transition-all duration-300 
               hover:shadow-lg hover:shadow-gray-900/50 border border-gray-700 hover:border-gray-600 disabled:opacity-60 
              disabled:hover:bg-gray-800/80"
            >
              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-gray-700 to-gray-900 group-hover:from-gray-600 group-hover:to-gray-800 transition-all duration-300">
                  <svg
                    className="w-4 h-4 text-gray-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                </div>
                <span className="font-medium text-lg tracking-wide">
                  {c ? "เพิ่มหน่วยงาน" : "ไม่สามารถเพิ่มหน่วยงานได้"}
                </span>
              </div>
            </button>
          </div>

          {/* Stats - Minimal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">หน่วยงานทั้งหมด</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {departments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">รอกำหนดหน่วยงาน</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {users.filter((u) => !(u.userUnits?.length > 0)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Departments List - Minimal */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                หน่วยงานทั้งหมด
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500 text-sm">กำลังโหลด...</p>
              </div>
            ) : departments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">ยังไม่มีหน่วยงาน</p>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="text-gray-900 hover:text-gray-700 underline text-sm"
                >
                  เพิ่มหน่วยงานแรก
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {departments.map((dept: any) => (
                  <div
                    key={dept.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Building2 className="w-4 h-4 text-gray-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">
                            {dept.name}
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {dept.units.length || 0} หน่วย
                          </span>
                        </div>

                        {dept.units && dept.units.length > 0 && (
                          <div className="ml-10">
                            <div className="text-sm text-gray-500 mb-2">
                              หน่วยงานย่อย:
                            </div>
                            <div className="flex flex-wrap gap-2 z-9999">
                              {dept.units.map((unit: any) => (
                                <div
                                  key={unit.id}
                                  className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 flex items-center gap-2"
                                >
                                  {unit.name}
                                  <span className="text-gray-400 ml-2">
                                    ({unit._count?.userUnits || 0})
                                  </span>
                                  <button
                                    disabled={!d}
                                    onClick={() =>
                                      d ? handleDeleteDepartment(unit.id) : null
                                    }
                                    className={` ${d ? "bg-red-300 text-white p-1 rounded-full hover:bg-red-400 transition-colors cursor-pointer" : "hidden"}`}
                                  >
                                    <Trash2 className="w-2 h-2" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modern Add Department Modal with Smooth UX */}
          {showAddDeptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
              {/* Backdrop with blur effect */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowAddDeptModal(false)}
              />

              {/* Modal Container with slide-up animation */}
              <div className="relative w-full max-w-lg animate-slideUp">
                <div className="bg-linear-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-gray-700">
                  {/* Modal Header */}
                  <div className="px-7 py-6 border-b border-gray-700/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-linear-to-br from-gray-800 to-gray-900">
                          <svg
                            className="w-5 h-5 text-gray-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            เพิ่มหน่วยงานใหม่
                          </h3>
                          <p className="text-sm text-gray-400 mt-0.5">
                            กรอกข้อมูลเพื่อสร้างหน่วยงานใหม่
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAddDeptModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="px-7 py-6">
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <span>หน่วยงานหลัก</span>
                        <span className="text-xs text-gray-500">(จำเป็น)</span>
                      </label>
                      <div className="relative group">
                        <select
                          name="organzationId"
                          value={newDept.organzationId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl 
                   text-gray-100 placeholder-gray-500 appearance-none
                   focus:outline-none focus:border-gray-500 focus:bg-gray-800/70
                   focus:ring-2 focus:ring-gray-700/50
                   transition-all duration-200
                   hover:border-gray-600 hover:bg-gray-800/60"
                        >
                          <option value="">— เลือกหน่วยงานหลัก —</option>
                          {mainDepartments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>

                        {/* Custom dropdown arrow (optional) */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* --- Input ชื่อหน่วยงาน (เดิม) --- */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <span>ชื่อหน่วยงาน</span>
                        <span className="text-xs text-gray-500">(จำเป็น)</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          name="departname"
                          value={newDept.departname}
                          onChange={handleInputChange}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              newDept.departname.trim() &&
                              newDept.organzationId
                            ) {
                              handleAddDepartment();
                            }
                          }}
                          placeholder="เช่น ฝ่ายทรัพยากรบุคคล, แผนกไอที..."
                          className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl 
                   text-gray-100 placeholder-gray-500
                   focus:outline-none focus:border-gray-500 focus:bg-gray-800/70
                   focus:ring-2 focus:ring-gray-700/50
                   transition-all duration-200
                   hover:border-gray-600 hover:bg-gray-800/60"
                          autoFocus
                        />
                        <div className="flex items-center justify-between mt-2 px-1">
                          <div className="text-xs text-gray-500">
                            {newDept.departname.length > 0 && (
                              <span className="text-gray-400">
                                {newDept.departname.length}/50 ตัวอักษร
                              </span>
                            )}
                          </div>
                          {newDept.departname.length > 0 && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500/70 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="my-2 animate-pulse">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 border-l-3 border-red-500 rounded-r w-full">
                          <AlertCircle className="w-4 h-4 text-red-600 animate-bounce" />
                          <span className="text-sm font-medium text-red-700">
                            {error}
                          </span>
                        </div>
                      </div>
                    )}

                    {info && (
                      <div className="my-2 animate-pulse">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 border-l-3 border-green-500 rounded-r w-full">
                          <CheckCircle className="w-4 h-4 text-green-600 animate-bounce" />
                          <span className="text-sm font-medium text-green-700">
                            {info}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddDepartment}
                        disabled={!newDept.departname.trim()}
                        className={`flex-1 py-3.5 px-4 rounded-xl font-medium transition-all duration-200
                        ${
                          newDept.departname.trim()
                            ? "bg-linear-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-gray-900/30"
                            : "bg-gray-800/40 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>เพิ่มหน่วยงาน</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowAddDeptModal(false)}
                        className="flex-1 py-3.5 px-4 border border-gray-700 text-gray-300 rounded-xl 
                       font-medium hover:bg-gray-800/60 hover:border-gray-600 
                       transition-all duration-200"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>ยกเลิก</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Assignment */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-green-600" />
              กำหนดหน่วยงานให้ผู้ใช้
            </h2>
            <p className="text-gray-600 mt-2">
              ค้นหาและกำหนดหน่วยงานให้กับผู้ใช้ในระบบ
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center gap-3">
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              แสดง{" "}
              <span className="font-bold text-blue-600">
                {filteredUsers.length}
              </span>{" "}
              จาก {users.length} คน
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-8 p-6 bg-linear-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={selectedDepartment || ""}
              onChange={(e) =>
                setSelectedDepartment(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกหน่วยงาน</option>

              {departments.map((dept: any) => (
                // ใช้ <optgroup> เพื่อจัดกลุ่มหน่วยงานหลัก
                <optgroup key={dept.id} label={dept.name}>
                  {dept.units.map((unit: any) => (
                    // วนลูปแสดงหน่วยงานย่อยในแต่ละกลุ่ม
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5" />
              <span>ตัวกรองเพิ่มเติม</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
              <UserCheck className="w-5 h-5" />
              <span>กำหนดให้หลายคน</span>
            </button> */}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* Desktop/Large Tablet View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        ผู้ใช้
                      </span>
                    </div>
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        หน่วยงานปัจจุบัน
                      </span>
                    </div>
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        กำหนดหน่วยงาน
                      </span>
                    </div>
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        การดำเนินการ
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-blue-50/30 transition-colors duration-200 group"
                  >
                    {/* User Column */}
                    <td className="px-6 lg:px-8 py-4 lg:py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          {!user.userUnits && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {user.firstname} {user.lastname}
                            </h4>
                            {user.userUnits.length > 0 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-blue-700 rounded-full self-start sm:self-center whitespace-nowrap">
                                {user.userUnits.map((u: any) => u.role)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 truncate">
                            <ShieldUser className="w-3 h-3 shrink-0" />
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {user.userUnits.length > 0 ? (
                                  // Get unique permissions
                                  [
                                    ...new Set(
                                      user.userUnits.flatMap(
                                        (unit: any) => unit.permissions,
                                      ),
                                    ),
                                  ].map((permission: any) => {
                                    const label =
                                      permissionLabels[permission] ||
                                      permission;

                                    // Minimal color mapping
                                    const colors = {
                                      read: "bg-blue-100 text-blue-800",
                                      edit: "bg-purple-100 text-purple-800",
                                      delete: "bg-rose-100 text-rose-800",
                                      create: "bg-green-100 text-green-800",
                                      bypass: "bg-emerald-100 text-emerald-800",
                                      export: "bg-amber-100 text-amber-800",
                                      backdate: "bg-teal-100 text-teal-800",
                                    };

                                    // Find matching color
                                    const permLower = permission.toLowerCase();
                                    let colorClass =
                                      "bg-gray-100 text-gray-800";

                                    if (permLower.includes("read"))
                                      colorClass = colors.read;
                                    else if (permLower.includes("edit"))
                                      colorClass = colors.edit;
                                    else if (permLower.includes("delete"))
                                      colorClass = colors.delete;
                                    else if (permLower.includes("create"))
                                      colorClass = colors.create;
                                    else if (permLower.includes("bypass"))
                                      colorClass = colors.bypass;
                                    else if (permLower.includes("export"))
                                      colorClass = colors.export;
                                    else if (permLower.includes("backdate"))
                                      colorClass = colors.backdate;

                                    return (
                                      <span
                                        key={permission}
                                        className={`px-2 py-1 rounded-md text-xs ${colorClass}`}
                                        title={label}
                                      >
                                        {label}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-500">
                                    No permissions
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Current Department Column */}
                    <td className="px-6 lg:px-8 py-4 lg:py-5">
                      {user.userUnits.length > 0 ? (
                        <div className="inline-flex">
                          <div className="px-3 py-2 lg:px-4 lg:py-2 bg-linear-to-r from-blue-100 to-blue-50 text-blue-800 rounded-lg lg:rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span className="text-sm font-medium">
                                {user.userUnits.map((u: any) => u.unit.name)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex">
                          <div className="px-3 py-2 lg:px-4 lg:py-2 bg-linear-to-r from-orange-100 to-amber-50 text-orange-800 rounded-lg lg:rounded-xl border border-orange-200">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span className="font-medium text-sm lg:text-base">
                                ยังไม่มีหน่วยงาน
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Assign Department Column */}
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      {editingUser === user.id ? (
                        <div className="space-y-3">
                          {/* Select Department Unit */}
                          <div className="relative">
                            <select
                              value={selectedUserDept || ""}
                              onChange={(e) =>
                                setSelectedUserDept(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                            >
                              {user.userUnits.length > 0 ? (
                                <option
                                  value={user.userUnits.map(
                                    (u: any) => u.unit.id,
                                  )}
                                >
                                  {user.userUnits.map((u: any) => u.unit.name)}
                                </option>
                              ) : (
                                <option value="">--เลือกหน่วยงาน--</option>
                              )}
                              {departments.map((dept: any) => (
                                <optgroup key={dept.id} label={dept.name}>
                                  {dept.units.map((unit: any) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          <div className="relative">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                            >
                              <option value="MEMBER">สมาชิกทั่วไป</option>
                              {userPermission.permission === "superadmin" && (
                                <option value="HEAD">หัวหน้า</option>
                              )}
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>

                          {/* Permissions - Minimal Grid */}
                          <div>
                            <div className="text-xs text-gray-600 mb-2">
                              สิทธิ์การใช้งาน:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { key: "read", label: "อ่าน" },
                                { key: "create", label: "สร้าง" },
                                { key: "edit", label: "แก้ไข" },
                                {
                                  key: "delete",
                                  label: "ลบ",
                                  showIf:
                                    userPermission.permission === "superadmin",
                                },
                                {
                                  key: "backdate",
                                  label: "ย้อนหลัง",
                                  showIf:
                                    userPermission.permission === "superadmin",
                                },
                                {
                                  key: "bypass",
                                  label: "ข้าม",
                                  showIf:
                                    userPermission.permission === "superadmin",
                                },
                                {
                                  key: "export",
                                  label: "ส่งออก",
                                  showIf:
                                    userPermission.permission === "superadmin",
                                },
                              ]
                                .filter((perm) => perm.showIf !== false)
                                .map((perm) => (
                                  <button
                                    key={perm.key}
                                    onClick={() => {
                                      if (
                                        selectedUserPermissions.includes(
                                          perm.key,
                                        )
                                      ) {
                                        setSelectedUserPermissions(
                                          selectedUserPermissions.filter(
                                            (p) => p !== perm.key,
                                          ),
                                        );
                                      } else {
                                        setSelectedUserPermissions([
                                          ...selectedUserPermissions,
                                          perm.key,
                                        ]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                      selectedUserPermissions.includes(perm.key)
                                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {perm.label}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {error && (
                            <div className="mt-2 animate-pulse">
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 border-l-3 border-red-500 rounded-r">
                                <AlertCircle className="w-4 h-4 text-red-600 animate-bounce" />
                                <span className="text-sm font-medium text-red-700">
                                  {error}
                                </span>
                              </div>
                            </div>
                          )}

                          {info && (
                            <div className="mt-2 animate-pulse">
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 border-l-3 border-green-500 rounded-r">
                                <CheckCircle className="w-4 h-4 text-green-600 animate-bounce" />
                                <span className="text-sm font-medium text-green-700">
                                  {info}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() =>
                                handleAssignDepartment(
                                  user.id,
                                  selectedUserDept,
                                  selectedUserPermissions,
                                  selectedRole,
                                )
                              }
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              ยืนยัน
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setSelectedUserDept(null);
                                setSelectedUserPermissions([]);
                                setSelectedRole("");
                              }}
                              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          คลิกเพื่อกำหนดหน่วยงาน
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 lg:px-8 py-4 lg:py-5">
                      <div className="flex items-center justify-end gap-2">
                        {editingUser === user.id ? (
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setSelectedUserDept(null);
                            }}
                            className="px-3 py-2 lg:px-4 lg:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm lg:text-base"
                          >
                            ยกเลิก
                          </button>
                        ) : (
                          <>
                            {/* ✅ ตรวจสอบว่าผู้ใช้ปัจจุบันสามารถแก้ไขผู้ใช้นี้ได้หรือไม่ */}
                            {canEditUser(user, userPermission.email) ? (
                              <button
                                onClick={() => startEditing(user.id)}
                                className="flex items-center gap-2 px-3 py-2 lg:px-5 lg:py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow hover:shadow-md text-sm lg:text-base whitespace-nowrap"
                              >
                                <Edit className="w-3 h-3 lg:w-4 lg:h-4" />

                                <span className="sm:hidden">กำหนด</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                ไม่สามารถแก้ไขได้
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-100">
              {currentItems.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-blue-50/30 transition-colors duration-200"
                >
                  {/* User Info Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        {!user.department && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {user.firstname} {user.lastname}
                          </h4>
                          {user.userUnits.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-blue-700 rounded-full whitespace-nowrap">
                              {user.userUnits.map((u: any) => u.role)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* More Actions Button for Mobile */}
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg ml-2">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Department Status */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 font-medium mb-1">
                      หน่วยงานปัจจุบัน
                    </div>
                    {user.userUnits.length > 0 ? (
                      <div className="inline-flex">
                        <div className="px-3 py-2 bg-linear-to-r from-blue-100 to-blue-50 text-blue-800 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            <span className="font-medium text-sm">
                              {user.userUnits.map((u: any) => u.unit.name)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex">
                        <div className="px-3 py-2 bg-linear-to-r from-orange-100 to-amber-50 text-orange-800 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            <span className="font-medium text-sm">
                              ยังไม่มีหน่วยงาน
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assign Department Section */}
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-3">
                        {/* Select Department Unit */}
                        <div className="relative">
                          <select
                            value={selectedUserDept || ""}
                            onChange={(e) =>
                              setSelectedUserDept(
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                          >
                            {user.userUnits.length > 0 ? (
                              <option
                                value={user.userUnits.map(
                                  (u: any) => u.unit.id,
                                )}
                              >
                                {user.userUnits.map((u: any) => u.unit.name)}
                              </option>
                            ) : (
                              <option value="">--เลือกหน่วยงาน--</option>
                            )}

                            {departments.map((dept: any) => (
                              <optgroup key={dept.id} label={dept.name}>
                                {dept.units.map((unit: any) => (
                                  <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="relative">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-blue-500 text-sm appearance-auto cursor-pointer"
                          >
                            <option value="MEMBER">สมาชิกทั่วไป</option>
                            {userPermission.permission === "superadmin" && (
                              <option value="HEAD">หัวหน้า</option>
                            )}
                          </select>
                        </div>

                        {/* Permissions - Minimal Grid */}
                        <div>
                          <div className="text-xs text-gray-600 mb-2">
                            สิทธิ์การใช้งาน:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { key: "read", label: "อ่าน" },
                              { key: "create", label: "สร้าง" },
                              { key: "edit", label: "แก้ไข" },
                              {
                                key: "delete",
                                label: "ลบ",
                                showIf:
                                  userPermission.permission === "superadmin",
                              },
                              {
                                key: "backdate",
                                label: "ลงเวลาอดีต",
                                showIf:
                                  userPermission.permission === "superadmin",
                              },
                              {
                                key: "bypass",
                                label: "ข้ามขั้น",
                                showIf:
                                  userPermission.permission === "superadmin",
                              },
                              {
                                key: "export",
                                label: "ส่งออก",
                                showIf:
                                  userPermission.permission === "superadmin",
                              },
                            ]
                              .filter((perm) => perm.showIf !== false)
                              .map((perm) => (
                                <button
                                  key={perm.key}
                                  onClick={() => {
                                    if (
                                      selectedUserPermissions.includes(perm.key)
                                    ) {
                                      setSelectedUserPermissions(
                                        selectedUserPermissions.filter(
                                          (p) => p !== perm.key,
                                        ),
                                      );
                                    } else {
                                      setSelectedUserPermissions([
                                        ...selectedUserPermissions,
                                        perm.key,
                                      ]);
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                    selectedUserPermissions.includes(perm.key)
                                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {perm.label}
                                </button>
                              ))}
                          </div>
                        </div>

                        {error && (
                          <div className="mt-2 animate-pulse">
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 border-l-3 border-red-500 rounded-r">
                              <AlertCircle className="w-4 h-4 text-red-600 animate-bounce" />
                              <span className="text-sm font-medium text-red-700">
                                {error}
                              </span>
                            </div>
                          </div>
                        )}

                        {info && (
                          <div className="mt-2 animate-pulse">
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 border-l-3 border-green-500 rounded-r">
                              <CheckCircle className="w-4 h-4 text-green-600 animate-bounce" />
                              <span className="text-sm font-medium text-green-700">
                                {info}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() =>
                              handleAssignDepartment(
                                user.id,
                                selectedUserDept,
                                selectedUserPermissions,
                                selectedRole,
                              )
                            }
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            ยืนยัน
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setSelectedUserDept(null);
                              setSelectedUserPermissions([]);
                              setSelectedRole("");
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        คลิกเพื่อกำหนดหน่วยงาน
                      </div>
                    )}
                  </td>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400">
                      {user.department ? "มีหน่วยงานแล้ว" : "รอกำหนดหน่วยงาน"}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setSelectedUserDept(null);
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                          ยกเลิก
                        </button>
                      ) : (
                        <button
                          disabled={!e}
                          onClick={() => {
                            e ? startEditing(user.id) : null;
                          }}
                          className={`flex items-center gap-2 px-3 py-2 
                          bg-linear-to-r ${e ? "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : "from-gray-600 to-gray-600 hover:from-gray-700 hover:to-gray-700 cursor-not-allowed disabled:cursor-not-allowed"}  text-white rounded-xl  
                          transition-all shadow text-sm`}
                        >
                          <Edit className="w-3 h-3" />
                          {e ? "กำหนดหน่วยงาน" : "ไม่ได้รับสิทธิ์"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {currentItems.length > 0 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
            {/* Result Info - แสดงบน Mobile และ Desktop */}
            <div className="mb-4 md:mb-0">
              <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                <span className="font-medium text-gray-900">
                  {startIndex + 1}
                </span>
                <span>ถึง</span>
                <span className="font-medium text-gray-900">
                  {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
                </span>
                <span>จากทั้งหมด</span>
                <span className="font-medium text-gray-900">
                  {filteredUsers.length}
                </span>
                <span>รายการ</span>
                <span className="hidden sm:inline text-gray-400 mx-1">•</span>
                <span className="hidden sm:inline text-gray-500">
                  หน้า <span className="font-medium">{currentPage}</span> จาก{" "}
                  <span className="font-medium">{totalPages}</span>
                </span>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Desktop Layout - แสดง Pagination Controls และ Page Selector */}
                <div className="hidden md:flex items-center gap-6 w-full">
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 
                       bg-white disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm
                       active:bg-gray-100 transition-all duration-200 group"
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

                    {/* Page Numbers - Adaptive */}
                    {(() => {
                      const pages = [];
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);

                      // Adjust if we're near the end
                      if (endPage - startPage < 4) {
                        startPage = Math.max(1, endPage - 4);
                      }

                      // First page
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium
                             text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                             transition-colors duration-200"
                            aria-label="ไปหน้าแรก"
                          >
                            1
                          </button>,
                        );

                        if (startPage > 2) {
                          pages.push(
                            <span
                              key="ellipsis-start"
                              className="flex items-center justify-center w-9 h-9 text-gray-400"
                            >
                              ...
                            </span>,
                          );
                        }
                      }

                      // Page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium
                             transition-all duration-200 ${
                               currentPage === i
                                 ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-sm scale-105"
                                 : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                             }`}
                            aria-label={`ไปหน้าที่ ${i}`}
                            aria-current={
                              currentPage === i ? "page" : undefined
                            }
                          >
                            {i}
                          </button>,
                        );
                      }

                      // Last page
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span
                              key="ellipsis-end"
                              className="flex items-center justify-center w-9 h-9 text-gray-400"
                            >
                              ...
                            </span>,
                          );
                        }

                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium
                             text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                             transition-colors duration-200"
                            aria-label="ไปหน้าสุดท้าย"
                          >
                            {totalPages}
                          </button>,
                        );
                      }

                      return pages;
                    })()}

                    {/* Next Button */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 
                       bg-white disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm
                       active:bg-gray-100 transition-all duration-200 group"
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

                  {/* Page Selector สำหรับ Desktop */}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      ไปที่หน้า:
                    </span>
                    <div className="relative">
                      <select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg 
                         bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
                        aria-label="เลือกหน้า"
                      >
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <option key={page} value={page}>
                            {page}
                          </option>
                        ))}
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

                {/* Mobile Layout - แสดง Pagination แบบกระชับ */}
                <div className="md:hidden w-full">
                  <div className="flex items-center justify-between">
                    {/* Previous Button สำหรับ Mobile */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 
                       bg-white disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-gray-50 hover:border-gray-400 
                       active:bg-gray-100 transition-all duration-200"
                      aria-label="หน้าที่ย้อนกลับ"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
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
                      <span className="text-sm font-medium text-gray-700">
                        ก่อนหน้า
                      </span>
                    </button>

                    {/* Current Page และ Total สำหรับ Mobile */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg">
                      <span className="text-sm text-gray-600">หน้า</span>
                      <span className="text-sm font-medium text-gray-900 min-w-1.5rem text-center">
                        {currentPage}
                      </span>
                      <span className="text-sm text-gray-600">จาก</span>
                      <span className="text-sm font-medium text-gray-900">
                        {totalPages}
                      </span>
                    </div>

                    {/* Next Button สำหรับ Mobile */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 
                       bg-white disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-gray-50 hover:border-gray-400 
                       active:bg-gray-100 transition-all duration-200"
                      aria-label="หน้าถัดไป"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        ถัดไป
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-600"
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

                  {/* Page Selector สำหรับ Mobile */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600">เลือกหน้า:</span>
                      <div className="relative">
                        <select
                          value={currentPage}
                          onChange={(e) =>
                            setCurrentPage(Number(e.target.value))
                          }
                          className="appearance-none pl-4 pr-8 py-2 text-sm border border-gray-300 rounded-lg 
                           bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:border-blue-500 cursor-pointer w-32"
                        >
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <option key={page} value={page}>
                              หน้า {page}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignDepartment;

