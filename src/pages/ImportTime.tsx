import { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Sun,
  Moon,
  ChevronDown,
  Users,
  Search,
  User,
  // AlertCircle,
  LogIn,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { getUserFromToken } from "../utils/authService";
import {
  ensureArray,
  formatDateTime,
  getShiftLabel,
  getThaiMonth,
  useCheckSubPermission,
} from "../utils/helper";
import {
  Get_filtered_Import_Date,
  Get_filtered_Import_User_Data,
} from "../services/serviceGet";
import type { ImportDateTime, ImportTimeUserData } from "../types/types";
import { Put_update_user } from "../services/servicePut";
import { useAlert } from "../contexts/AlertContext";
import { Post_Import_Time } from "../services/servicePost";
import { useConfirm } from "../contexts/useConfirm";
import { Delete_Import_Time } from "../services/serviceDelete";

// ---------- Types ----------
interface BareUser {
  email: string;
  firstname: string;
  lastname: string;
}
interface UserUnit {
  user: BareUser;
}
interface Organization {
  name: string;
}
interface Unit {
  id: number;
  name: string;
  organization: Organization;
  userUnits: UserUnit[];
}
interface TimeRecord {
  id: number;
  userId: string; // email
  userName: string; // ชื่อ-นามสกุล
  day: string;
  month: string;
  year: string;
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  shiftType: "morning" | "night";
}
interface SelectUser {
  email: string;
  firstname: string;
  lastname: string;
}

const ImportTime = () => {
  // Unit (เมื่อไม่ใช่ superadmin), ถ้า superadmin จะเป็น null
  const [unitData, setUnitData] = useState<Unit | null>(null);
  // รายชื่อผู้ใช้ทั้งหมด (normalize แล้ว)
  const [selectableUsers, setSelectableUsers] = useState<SelectUser[]>([]);
  // รายการเวลา
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<number | null>(null);

  // ฟอร์มเพิ่ม/แก้ไขเวลา (ใน Modal: Single-Select)
  // const [selectedUser, setSelectedUser] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState<"morning" | "night">(
    "morning",
  );
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  // ฟิลเตอร์วัน/เดือน/ปี
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Filter Name Selector (Single-Select + Search)
  const [isEmpOpenFilter, setIsEmpOpenFilter] = useState(false);
  const [empSearchFilter, setEmpSearchFilter] = useState("");
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<SelectUser | null>(
    null,
  );
  const empFilterRef = useRef<HTMLDivElement | null>(null);

  // Modal Employee Selector (Single-Select + Search)
  const [isEmpOpen, setIsEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<SelectUser | null>(null);
  const empRef = useRef<HTMLDivElement | null>(null);

  const { showAlert } = useAlert();

  // เก็บพารามิเตอร์ค้นหาครั้งล่าสุดไว้เพื่อรีเฟรช
  const lastQueryRef = useRef<{
    monthTH: string;
    beYearStr: string;
    dayStr: string;
    selectedEmail: string;
  } | null>(null);

  const hasDataUser = useRef(false);
  const user = getUserFromToken() || {};

  // Permission
  const r = useCheckSubPermission("read");
  const e = useCheckSubPermission("edit");
  const d = useCheckSubPermission("delete");
  const c = useCheckSubPermission("create");
  const bd = useCheckSubPermission("backdate");
  // const bp = useCheckSubPermission("bypass");
  // const exf = useCheckSubPermission("export");

  // ---------- Initial fetch ----------
  useEffect(() => {
    if (r) {
      if (hasDataUser.current) return;
      hasDataUser.current = true;
      fetchDataUser();
    } else {
      showAlert({
        title: "เกิดข้อผิดพลาด",
        message: "คุณไม่มีสิทธิ์อ่านข้อมูลหน้านี้",
        type: "error",
      });
    }
  }, []);

  const fetchDataUser = async () => {
    setLoading(true);
    try {
      const payload = {
        email: user.email,
        unitId: user.unitHeads?.[0]?.unitId,
        isActive: user.unitHeads?.[0]?.isActive,
      };
      const response = await Get_filtered_Import_Date(
        payload as ImportTimeUserData,
      );
      if (!response?.success) {
        showAlert({
          title: "เกิดข้อผิดพลาด",
          message: response.message,
          type: "error",
        });
        setSelectableUsers([]);
        setUnitData(null);
        setTimeRecords([]);
        return;
      }
      const results: any[] = Array.isArray(response.results)
        ? response.results
        : [];
      const { users, unit } = normalizeResultsToSelectableUsersAndUnit(results);
      setSelectableUsers(users);
      setUnitData(unit ?? null);
      setTimeRecords([]);
    } catch (err) {
      showAlert({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถดึงข้อมูลพนักงานได้",
        type: "error",
      });
      setSelectableUsers([]);
      setUnitData(null);
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Normalize ----------
  const normalizeResultsToSelectableUsersAndUnit = (
    results: any[],
  ): {
    users: SelectUser[];
    unit: Unit | null;
  } => {
    if (Array.isArray(results) && results[0]?.unit) {
      const unit = results[0].unit as Unit;
      const users: SelectUser[] = (unit.userUnits ?? [])
        .map((uu) => toSelectUser(uu?.user))
        .filter(Boolean) as SelectUser[];
      return { users, unit };
    }
    const users = results
      .map((u) => toSelectUser(u))
      .filter(Boolean) as SelectUser[];
    return { users, unit: null };
  };

  const toSelectUser = (u: any): SelectUser | null => {
    if (!u) return null;
    const email = u.email;
    const firstname = u.firstname;
    const lastname = u.lastname;
    if (!email || !firstname || !lastname) return null;
    return { email, firstname, lastname };
  };

  // ---------- Helpers ----------

  const resetForm = () => {
    // setSelectedUser("");
    setSelectedDate("");
    setSelectedShift("morning");
    setCheckInTime("");
    setCheckOutTime("");
  };

  // ---------- Thai Month/Year ----------
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const uniqueMonths = thaiMonths;
  const daysOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => String(i + 1)),
    [],
  );
  const currentBE = new Date().getFullYear() + 543;
  const uniqueYears = useMemo(() => {
    const span = 8;
    return Array.from({ length: span }, (_, i) => currentBE - i);
  }, [currentBE]);

  // ---------- Employee lists ----------
  const deriveFromUnitData = (u: any): SelectUser[] => {
    if (u?.unit?.userUnits && Array.isArray(u.unit.userUnits)) {
      return u.unit.userUnits
        .map((uu: any) => uu?.user)
        .filter(Boolean)
        .map((us: any) => ({
          email: us.email,
          firstname: us.firstname,
          lastname: us.lastname,
        }));
    }
    if (Array.isArray(u)) {
      return u
        .filter((us: any) => us?.email && us?.firstname && us?.lastname)
        .map((us: any) => ({
          email: us.email,
          firstname: us.firstname,
          lastname: us.lastname,
        }));
    }
    return [];
  };

  const allEmployees: SelectUser[] = useMemo(() => {
    if (selectableUsers && selectableUsers.length > 0) return selectableUsers;
    return deriveFromUnitData(unitData);
  }, [selectableUsers, unitData]);

  const filteredEmployees = useMemo(() => {
    const term = empSearch.trim().toLowerCase();
    if (!term) return allEmployees;
    return allEmployees.filter((e) =>
      `${e.firstname} ${e.lastname}`.toLowerCase().includes(term),
    );
  }, [empSearch, allEmployees]);

  // ปิด dropdown เมื่อคลิกนอก (Filter + Modal)
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        empFilterRef.current &&
        !empFilterRef.current.contains(e.target as Node)
      ) {
        setIsEmpOpenFilter(false);
      }
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setIsEmpOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ---------- Fetch (Single) ----------
  const handleFetchSingle = async () => {
    if (!selectedEmpFilter) {
      showAlert({
        type: "warning",
        message: "กรุณาเลือกพนักงาน",
        title: "คําเตือน!",
      });
      return;
    }
    if (!selectedMonth || !selectedYear) {
      showAlert({
        type: "warning",
        message: "กรุณาเลือก วัน / เดือน / ปี ให้ครบถ้วน",
        title: "คําเตือน!",
      });
      return;
    }

    const monthIndex = thaiMonths.indexOf(selectedMonth);
    if (monthIndex < 0) {
      showAlert({
        type: "warning",
        message: "ค่าเดือนไม่ถูกต้อง",
        title: "คําเตือน!",
      });
      return;
    }

    const beYear = parseInt(selectedYear, 10);
    if (Number.isNaN(beYear)) {
      showAlert({
        type: "warning",
        message: "ค่าปีไม่ถูกต้อง",
        title: "คําเตือน!",
      });
      return;
    }

    const day = parseInt(selectedDay, 10);
    const year = beYear; // พ.ศ. -> ค.ศ.

    lastQueryRef.current = {
      monthTH: selectedMonth,
      beYearStr: selectedYear,
      dayStr: selectedDay || "",
      selectedEmail: selectedEmpFilter.email,
    };

    try {
      setLoading(true);

      const payload = {
        userEmail: user.email,
        months: selectedMonth,
        years: year,
        day: Number.isNaN(day) ? null : day,
        email: selectedEmpFilter.email,
      };

      const resp = await Get_filtered_Import_User_Data(payload as any);
      const mergedRaw = ensureArray(
        (resp && (resp.results ?? resp.data)) ?? resp ?? [],
      );
      // const mapped = toTimeRecordsArray(mergedRaw, allEmployees);
      setTimeRecords(mergedRaw);
    } catch (err) {
      console.error("handleFetchSingle error:", err);
      showAlert({
        type: "error",
        message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        title: "เกิดข้อผิดพลาด",
      });
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const refetchLast = async () => {
    const last = lastQueryRef.current;
    if (!last) return;

    const beYear = parseInt(last.beYearStr, 10);
    const year = beYear;
    const day = last.dayStr ? parseInt(last.dayStr, 10) : NaN;

    try {
      setLoading(true);

      const payload = {
        userEmail: user.email,
        months: last.monthTH,
        years: year,
        day: Number.isNaN(day) ? null : day,
        email: last.selectedEmail,
      };

      const resp = await Get_filtered_Import_User_Data(payload as any);
      const mergedRaw = ensureArray(
        (resp && (resp.results ?? resp.data)) ?? resp ?? [],
      );
      // const mapped = toTimeRecordsArray(mergedRaw, allEmployees);
      setTimeRecords(mergedRaw);
    } catch (err) {
      console.error("refetchLast error:", err);
      setTimeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Add/Edit/Delete (UI only) ----------
  const handleAddRecord = async () => {
    if (!selectedDate) {
      showAlert({
        type: "warning",
        message: "กรุณาเลือกวันที่",
        title: "คําเตือน!",
      });
      return;
    }

    try {
      const newDate = new Date(selectedDate);
      const day = newDate.getDate();
      const month = newDate.getMonth() + 1;
      const year = newDate.getFullYear() + 543;

      const coverMonthThai = getThaiMonth(month);

      const payload: ImportDateTime = {
        userEmail: user.email ?? "",
        startTime: checkInTime,
        endTime: checkOutTime,
        shiftType: selectedShift,
        userId: selectedEmp,
        day: day,
        month: coverMonthThai,
        year: year,
      };

      const resp = await Post_Import_Time(payload);

      if (!resp.success) {
        showAlert({
          type: "error",
          message: resp.message,
          title: "เกิดข้อผิดพลาด",
        });
        return;
      }

      await fetchDataUser();

      showAlert({
        type: "success",
        message:
          "เพิ่มข้อมูลเวลาเข้าออกสำเร็จ! กรุณาตรวจสอบข้อมูล โดยค้นหาวันที่และพนักงาน อีกครั้ง",
        title: "สําเร็จ!",
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("handleAddRecord error:", error);
      setShowAddModal(false);
    } finally {
      setShowAddModal(false);
    }
  };

  const handleUpdateRecord = async (id: number) => {
    if (!checkInTime) {
      showAlert({
        type: "warning",
        message: "กรุณากรอกเวลาเข้างาน",
        title: "คําเตือน!",
      });
      return;
    }

    const payload = {
      userEmail: user.email,
      id: id,
      startTime: checkInTime,
      endTime: checkOutTime ?? null,
      shiftType: selectedShift,
    };

    const resp = await Put_update_user(payload as any);

    if (!resp) {
      showAlert({
        type: "warning",
        message: "อัพเดทข้อมูลไม่สําเร็จ!",
        title: "คําเตือน!",
      });
      return;
    }

    // setTimeRecords(updatedRecords);
    setEditingRecord(null);
    resetForm();
    showAlert({
      type: "success",
      message: "อัพเดทข้อมูลสำเร็จ!",
      title: "สําเร็จ!",
    });
    await refetchLast();
  };

  const confirm = useConfirm();

  const handleDeleteRecord = async (id: number) => {
    const isConfirmed = await confirm(
      "ลบข้อมูลพนักงาน?",
      "หากลบข้อมูลแล้วจะไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?",
    );
    const email = user.email ?? "";
    if (isConfirmed) {
      const resp = await Delete_Import_Time(id, email);

      if (!resp) {
        showAlert({
          type: "warning",
          message: "ลบข้อมูลไม่สําเร็จ!",
          title: "คําเตือน!",
        });
        return;
      }

      showAlert({
        type: "success",
        message: "ลบข้อมูลสําเร็จ!",
        title: "สําเร็จ!",
      });

      await refetchLast();
    } else {
      showAlert({
        type: "warning",
        message: "ลบข้อมูลไม่สําเร็จ!",
        title: "คําเตือน!",
      });
      setTimeRecords([]);
    }
  };

  const startEdit = (record: TimeRecord) => {
    setEditingRecord(record.id);
    setCheckInTime(record.startTime);
    setCheckOutTime(record.endTime);
    setSelectedShift(record.shiftType);
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    resetForm();
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-900 to-gray-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                จัดการเวลาเข้าออก
              </h2>
              <p className="text-gray-600 mt-1">
                {unitData?.name && unitData?.organization?.name
                  ? `${unitData.name} - ${unitData.organization.name}`
                  : user?.permission === "superadmin"
                    ? "โหมดซุปเปอร์แอดมิน"
                    : "-"}
              </p>
            </div>
          </div>
          <button
            onClick={() => (c ? setShowAddModal(true) : setShowAddModal(false))}
            className="flex items-center space-x-2 bg-blue-300 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" /> เดือน
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">เลือกเดือน...</option>
                {uniqueMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" /> วัน
            </label>
            <div className="relative">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">เลือกวัน...</option>
                {daysOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" /> ปี (พ.ศ.)
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">เลือกปี...</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Name Selector (Filter - Single) */}
          <div className="relative" ref={empFilterRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" /> เลือกพนักงาน
              (เลือกได้คนเดียว)
            </label>

            <button
              type="button"
              onClick={() => setIsEmpOpenFilter((v) => !v)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <span
                className={`truncate text-left ${
                  selectedEmpFilter ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {selectedEmpFilter
                  ? `${selectedEmpFilter.firstname} ${selectedEmpFilter.lastname}`
                  : "คลิกเพื่อเลือกพนักงาน..."}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isEmpOpenFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {isEmpOpenFilter && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                <div className="relative p-2 border-b border-gray-100">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={empSearchFilter}
                    onChange={(e) => setEmpSearchFilter(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อพนักงาน..."
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {(empSearchFilter
                    ? allEmployees.filter((e) =>
                        `${e.firstname} ${e.lastname}`
                          .toLowerCase()
                          .includes(empSearchFilter.trim().toLowerCase()),
                      )
                    : allEmployees
                  ).map((emp) => {
                    const fullname = `${emp.firstname} ${emp.lastname}`;
                    const isSelected = selectedEmpFilter?.email === emp.email;
                    return (
                      <button
                        key={emp.email}
                        onClick={() => {
                          setSelectedEmpFilter(emp);
                          setIsEmpOpenFilter(false);
                          setEmpSearchFilter("");
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{fullname}</span>
                      </button>
                    );
                  })}

                  {empSearchFilter &&
                    allEmployees.filter((e) =>
                      `${e.firstname} ${e.lastname}`
                        .toLowerCase()
                        .includes(empSearchFilter.trim().toLowerCase()),
                    ).length === 0 &&
                    allEmployees.length > 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        ไม่พบพนักงานที่ตรงกับ “{empSearchFilter}”
                      </div>
                    )}

                  {!empSearchFilter && allEmployees.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      ยังไม่มีรายชื่อพนักงาน
                    </div>
                  )}
                </div>

                {selectedEmpFilter && (
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedEmpFilter(null)}
                      className="w-full text-sm text-gray-600 hover:text-red-600 py-2 rounded-lg"
                    >
                      ล้างการเลือก
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleFetchSingle}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            ดึงข้อมูล
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">จำนวนพนักงาน</p>
              <p className="text-3xl font-bold text-blue-600">
                {allEmployees.length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">รายการทั้งหมด</p>
              <p className="text-3xl font-bold text-green-600">
                {timeRecords.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">ปกติ</p>
              <p className="text-3xl font-bold text-yellow-600">
                {timeRecords.filter((r) => r.shiftType === "morning").length}
              </p>
            </div>
            <Sun className="w-12 h-12 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">เวรดึก</p>
              <p className="text-3xl font-bold text-blue-600">
                {timeRecords.filter((r) => r.shiftType === "night").length}
              </p>
            </div>
            <Moon className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-100 bg-linear-to-r from-blue-50/30 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                <span className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  รายการเวลาเข้าออก
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                อัพเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
              </p>
            </div>
            {/* <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหารายการ..."
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4 inline mr-1" />
                เพิ่มรายการ
              </button>
            </div> */}
          </div>
        </div>

        {timeRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-base font-medium text-gray-700 mb-2">
              ไม่พบรายการเวลาเข้าออก
            </h4>
            <p className="text-gray-500 text-sm mb-4">
              เริ่มต้นการบันทึกเวลาของคุณ
            </p>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50 to-blue-50/30 border-y border-gray-200">
                    {[
                      { label: "วันที่", icon: Calendar },
                      { label: "เวร", icon: Clock },
                      { label: "เข้า", icon: LogIn },
                      { label: "ออก", icon: LogOut },
                      { label: "ผู้แก้ไข", icon: User },
                      { label: "", icon: MoreVertical },
                    ].map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <header.icon className="w-4 h-4 text-blue-500" />
                          {header.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timeRecords.map((record: any) => (
                    <tr
                      key={record.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center bg-blue-50 rounded-lg p-2">
                            <span className="text-lg font-bold text-blue-700">
                              {record.day}
                            </span>
                            <span className="text-xs text-blue-500">
                              {record.month.substring(0, 3)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.year}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="px-6 py-4">
                        {editingRecord === record.id ? (
                          <select
                            value={selectedShift}
                            onChange={(e) =>
                              setSelectedShift(
                                e.target.value as "morning" | "night",
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="morning">ปกติ</option>
                            <option value="night">ดึก</option>
                          </select>
                        ) : (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${
                              record.shiftType === "night"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                record.shiftType === "night"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            ></div>
                            <span className="text-sm font-medium">
                              {getShiftLabel(record.shiftType)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Check-in */}
                      <td className="px-6 py-4">
                        {editingRecord === record.id ? (
                          <input
                            type="time"
                            step="1"
                            value={checkInTime}
                            onChange={(e) => setCheckInTime(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {record.startTime}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.locationNameIn}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Check-out */}
                      <td className="px-6 py-4">
                        {editingRecord === record.id ? (
                          <input
                            type="time"
                            step="1"
                            value={checkOutTime}
                            onChange={(e) => setCheckOutTime(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {record.endTime || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.locationNameOut || "-"}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Edited By */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {record?.headEdit?.firstname ? (
                            <>
                              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold">
                                {record.headEdit.firstname.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.headEdit.firstname}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDateTime(record.lastEditedAt)}
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {editingRecord === record.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateRecord(record.id)}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                title="บันทึก"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                title="ยกเลิก"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              {e && bd && (
                                <button
                                  onClick={() => startEdit(record)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {d && (
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                {/* <div>
                  แสดง{" "}
                  <span className="font-medium text-gray-800">
                    {timeRecords.length}
                  </span>{" "}
                  รายการ
                </div> */}
                {/* <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                    <ChevronLeft className="w-4 h-4" />
                    ก่อนหน้า
                  </button>
                  <span className="text-gray-800">หน้า 1 จาก 5</span>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                    ถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div> */}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Time Record Modal (Single-Select) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/70  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                เพิ่มเวลาเข้าออก
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Employee Single-Select (Modal) */}
              <div className="relative" ref={empRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" /> เลือกพนักงาน
                  (เลือกได้คนเดียว)
                </label>

                <button
                  type="button"
                  onClick={() => setIsEmpOpen((v) => !v)}
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <span
                    className={`truncate text-left ${
                      selectedEmp ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {selectedEmp
                      ? `${selectedEmp.firstname} ${selectedEmp.lastname}`
                      : "คลิกเพื่อเลือกพนักงาน..."}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isEmpOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isEmpOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                    <div className="relative p-2 border-b border-gray-100">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        placeholder="พิมพ์ค้นหาชื่อพนักงาน..."
                        className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {(empSearch ? filteredEmployees : allEmployees).map(
                        (emp) => {
                          const fullname = `${emp.firstname} ${emp.lastname}`;
                          const isSelected = selectedEmp?.email === emp.email;
                          return (
                            <button
                              key={emp.email}
                              onClick={() => {
                                setSelectedEmp(emp);
                                setIsEmpOpen(false);
                                setEmpSearch("");
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                            >
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{fullname}</span>
                            </button>
                          );
                        },
                      )}

                      {empSearch &&
                        filteredEmployees.length === 0 &&
                        allEmployees.length > 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            ไม่พบพนักงานที่ตรงกับ “{empSearch}”
                          </div>
                        )}

                      {!empSearch && allEmployees.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          ยังไม่มีรายชื่อพนักงาน
                        </div>
                      )}
                    </div>

                    {selectedEmp && (
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={() => setSelectedEmp(null)}
                          className="w-full text-sm text-gray-600 hover:text-red-600 py-2 rounded-lg"
                        >
                          ล้างการเลือก
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวร <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedShift("morning")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                      selectedShift === "morning"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 hover:border-yellow-300"
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-medium">ปกติ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShift("night")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                      selectedShift === "night"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-medium">เวรดึก</span>
                  </button>
                </div>
              </div>

              {/* Check In Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาเข้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  step="1"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Check Out Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาออก <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  step="1"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddRecord}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                เพิ่มข้อมูล
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTime;
