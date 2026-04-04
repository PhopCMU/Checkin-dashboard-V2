import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Calendar,
  FileText,
  Download,
  Search,
  Filter,
  X,
  User,
  ChevronDown,
  Users,
  Eye,
  Clock,
  Tag,
  Trash2,
  RefreshCw,
  Info,
  MapPin,
  LogOut,
  AlertCircle,
  Building,
  CheckCircle,
  LogIn,
  Mail,
  UserCheck,
  Timer,
} from "lucide-react";
import { Get_data_users, Get_filtered_reports } from "../services/serviceGet"; // เปลี่ยนชื่อให้ชัด
import { getUserFromToken } from "../utils/authService";
import {
  getDaysInMonth,
  getLastFiveBuddhistYears,
  getMonthIndexByName,
  getThaiMonths,
} from "../utils/util";
import { useAlert } from "../contexts/AlertContext";
import type { ReportData, StaffName, UserResult } from "../types/types";
import { toUserResult, useCheckSubPermission } from "../utils/helper";
import { createAttendanceSheetData, headerValues } from "../utils/attendance";
import { exportXlsxForUser } from "../utils/exportXlsxForUser";

const Reports = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<StaffName[]>([]);
  const [allStaff, setAllStaff] = useState<StaffName[]>([]); // เก็บรายชื่อพนักงานทั้งหมด
  const [selectedStaff, setSelectedStaff] = useState<StaffName[]>([]);
  const [seeReport, setSeeReport] = useState<ReportData | null>(null);
  const hasFetchedStaff = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = getUserFromToken() || {};
  const { showAlert } = useAlert();

  // Permission
  const r = useCheckSubPermission("read");
  const exf = useCheckSubPermission("export");

  // 🔑 ดึงรายชื่อพนักงานทั้งหมด (เฉพาะชื่อ) เพื่อให้เลือก
  useEffect(() => {
    if (!r && !exf)
      return showAlert({
        message: "คุณไม่มีสิทธิ์ใช้งานหน้านี้",
        type: "error",
        title: "ไม่มีสิทธิ์",
      });
    if (!hasFetchedStaff.current) {
      hasFetchedStaff.current = true;
      fetchAllStaffNames();
    }
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setNameDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAllStaffNames = async () => {
    try {
      const response = await Get_data_users(user.email ?? "");
      const data = Array.isArray(response) ? response : [];
      setAllStaff(data);
    } catch (error) {
      console.error("Error fetching staff names:", error);
      setAllStaff([]);
    }
  };

  // === Export Excel ===
  const handleDownload = useCallback(async (report: any) => {
    if (
      !Array.isArray(report.userCheckInDates) ||
      report.userCheckInDates.length === 0
    ) {
      return; // ไม่มีข้อมูล ไม่ต้องทำอะไร
    }
    const user: UserResult = toUserResult(report);
    await exportXlsxForUser(user);
  }, []);

  // ค้นหารายชื่อเมื่อพิมพ์
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const results = allStaff
        .filter((staff) => {
          const fullname = `${staff.firstname} ${staff.lastname}`.toLowerCase();
          return fullname.includes(term);
        })
        .filter((staff) => {
          return !selectedStaff.some((selected) => selected.id === staff.id);
        })
        .slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, allStaff, selectedStaff]);

  const addStaff = (staff: StaffName) => {
    // ป้องกัน id ซ้ำ
    if (selectedStaff.some((s) => s.id === staff.id)) return;

    setSelectedStaff((prev) => [...prev, staff]);
    setSearchTerm("");
    setNameDropdownOpen(false);
  };

  const removeStaff = (id: number) => {
    setSelectedStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSearch = async () => {
    // ✅ เตรียม payload: ส่งทั้ง staffIds และ fullnames (เลือกใช้ตาม backend)
    const staffIds =
      selectedStaff.length > 0 ? selectedStaff.map((s) => s.id) : null;
    // const fullnames =
    //   selectedStaff.length > 0
    //     ? selectedStaff.map((s) => `${s.firstname} ${s.lastname}`)
    //     : null;
    const emails =
      selectedStaff.length > 0 ? selectedStaff.map((s) => s.email) : null;

    const payload = {
      email: user.email,
      day: selectedDay ? parseInt(selectedDay) : null,
      months: selectedMonth ? selectedMonth : null,
      years: selectedYear ? parseInt(selectedYear) : null,
      staffIds,
      emails,
      // fullnames,
    };

    setLoading(true);
    try {
      if (!payload.months)
        return showAlert({
          type: "warning",
          title: "คําเตือน!",
          message: "กรุณาเลือกเดือน",
        });

      if (!payload.years)
        return showAlert({
          type: "warning",
          title: "คําเตือน!",
          message: "กรุณาเลือกปี",
        });

      if (!payload.staffIds || payload.staffIds.length === 0) {
        return showAlert({
          type: "warning",
          title: "คําเตือน!",
          message: "กรุณาเลือกพนักงานอย่างน้อย 1 คน",
        });
      }

      const response = await Get_filtered_reports(payload as any);

      if (!response) {
        return showAlert({
          type: "warning",
          title: "คําเตือน!",
          message: "ไม่พบรายงาน",
        });
      }

      showAlert({
        type: "success",
        title: "สำเร็จ!",
        message: "ค้นหารายงานเรียบร้อยแล้ว",
      });
      setReports(response);
    } catch (error) {
      console.error("Error fetching filtered reports:", error);
      setReports([]);
      showAlert({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถค้นหารายงานได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedNames([]);
    setSearchTerm("");
    setSearchResults([]);
    setNameDropdownOpen(false);
    setReports([]);
  };

  // แปลงชื่อเดือน → เลขเดือน
  const monthNumber = selectedMonth ? getMonthIndexByName(selectedMonth) : null;
  // ดึงวันที่ที่ถูกต้องตามปีและเดือน
  const daysOptions = monthNumber
    ? getDaysInMonth(parseInt(selectedYear), monthNumber)
    : [];

  // ดึงค่าเดือน/ปี (ไม่ขึ้นกับ reports)
  const uniqueMonths = getThaiMonths();
  const uniqueYears = getLastFiveBuddhistYears();

  // สมมติ seeReport เป็นอ็อบเจ็กต์เดียวของผู้ใช้คนนี้
  const userReport: UserResult | null = seeReport
    ? toUserResult(seeReport)
    : null;

  // แถวที่พร้อมแสดง (จะเป็น string[][])

  const displayRows = useMemo(() => {
    if (!userReport) return [];
    const matrix = createAttendanceSheetData([userReport]); // {value}[][]

    // แปลงเป็น string[][] พร้อม "ตัดเศษ" สำหรับคอลัมน์ชั่วโมง index 9
    return matrix.map((row) =>
      row.map((cell, idx) => {
        const v = cell.value;

        if (idx === 9) {
          // ชั่วโมงทำงาน → บังคับเป็นจำนวนเต็ม (ตัดเศษ)
          const num = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
          const intHours = Number.isFinite(num) ? Math.trunc(num) : 0;
          return intHours; // เก็บเป็น Number จำนวนเต็ม
        }

        // คอลัมน์อื่นคงรูปแบบเดิมเป็น string
        return typeof v === "string" ? v : String(v ?? "");
      }),
    );
  }, [userReport]);

  // รวมชั่วโมงทำงานของผู้ใช้รายนี้ (คอลัมน์ index 9)

  const totalHours = useMemo(() => {
    return displayRows.reduce((acc, row) => {
      const val = row[9]; // ชั่วโมงทำงาน (ตอนนี้เราเก็บเป็นจำนวนเต็มในข้อ 1)
      const num = typeof val === "number" ? val : parseFloat(String(val));
      const safe = Number.isFinite(num) ? num : 0;
      return acc + safe;
    }, 0);
  }, [displayRows]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold">
                  รายงานและเอกสาร
                </h1>
                <p className="text-blue-100">
                  จัดการ ดาวน์โหลด และดูรายงานข้อมูลต่างๆ ของพนักงาน
                </p>
              </div>
              <button
                onClick={fetchAllStaffNames}
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>รีเฟรชรายชื่อ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  ค้นหาและกรอง
                </h2>
                <p className="text-sm text-gray-600">
                  ปรับแต่งการค้นหาตามต้องการ
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างทั้งหมด</span>
            </button>
          </div>

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
                <Calendar className="w-4 h-4 inline mr-2" /> วัน{" "}
                <span className="text-gray-400">
                  (ถ้าต้องการทั้งเดือนไม่ต้องเลือกวันที่)
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">ทุกวัน</option>
                  {daysOptions.map((day: any) => (
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

            {/* Name Selector */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" /> เลือกบุคคลากร
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setNameDropdownOpen(true);
                  }}
                  onFocus={() => setNameDropdownOpen(true)}
                  placeholder="ค้นหาชื่อพนักงาน..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {nameDropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((staff) => {
                    const fullname = `${staff.firstname} ${staff.lastname}`;
                    return (
                      <button
                        key={staff.id}
                        onClick={() => addStaff(staff)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{fullname}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Names Tags */}
          {selectedStaff.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  พนักงานที่เลือก ({selectedNames.length} คน)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedStaff.map((staff) => {
                  const fullname = `${staff.firstname} ${staff.lastname}`;
                  return (
                    <div
                      key={staff.id}
                      className="group flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">{fullname}</span>
                      <button
                        onClick={() => removeStaff(staff.id)}
                        className="ml-1 p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setSelectedStaff([])}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">ลบทั้งหมด</span>
                </button>
              </div>
            </div>
          )}

          {/* ปุ่มค้นหา */}
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="font-medium">
                {loading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}
              </span>
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? null : reports.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">รายงานที่ค้นพบ</h3>
              <span className="text-sm text-gray-600">
                {reports.length} รายการ
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {reports.map((report) => {
                const hasData =
                  Array.isArray(report.userCheckInDates) &&
                  report.userCheckInDates.length > 0;

                return (
                  <div
                    key={report.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>

                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-900">
                              {report.firstname} {report.lastname}
                            </h4>

                            {report.userUnits?.length > 0 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {report.userUnits
                                  .map(
                                    (d: any) => d?.name ?? d?.unit?.name ?? "-",
                                  )
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* ดูรายงาน */}
                        <button
                          onClick={() => hasData && setSeeReport(report)}
                          className={`flex ${
                            hasData
                              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              : "bg-gray-50 text-gray-600 cursor-not-allowed"
                          } items-center gap-2 px-4 py-2 rounded-lg`}
                          disabled={!hasData}
                          aria-disabled={!hasData}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {hasData ? "ดูรายงาน" : "ไม่มีรายงาน"}
                          </span>
                        </button>

                        {/* ดาวน์โหลด */}
                        <button
                          onClick={() =>
                            hasData && r && exf ? handleDownload(report) : null
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity ${
                            hasData
                              ? "bg-linear-to-r from-green-500 to-emerald-600 text-white hover:opacity-90"
                              : "bg-gray-50 text-gray-600 cursor-not-allowed"
                          }`}
                          disabled={!hasData}
                          aria-disabled={!hasData}
                          title={
                            hasData && r && exf
                              ? "ดาวน์โหลดรายงาน XLSX"
                              : "ไม่สามารถดาวน์โหลดได้"
                          }
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {hasData ? "ดาวน์โหลด" : "ไม่สามารถดาวน์โหลดได้"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !loading && reports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบรายงานที่ตรงกับเงื่อนไข
            </h3>
            <p className="text-gray-600 mb-6">
              ลองเปลี่ยนเงื่อนไขการค้นหาหรือเลือกตัวกรองอื่น
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : null}
      </div>

      {/* Modal See Report */}
      {seeReport && (
        <div className="fixed inset-0 pt-20 lg:pt-24 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-6xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col animate-slideUp my-4 sm:my-8">
            {/* Header Modal - Fixed */}
            <div className="sticky top-0 z-20 bg-linear-to-r from-blue-600 to-indigo-700 text-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      รายงานการลงเวลา
                    </h2>
                    <p className="text-blue-100 text-xs sm:text-sm opacity-90 mt-0.5">
                      สรุปข้อมูลการทำงานประจำวัน
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSeeReport(null)}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-all duration-200 active:scale-95"
                  aria-label="ปิด"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* ข้อมูลพนักงาน */}
            {seeReport && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                        {seeReport.firstname?.charAt(0)}
                        {seeReport.lastname?.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                        <UserCheck className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                        {seeReport.firstname} {seeReport.lastname}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                        <p className="text-xs sm:text-sm text-gray-600">
                          {seeReport.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className="bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200 flex items-center gap-2 min-w-0">
                      <Building className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                        {seeReport.userUnits?.length > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {seeReport.userUnits
                              .map((d: any) => d?.unit?.name ?? "ไม่มีหน่วยงาน")
                              .join(", ")}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {displayRows.length} วัน
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        ชั่วโมงรวม {totalHours} ชม.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* เนื้อหาหลักที่สามารถ scroll ได้ */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6">
                {/* ตัวกรอง */}
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Filter className="w-4 h-4" />
                        <span>แสดงคอลัมน์</span>
                      </div>

                      {/* ✅ แก้ mapping ให้ได้ index เดิม + เพิ่มคอลัมน์ชั่วโมง (index 9) */}
                      <div className="flex flex-wrap gap-2">
                        {headerValues
                          .map((h, i) => ({ h, i })) // เก็บ index เดิมไว้
                          .filter(({ i }) =>
                            [2, 5, 6, 7, 3, 4, 8, 9].includes(i),
                          ) // เพิ่ม index 9 = ชั่วโมงทำงาน
                          .map(({ h, i }) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-gray-300 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{h}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          r && exf ? handleDownload(seeReport) : null
                        }
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {r && exf ? "Export" : "ไม่ได้รับสิทธิ์"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* สำหรับ Mobile: Card View */}
                <div className="md:hidden">
                  {displayRows.length > 0 ? (
                    <div className="space-y-3">
                      {displayRows.map((row, idx) => {
                        // ✅ ดึงชั่วโมงทำงานจาก index 9
                        const [
                          ,
                          ,
                          date,
                          inLoc,
                          outLoc,
                          shiftLabel,
                          start,
                          end,
                          status,
                          hours,
                        ] = row;

                        const getStatusColor = () => {
                          switch (status) {
                            case "ตรงเวลา":
                              return "bg-green-100 text-green-800 border-green-200";
                            case "สาย":
                              return "bg-yellow-100 text-yellow-800 border-yellow-200";
                            default:
                              return "bg-red-100 text-red-800 border-red-200";
                          }
                        };

                        const getStatusIcon = () => {
                          switch (status) {
                            case "ตรงเวลา":
                              return <CheckCircle className="w-4 h-4" />;
                            case "สาย":
                              return <Clock className="w-4 h-4" />;
                            default:
                              return <AlertCircle className="w-4 h-4" />;
                          }
                        };

                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-gray-800">
                                  {date}
                                </span>
                              </div>
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getStatusColor()}`}
                              >
                                {getStatusIcon()}
                                <span className="text-xs font-medium">
                                  {status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-xs">กะทำงาน</span>
                                </div>
                                <div className="font-medium text-sm">
                                  {shiftLabel}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <LogIn className="w-3.5 h-3.5" />
                                  <span className="text-xs">เวลาเข้า</span>
                                </div>
                                <div className="font-medium text-sm">
                                  {start || "-"}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span className="text-xs">เวลาออก</span>
                                </div>
                                <div className="font-medium text-sm">
                                  {end || "-"}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="text-xs">สถานที่</span>
                                </div>
                                <div className="font-medium text-sm text-gray-700 truncate">
                                  {inLoc && outLoc
                                    ? `${inLoc} → ${outLoc}`
                                    : inLoc || outLoc || "-"}
                                </div>
                              </div>

                              {/* ✅ เพิ่มชั่วโมงทำงานใน Mobile */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Timer className="w-3.5 h-3.5" />
                                  <span className="text-xs">ชั่วโมงทำงาน</span>
                                </div>
                                <div className="font-medium text-sm">
                                  {(() => {
                                    // hours อาจเป็น number หรือ string → แปลงให้ปลอดภัยและตัดเศษก่อนแสดง
                                    const num =
                                      typeof hours === "number"
                                        ? hours
                                        : parseFloat(String(hours ?? "0"));
                                    const intHours = Number.isFinite(num)
                                      ? Math.trunc(num)
                                      : 0;
                                    return `${intHours} ชม.`; // ไม่โชว์ทศนิยม
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-gray-200">
                      <FileText className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        ไม่พบข้อมูล
                      </h3>
                      <p className="text-gray-500 text-sm">
                        ไม่มีข้อมูลการลงเวลาสำหรับช่วงเวลานี้
                      </p>
                    </div>
                  )}
                </div>

                {/* สำหรับ Tablet และ Desktop: Table View */}
                <div className="hidden md:block">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-200">
                        {/* <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            {headerValues
                              .map((h, i) => ({ h, i }))
                              .filter(({ i }) =>
                                [2, 5, 6, 7, 3, 4, 8, 9].includes(i),
                              )
                              .map(({ h, i }) => (
                                <th
                                  key={i}
                                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {i === 2 && (
                                      <Calendar className="w-3.5 h-3.5" />
                                    )}
                                    {i === 5 && (
                                      <Clock className="w-3.5 h-3.5" />
                                    )}
                                    {i === 6 && (
                                      <LogIn className="w-3.5 h-3.5" />
                                    )}
                                    {i === 7 && (
                                      <LogOut className="w-3.5 h-3.5" />
                                    )}
                                    {(i === 3 || i === 4) && (
                                      <MapPin className="w-3.5 h-3.5" />
                                    )}
                                    {i === 8 && (
                                      <AlertCircle className="w-3.5 h-3.5" />
                                    )}
                                    {i === 9 && (
                                      <Timer className="w-3.5 h-3.5" />
                                    )}{" "}
                                    {h}
                                  </div>
                                </th>
                              ))}
                          </tr>
                        </thead> */}

                        <tbody className="divide-y divide-gray-100">
                          {displayRows.length > 0 ? (
                            displayRows.map((row, idx) => {
                              // ✅ ดึงชั่วโมงทำงาน index 9
                              const [
                                ,
                                ,
                                date,
                                shiftLabel,
                                outLoc,
                                inLoc,
                                start,
                                end,
                                status,
                                hours,
                              ] = row;

                              const getStatusConfig = () => {
                                switch (status) {
                                  case "ตรงเวลา":
                                    return {
                                      color: "text-green-700",
                                      bg: "bg-green-50",
                                      border: "border-green-100",
                                      icon: <CheckCircle className="w-4 h-4" />,
                                    };
                                  case "สาย":
                                    return {
                                      color: "text-amber-700",
                                      bg: "bg-amber-50",
                                      border: "border-amber-100",
                                      icon: <Clock className="w-4 h-4" />,
                                    };
                                  default:
                                    return {
                                      color: "text-red-700",
                                      bg: "bg-red-50",
                                      border: "border-red-100",
                                      icon: <AlertCircle className="w-4 h-4" />,
                                    };
                                }
                              };

                              const statusConfig = getStatusConfig();

                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-blue-50/50 transition-colors group"
                                >
                                  {/* วันที่ */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <span className="font-medium text-gray-800">
                                        {date}
                                      </span>
                                    </div>
                                  </td>

                                  {/* กะ */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                                      <Clock className="w-3.5 h-3.5 text-gray-600" />
                                      <span className="text-sm font-medium text-gray-700">
                                        {inLoc || "-"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* เวลาเข้า */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 bg-green-50 rounded">
                                        <LogIn className="w-4 h-4 text-green-600" />
                                      </div>
                                      <span className="font-medium text-gray-800">
                                        {start || "-"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* เวลาออก */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 bg-red-50 rounded">
                                        <LogOut className="w-4 h-4 text-red-600" />
                                      </div>
                                      <span className="font-medium text-gray-800">
                                        {end || "-"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* สถานที่เข้า */}
                                  <td className="px-4 py-3.5 max-w-160">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                      <span className="text-sm text-gray-700 truncate">
                                        {shiftLabel}
                                      </span>
                                    </div>
                                  </td>

                                  {/* สถานที่ออก */}
                                  <td className="px-4 py-3.5 max-w-160">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                      <span className="text-sm text-gray-700 truncate">
                                        {outLoc || "-"}
                                      </span>
                                    </div>
                                  </td>

                                  {/* สถานะ */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}
                                    >
                                      {statusConfig.icon}
                                      <span className="text-sm font-semibold">
                                        {status}
                                      </span>
                                    </div>
                                  </td>

                                  {/* ✅ ชั่วโมงทำงาน */}
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Timer className="w-4 h-4 text-gray-600" />
                                      <span className="font-semibold text-gray-800">
                                        {(() => {
                                          // hours อาจเป็น number หรือ string → แปลงให้ปลอดภัยและตัดเศษก่อนแสดง
                                          const num =
                                            typeof hours === "number"
                                              ? hours
                                              : parseFloat(
                                                  String(hours ?? "0"),
                                                );
                                          const intHours = Number.isFinite(num)
                                            ? Math.trunc(num)
                                            : 0;
                                          return `${intHours} ชม.`; // ไม่โชว์ทศนิยม
                                        })()}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-12 text-center"
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                                    ไม่มีข้อมูลการลงเวลา
                                  </h3>
                                  <p className="text-gray-500 text-sm">
                                    ไม่พบข้อมูลในระบบสำหรับช่วงเวลาที่เลือก
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer (เดิม) */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>แสดงข้อมูลล่าสุด {displayRows.length} รายการ</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>ตรงเวลา</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>สาย</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>ไม่ตรงเวลา</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
