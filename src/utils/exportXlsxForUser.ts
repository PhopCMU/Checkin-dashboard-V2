import { Workbook } from "exceljs";
import { createAttendanceSheetData, headerValues } from "./attendance";
import type { UserResult } from "../types/types";
/*
// ===== Export Excel Basic ======
export async function exportXlsxForUser(user: UserResult) {
  const wb = new Workbook();
  const ws = wb.addWorksheet("เวลาเข้า-ออก");

  ws.addRow(headerValues);
  const rows = createAttendanceSheetData([user]).map((r) =>
    r.map((c) => c.value)
  );
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fullName = `${user.firstname} ${user.lastname}`.trim();
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `${fullName}_${user.userCheckInDates[0].month}_${user.userCheckInDates[0].year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
*/
// ===== Export Excel Advanced ======

/**
 * ดาวน์โหลดไฟล์ XLSX ต่อ "คน" ด้วย ExcelJS
 * - สี "ตัวหนังสือ" สำหรับคอลัมน์กะ/สถานะ (ไม่ใช้ BG)
 * - จัดรูปแบบตัวเลขคอลัมน์ "ชั่วโมงทำงาน" เป็น 3 ส่วน: บวก;ลบ;ศูนย์ → "0.00;-0.00;0"
 * - เพิ่มแถว "รวมชั่วโมง" ท้ายตารางพร้อมสูตร SUM
 */

export const exportXlsxForUser = async (
  user: UserResult,
  options?: {
    fileName?: string; // กำหนดชื่อไฟล์เอง (ถ้าไม่ระบุ จะตั้งตาม ชื่อ-เดือน-ปี)
    showTotal?: boolean; // แสดงแถว "รวมชั่วโมง" ท้ายตาราง (default: true)
  }
) => {
  const wb = new Workbook();
  const ws = wb.addWorksheet("เวลาเข้า-ออก");

  // --- 1) Header ---
  ws.addRow(headerValues);
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 22;

  // --- 2) Data Matrix (string/number) ---
  // หมายเหตุ: ฟังก์ชัน createAttendanceSheetData ของเรา คืนชั่วโมงทำงานเป็น Number อยู่แล้ว
  // แต่เพื่อความทนทาน (กรณีมีการเปลี่ยนในอนาคต) เราจะ cover อีกชั้นด้านล่าง
  const matrix = createAttendanceSheetData([user]).map((row) =>
    row.map((cell) => cell.value)
  );
  matrix.forEach((r) => ws.addRow(r));

  // --- 3) Column Widths (A..J) ---
  const widths = [18, 22, 16, 20, 20, 12, 14, 14, 12, 14];
  ws.columns.forEach((col, idx) => (col.width = widths[idx] ?? 16));

  // --- 4) Styling + Number formats ---
  const F_SHIFT = 6; // คอลัมน์ กะ
  const G_IN = 7; // เวลาเข้า
  const H_OUT = 8; // เวลาออก
  const I_STAT = 9; // สถานะ
  const J_HOURS = 10; // ชั่วโมงทำงาน

  const firstDataRow = 2;
  const lastDataRow = firstDataRow + matrix.length - 1;

  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const row = ws.getRow(r);

    // เวลาเข้า/ออก → จัดกลาง
    row.getCell(G_IN).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(H_OUT).alignment = { vertical: "middle", horizontal: "center" };

    // กะ (สีตัวหนังสือ)
    const shiftCell = row.getCell(F_SHIFT);
    const shiftVal = String(shiftCell.value ?? "").trim();
    if (shiftVal === "ปกติ") {
      shiftCell.font = { color: { argb: "FF1D4ED8" }, bold: true }; // blue-700
    } else if (shiftVal === "เวรดึก") {
      shiftCell.font = { color: { argb: "FF7C3AED" }, bold: true }; // purple-600
    } else {
      shiftCell.font = { color: { argb: "FF374151" } }; // gray-700
    }
    shiftCell.alignment = { vertical: "middle", horizontal: "center" };

    // สถานะ (สีตัวหนังสือ)
    const statusCell = row.getCell(I_STAT);
    const statusVal = String(statusCell.value ?? "").trim();
    if (statusVal === "ตรงเวลา") {
      statusCell.font = { color: { argb: "FF16A34A" }, bold: true }; // green-600
    } else if (statusVal === "สาย") {
      statusCell.font = { color: { argb: "FFCA8A04" }, bold: true }; // amber-600
    } else if (statusVal === "ขาดงาน") {
      statusCell.font = { color: { argb: "FFDC2626" }, bold: true }; // red-600
    } else {
      statusCell.font = { color: { argb: "FF374151" } }; // gray-700
    }
    statusCell.alignment = { vertical: "middle", horizontal: "center" };

    // ชั่วโมงทำงาน → บังคับเป็น Number + ฟอร์แมต 3 ส่วน

    const hoursCell = row.getCell(J_HOURS);
    const raw = hoursCell.value;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
    const intHours = Number.isFinite(num) ? Math.trunc(num) : 0; // ตัดเศษ
    hoursCell.value = intHours;
    hoursCell.numFmt = "0;-0;0"; // แสดงเป็นจำนวนเต็ม ไม่มีทศนิยม
    hoursCell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // --- 5) Total Row (SUM) ---
  const showTotal = options?.showTotal ?? true;
  if (showTotal) {
    const totalRowIndex = Math.max(firstDataRow, lastDataRow) + 1;
    ws.addRow([]);

    const labelCell = ws.getRow(totalRowIndex).getCell(I_STAT);
    labelCell.value = "รวมชั่วโมง";
    labelCell.font = { bold: true };

    const totalCell = ws.getRow(totalRowIndex).getCell(J_HOURS);
    if (lastDataRow >= firstDataRow) {
      totalCell.value = {
        formula: `SUM(${columnLetter(J_HOURS)}${firstDataRow}:${columnLetter(
          J_HOURS
        )}${lastDataRow})`,
      };
    } else {
      totalCell.value = 0; // ไม่มีข้อมูล
    }
    totalCell.numFmt = "0.00;-0.00;0"; // 0 → 0
    totalCell.font = { bold: true };
    totalCell.alignment = { vertical: "middle", horizontal: "center" };
  }

  // --- 6) Download ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // ตั้งชื่อไฟล์ (default): ชื่อ-นามสกุล_เดือน_ปี.xlsx
  const firstRec = user.userCheckInDates?.[0];
  const defaultName = `${user.firstname} ${user.lastname}`.trim();
  const fName =
    options?.fileName ??
    `${defaultName}_${firstRec?.month ?? "เดือนไม่ระบุ"}_${
      firstRec?.year ?? ""
    }.xlsx`;

  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = fName;
  a.click();
  URL.revokeObjectURL(url);
};

/** แปลง index → ตัวอักษรคอลัมน์ Excel (1→A, 2→B, ...) */
const columnLetter = (idx: number): string => {
  let s = "";
  while (idx > 0) {
    const mod = (idx - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    idx = Math.floor((idx - 1) / 26);
  }
  return s;
};
