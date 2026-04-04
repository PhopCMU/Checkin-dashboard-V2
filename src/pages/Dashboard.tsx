import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Eye,
  User,
  MapPin,
} from "lucide-react";
import { Get_data_list_check_in_to_day } from "../services/serviceGet";
import { getUserFromToken } from "../utils/authService";
import { calculateStatus, getDepartment } from "../utils/util";
import { useCheckSubPermission } from "../utils/helper";
import { useAlert } from "../contexts/AlertContext";

const Dashboard: React.FC = () => {
  const hasFetchedData = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const user = getUserFromToken() || {};
  const { showAlert } = useAlert();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    if (!user.email) return;
    try {
      const response = await Get_data_list_check_in_to_day(user.email);
      setRawData(response || []);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล", error);
    }
  };

  // 🔹 ประมวลผลข้อมูลให้ตรงกับโครงสร้างจริง (ใช้ useMemo เพื่อประสิทธิภาพ)
  const processed = useMemo(() => {
    return (
      rawData
        .map((record) => {
          const department = getDepartment(record.user);
          const firstName = record.user?.firstname || "";
          const lastName = record.user?.lastname || "";
          const displayName =
            `${firstName} ${lastName}`.trim() || "ไม่ระบุชื่อ";

          const status = calculateStatus(record.shiftType, record.startTime);

          return {
            ...record,
            name: displayName,
            department,
            status,
            morningIn: record.shiftType === "morning" ? record.startTime : null,
            nightIn: record.shiftType === "night" ? record.startTime : null,
          };
        })
        // ✅ ตัด "absent" ออก (ตามที่คุณต้องการ)
        .filter((item) => item.status === "present" || item.status === "late")
    );
  }, [rawData]);

  useEffect(() => {
    setProcessedData(processed);
  }, [processed]);

  useEffect(() => {
    // Permission
    const r = useCheckSubPermission("read");
    if (r) {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;
      fetchData();
    } else {
      showAlert({
        title: "เกิดข้อผิดพลาด",
        message: "คุณไม่มีสิทธิ์อ่านข้อมูลหน้านี้",
        type: "error",
      });
    }
  }, []);

  // 🔹 สรุปสถิติ (คำนวณจาก processedData ที่กรอง absent ออกแล้ว)
  const total = processedData.length;
  const totalPresent = processedData.filter(
    (r) => r.status === "present",
  ).length;
  const totalLate = processedData.filter((r) => r.status === "late").length;

  const presentPct = total ? Math.round((totalPresent / total) * 100) : 0;
  const latePct = total ? Math.round((totalLate / total) * 100) : 0;

  // 🔹 กรองข้อมูลสำหรับแสดงผล
  const filtered = useMemo(() => {
    return processedData.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        selectedDepartment === "all" || r.department === selectedDepartment;
      const matchesStatus =
        selectedStatus === "all" || r.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [processedData, searchTerm, selectedDepartment, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // ✅ แก้ไข: ลบ 'filtered' ออก เพราะเป็น derived state ป้องกัน infinite loop
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedStatus]);

  const departments = [
    "all",
    ...new Set(processedData.map((r) => r.department)),
  ];
  const statuses = [
    { value: "all", label: "ทั้งหมด", color: "gray" },
    { value: "present", label: "มาทำงาน", color: "green" },
    { value: "late", label: "มาสาย", color: "orange" },
  ];

  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : "-");

  const renderStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      present: { label: "มาทำงาน", color: "bg-green-100 text-green-800" },
      late: { label: "มาสาย", color: "bg-orange-100 text-orange-800" },
    };
    const { label, color } = config[status] || config.late;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                รายงานการลงเวลาวันนี้
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date().toLocaleDateString("th-TH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>Coming Soon</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              title="พนักงานที่ลงเวลา"
              value={total}
              icon={<Users className="w-5 h-5" />}
              color="bg-blue-50 text-blue-600"
              borderColor="border-blue-200"
            />
            <SummaryCard
              title="มาทำงาน"
              value={totalPresent}
              percentage={presentPct}
              icon={<CheckCircle className="w-5 h-5" />}
              color="bg-green-50 text-green-600"
              borderColor="border-green-200"
            />
            <SummaryCard
              title="มาสาย"
              value={totalLate}
              percentage={latePct}
              icon={<AlertCircle className="w-5 h-5" />}
              color="bg-orange-50 text-orange-600"
              borderColor="border-orange-200"
            />
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ แผนก..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                  >
                    <option value="all">แผนกทั้งหมด</option>
                    {departments
                      .filter((d) => d !== "all")
                      .map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      สถานะ: {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedDepartment !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                แผนก: {selectedDepartment}
                <button
                  onClick={() => setSelectedDepartment("all")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus !== "all" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                สถานะ: {statuses.find((s) => s.value === selectedStatus)?.label}
                <button
                  onClick={() => setSelectedStatus("all")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                คำค้น: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-700">
            พบ <span className="font-bold">{filtered.length}</span> รายการ
            {searchTerm && ` สำหรับ "${searchTerm}"`}
          </div>
          <div className="text-sm text-gray-500">
            อัพเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="col-span-3 font-medium text-gray-700">พนักงาน</div>
            <div className="col-span-3 font-medium text-gray-700 text-center">
              เวลาเข้า
            </div>
            <div className="col-span-2 font-medium text-gray-700 text-center">
              กะ
            </div>
            <div className="col-span-2 font-medium text-gray-700 text-center">
              สถานะ
            </div>
            <div className="col-span-2 font-medium text-gray-700 text-center">
              สถานที่
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-gray-100">
            {filtered.length > 0 ? (
              currentItems.map((record) => (
                <div
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors px-4 lg:px-6 py-4"
                >
                  {/* Mobile */}
                  <div className="lg:hidden mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {record.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {record.department}
                            </p>
                          </div>
                        </div>
                        {renderStatusBadge(record.status)}
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>เข้า: {formatTime(record.startTime)}</span>
                        <span>- {formatTime(record.endTime) || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {record.shiftType === "morning" ? "ปกติ" : "เวรดึก"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{record.locationNameIn || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden lg:grid grid-cols-12 items-center">
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {record.name}
                          </h3>
                          <p className="text-[10px] text-gray-500">
                            {record.department}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-normal">
                          {formatTime(record.startTime)}
                        </span>
                        <span>- {formatTime(record.endTime) || "-"}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.shiftType === "morning"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {record.shiftType === "morning" ? "เช้า" : "ดึก"}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      {renderStatusBadge(record.status)}
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{record.locationNameIn || "-"}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่พบข้อมูล
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`
                    : "ไม่มีข้อมูลการลงเวลาวันนี้"}
                </p>
                {(searchTerm ||
                  selectedDepartment !== "all" ||
                  selectedStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDepartment("all");
                      setSelectedStatus("all");
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            )}
          </div>

          {currentItems.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              {/* ✅ แก้ไข: แสดงช่วงข้อมูลในหน้าปัจจุบันอย่างถูกต้อง */}
              <div className="text-sm text-gray-600">
                แสดง {startIndex + 1} - {Math.min(endIndex, filtered.length)}{" "}
                จาก {filtered.length} รายการ
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Result Info */}
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{startIndex + 1}</span> -{" "}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filtered.length)}
                      </span>{" "}
                      จากทั้งหมด{" "}
                      <span className="font-medium">{filtered.length}</span>{" "}
                      รายการ
                      <span className="text-gray-500 ml-2">
                        • หน้า{" "}
                        <span className="font-medium">{currentPage}</span> /{" "}
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

                      {/* First Page Button */}
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
                              aria-current={
                                currentPage === i ? "page" : undefined
                              }
                            >
                              {i}
                            </button>,
                          );
                        }

                        return pages;
                      })()}

                      {/* Last Page Button */}
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
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
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

                    {/* Page Selector */}
                    <div className="hidden md:flex items-center gap-2">
                      <span className="text-sm text-gray-600">ไปที่หน้า:</span>
                      <div className="relative">
                        <select
                          value={currentPage}
                          onChange={(e) =>
                            setCurrentPage(Number(e.target.value))
                          }
                          className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg 
                     bg-white hover:border-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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

                  {/* Mobile: Page Selector */}
                  <div className="mt-4 md:hidden">
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
                     focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
          )}
        </div>

        {/* Statistics */}
        {filtered.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">สรุปสถานะ</h3>
              <div className="space-y-3">
                {statuses
                  .filter((s) => s.value !== "all")
                  .map((s) => {
                    const count = processedData.filter(
                      (r) => r.status === s.value,
                    ).length;
                    // ✅ แก้ไข: คำนวณ % จาก total ที่กรองแล้ว
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div
                        key={s.value}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full bg-${s.color}-500`}
                          />
                          <span className="text-sm text-gray-700">
                            {s.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{count} คน</div>
                          <div className="text-xs text-gray-500">{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">สรุปตามแผนก</h3>
              <div className="space-y-3">
                {departments
                  .filter((d) => d !== "all")
                  .map((dept) => {
                    const count = processedData.filter(
                      (r) => r.department === dept,
                    ).length;
                    return (
                      <div
                        key={dept}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {dept}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">{count} คน</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  title: string;
  value: number;
  percentage?: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}> = ({ title, value, percentage, icon, color, borderColor }) => (
  <div className={`p-4 rounded-xl border ${borderColor}`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color.split(" ")[0]}`}>{icon}</div>
      {percentage !== undefined && (
        <div className="text-sm font-medium text-gray-600">{percentage}%</div>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
    {percentage !== undefined && (
      <div className="mt-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color.split(" ")[0]} rounded-full`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

export default Dashboard;
