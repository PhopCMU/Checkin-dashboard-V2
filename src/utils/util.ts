// ดึงชื่อแผนกจาก userUnits
export const getDepartment = (user: any): string => {
  return user?.userUnits?.[0]?.unit?.name || "ไม่ระบุแผนก";
};

// คำนวณสถานะจาก shiftType และ startTime
export const calculateStatus = (
  shiftType: string,
  startTime: string | null
): "present" | "late" | "absent" => {
  if (!startTime) return "absent";

  const [hours, minutes] = startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "absent";

  const inTime = hours * 60 + minutes; // แปลงเป็นนาทีนับจากเที่ยงคืน

  if (shiftType === "morning") {
    const lateThreshold = 8 * 60 + 40; // 08:40 = 520 นาที
    return inTime <= lateThreshold ? "present" : "late";
  } else if (shiftType === "night") {
    const lateThreshold = 20 * 60 + 10; // 20:10 = 1210 นาที
    return inTime <= lateThreshold ? "present" : "late";
  }
  return "absent";
};

// ฟังก์ชันเรียกเดือนทั้ง 12 เดือนเป็นภาษาไทย
export const getThaiMonths = () => {
  return [
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
};

// ฟังก์ชันเรียกปีย้อนหลังได้ไม่เกิน 5 ปี (เป็นปี พ.ศ.)
export const getLastFiveBuddhistYears = () => {
  const currentGregorianYear = new Date().getFullYear();
  const currentBuddhistYear = currentGregorianYear + 543;
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentBuddhistYear - i);
  }
  return years; // เรียงจากปีปัจจุบัน ไปยัง 4 ปีย้อนหลัง
};

// ฟังก์ชันตรวจสอบว่าเป็นปีอธิกสุรทินหรือไม่ (รับปี พ.ศ.)
const isBuddhistLeapYear = (buddhistYear: number): boolean => {
  const gregorianYear = buddhistYear - 543;
  return (
    (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) ||
    gregorianYear % 400 === 0
  );
};

// ฟังก์ชันคืนค่าจำนวนวันในแต่ละเดือน (ตามปี พ.ศ.)
export const getDaysInThaiMonths = (buddhistYear: number): number[] => {
  const isLeap = isBuddhistLeapYear(buddhistYear);
  return [
    31, // มกราคม
    isLeap ? 29 : 28, // กุมภาพันธ์
    31, // มีนาคม
    30, // เมษายน
    31, // พฤษภาคม
    30, // มิถุนายน
    31, // กรกฎาคม
    31, // สิงหาคม
    30, // กันยายน
    31, // ตุลาคม
    30, // พฤศจิกายน
    31, // ธันวาคม
  ];
};

export const getDaysInMonth = (buddhistYear: number, month: any): number[] => {
  if (month < 1 || month > 12) {
    return [];
  }

  const daysInMonths = getDaysInThaiMonths(buddhistYear);
  const maxDays = daysInMonths[month - 1]; // เดือนเริ่มที่ index 0

  return Array.from({ length: maxDays }, (_, i) => i + 1);
};

// 🔁 แปลงชื่อเดือนเป็นเลขเดือน (มกราคม → 1, กุมภาพันธ์ → 2, ...)
export const getMonthIndexByName = (monthName: string): number | null => {
  const months = getThaiMonths();
  const index = months.indexOf(monthName);
  return index === -1 ? null : index + 1; // +1 เพราะ index เริ่มที่ 0
};

export const canEditStaff = (
  staffEmail: string,
  loggedInEmail: string | undefined
): boolean => {
  const TARGET_PROTECTED_EMAIL = import.meta.env.VITE_TARGET_EMAIL;
  // ถ้าไม่ใช่บัญชีที่ป้องกัน → แก้ไขได้
  if (staffEmail !== TARGET_PROTECTED_EMAIL) {
    return true;
  }
  // ถ้าเป็นบัญชีที่ป้องกัน → ต้องล็อกอินด้วย email เดียวกัน
  return loggedInEmail === TARGET_PROTECTED_EMAIL;
};

// ฟังก์ชันตรวจสอบว่าผู้ใช้สามารถแก้ไขข้อมูลของผู้ใช้เป้าหมายได้
export const canEditUser = (
  targetUser: any,
  loggedInEmail: string | undefined
): boolean => {
  const TARGET_EMAIL = import.meta.env.VITE_TARGET_EMAIL;

  // กรณี 1: ผู้ใช้เป้าหมายไม่ใช่ sophon.m@cmu.ac.th → แก้ไขได้ตามปกติ
  if (targetUser.email !== TARGET_EMAIL) {
    return true;
  }

  // กรณี 2: ผู้ใช้เป้าหมายคือ sophon.m@cmu.ac.th
  // → อนุญาตเฉพาะถ้าผู้ใช้ที่ล็อกอินอยู่ก็คือ sophon.m@cmu.ac.th
  return loggedInEmail === TARGET_EMAIL;
};
