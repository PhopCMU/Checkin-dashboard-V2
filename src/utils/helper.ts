import type { UserResult } from "../types/types";
import { getUserFromToken } from "./authService";

// helper ในไฟล์ component นี้ หรือย้ายไป utils ก็ได้
export const toUserResult = (report: any): UserResult => {
  return {
    email: report.email ?? "", // ถ้าไม่มี ให้เป็นค่าว่าง
    firstname: report.firstname ?? "",
    lastname: report.lastname ?? "",
    userUnits: Array.isArray(report.userUnits)
      ? // ให้ได้รูปแบบ { unit: { name: string } }
        report.userUnits.map((u: any) => ({
          unit: { name: u?.unit?.name ?? u?.name ?? "-" },
        }))
      : [],
    userCheckInDates: Array.isArray(report.userCheckInDates)
      ? report.userCheckInDates.map((d: any) => ({
          shiftType: d.shiftType ?? "morning",
          locationNameIn: d.locationNameIn ?? "-",
          locationNameOut: d.locationNameOut ?? null,
          day: Number(d.day) ?? 1,
          month: d.month ?? "มกราคม",
          year: Number(d.year) ?? 2568, // ปรับตามข้อมูลจริง
          startTime: d.startTime ?? null,
          endTime: d.endTime ?? null,
          userEmail: d.userEmail ?? report.email ?? "",
        }))
      : [],
  };
};

// ตรวจสอบสิทธิ์ read edit delete ฯลฯ ของ user
export const useCheckSubPermission = (p: string) => {
  const userPermission = getUserFromToken() || {};
  const userUnitCheck = userPermission.userUnits[0].permissions
    .map((p: any) => p)
    .includes(p);

  return userUnitCheck;
};

// แปลง null | undefined | T[] → T[]
export const ensureArray = <T>(v: T | T[] | null | undefined): T[] => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
};

// แปลง "HH:MM:SS" → "HH:MM:SS"
export const normalizeToHHMMSS = (t: string) => {
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t || "";
};

// Import Time

export const getShiftLabel = (shiftType: string) => {
  return shiftType === "night" ? "เวรดึก" : "ปกติ";
};

export const getDayName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", { weekday: "long" });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getThaiMonth = (monthNumber: number) => {
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

  // ตรวจสอบว่าตัวเลขอยู่ในช่วง 1-12 หรือไม่
  if (monthNumber < 1 || monthNumber > 12) {
    return "เดือนไม่ถูกต้อง";
  }

  // ลบ 1 เพราะ Array เริ่มนับที่ดัชนี 0
  return thaiMonths[monthNumber - 1];
};
