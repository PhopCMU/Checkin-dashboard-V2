import type { ShiftType, UserResult } from "../types/types";

/**
 * เกณฑ์เวลาเริ่มงาน/สาย
 * - ปกติ: เริ่ม 08:00 → สายถ้า > 08:40
 * - เวรดึก: เริ่ม 18:00 → สายถ้า > 20:10
 * หากต้องการเปลี่ยนเวรดึกเป็น > 18:10 ให้ปรับ lateAfterMin เป็น 18*60+10
 */
const SHIFT_RULES = {
  morning: { startMin: 8 * 60, lateAfterMin: 8 * 60 + 30 }, // 08:00, สายถ้า > 08:40
  night: { startMin: 18 * 60, lateAfterMin: 20 * 60 }, // 18:00, สายถ้า > 20:00
};

/** ตรวจว่าเข้างานสายหรือไม่ */
export const isLate = (
  time: string | null | undefined,
  shiftType: ShiftType
): boolean => {
  if (!time) return false;
  const [h, m] = time.split(":").map(Number); // HH:MM:SS → ใช้ HH:MM
  const totalMinutes = h * 60 + m;
  const { lateAfterMin } = SHIFT_RULES[shiftType];
  return totalMinutes > lateAfterMin;
};

/** วิเคราะห์กะจากเวลาเริ่มจริง */
export const detectShiftType = (startTime?: string | null): ShiftType => {
  if (!startTime) return "morning";
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m;
  // เวรดึก: 18:00–23:59 หรือ 00:00–05:59
  if (totalMinutes >= 18 * 60 || totalMinutes < 6 * 60) return "night";
  return "morning";
};

/** map เดือนภาษาไทย -> หมายเลขเดือน (1–12) */
const THAI_MONTH_TO_NUMBER: Record<string, number> = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12,
};

/** ย่อเดือนภาษาไทยเป็นรูปแบบรายงาน เช่น "ธ.ค." */
const THAI_MONTH_SHORT: Record<number, string> = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

/** แปลงชื่อเดือนไทยเป็นหมายเลข (ไม่ตรง → คืน undefined) */
export const parseThaiMonth = (monthThai: string): number | undefined => {
  const key = monthThai.trim();
  return THAI_MONTH_TO_NUMBER[key];
};

/** ฟอร์แมตวันที่แบบไทย: "20 ธ.ค. 2568" */
export const formatThaiDate = (
  day: number,
  monthThai: string,
  buddhistYear: number
): string => {
  const m = parseThaiMonth(monthThai);
  const short = m ? THAI_MONTH_SHORT[m] : monthThai;
  return `${day} ${short} ${buddhistYear}`;
};

/** คืน label สถานะ "สาย" หรือ "ตรงเวลา" หรือ "ขาดงาน" */
export const statusLabel = (
  startTime: string | null | undefined,
  shift: ShiftType
): string => {
  if (!startTime) return "ขาดงาน";
  return isLate(startTime, shift) ? "สาย" : "ตรงเวลา";
};

/** หัวคอลัมน์สำหรับ Sheet/Excel (เพิ่ม "ชั่วโมงทำงาน") */
export const headerValues: string[] = [
  "ชื่อ-นามสกุล",
  "อีเมล",
  "วันที่",
  "สถานที่เข้า",
  "สถานที่ออก",
  "กะ",
  "เวลาเข้า",
  "เวลาออก",
  "สถานะ",
  "ชั่วโมงทำงาน", // คอลัมน์ใหม่
];

/** แปลง "HH:MM:SS" → จำนวนนาทีตั้งแต่ 00:00 */
const toMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const [hh, mm] = time.split(":").map((v) => Number(v));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
};

/** คำนวณชั่วโมงการทำงานต่อแถว (จำกัดสูงสุด 12 ชม.) */
export const calculateWorkHours = (
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  shiftType: ShiftType
): number => {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);
  if (s == null || e == null) return 0; // ยังไม่ครบคู่หรือรูปแบบเวลาไม่ถูกต้อง

  let diffMin = e - s;
  // เวรดึก: หากสิ้นสุดน้อยกว่าเริ่ม → ข้ามวัน
  if (shiftType === "night" && diffMin < 0) diffMin += 24 * 60;

  // ป้องกันค่าติดลบ (กรณีข้อมูลผิดพลาด)
  if (diffMin < 0) return 0;

  const hours = diffMin / 60;
  // จำกัดสูงสุด 12 ชม.
  return Math.min(hours, 12);
};

/**
 * สร้าง data matrix สำหรับ react-spread-sheet-excel หรือ export Excel
 * คืนรูปแบบเป็น { value: string }[][] เพื่อความเข้ากันได้สูง
 */
export const createAttendanceSheetData = (
  results: UserResult[]
): { value: string }[][] => {
  const rows: { value: string }[][] = [];

  results.forEach((user) => {
    const fullName = `${user.firstname} ${user.lastname}`.trim();
    const email = user.email;

    user.userCheckInDates.forEach((rec) => {
      const shift = rec.shiftType ?? detectShiftType(rec.startTime);
      const dateStr = formatThaiDate(rec.day, rec.month, rec.year);
      const shiftLabel = shift === "morning" ? "ปกติ" : "เวรดึก";
      const inLoc = rec.locationNameIn ?? "-";
      const outLoc = rec.locationNameOut ?? "-";
      const start = rec.startTime ?? "-";
      const end = rec.endTime ?? "-";
      const status = statusLabel(rec.startTime, shift);

      // ชั่วโมงทำงาน (จำกัด 12 ชม.)
      const hours = calculateWorkHours(rec.startTime, rec.endTime, shift);
      // แสดงเป็นเลขทศนิยม 2 ตำแหน่ง (แต่ใน Excel จะฟอร์แมตด้วย numFmt อีกชั้น)
      const hoursStr = hours.toFixed(2);

      rows.push([
        { value: fullName }, // 0
        { value: email }, // 1
        { value: dateStr }, // 2
        { value: inLoc }, // 3
        { value: outLoc }, // 4
        { value: shiftLabel }, // 5
        { value: start }, // 6
        { value: end }, // 7
        { value: status }, // 8
        { value: hoursStr }, // 9
      ]);
    });
  });

  return rows;
};
