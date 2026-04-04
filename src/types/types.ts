export interface ReportData {
  id: number;
  firstname: string;
  lastname: string;
  month: string;
  year: number;
  [key: string]: any;
}

export interface StaffName {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

export interface ImportTimeUserData {
  id?: number;
  firstname?: string;
  lastname?: string;
  email: string;
  unitId: number;
  isActive: boolean;
  userUnits?: UserUnit[];
}

export interface Unit {
  id: number;
  name: string;
  organizationId: number;
}

export interface Organization {
  id: number;
  name: string;
  units: Unit[];
}

export interface UserUnit {
  id: number;
  userId: number;
  unitId: number;
  role: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
}

export interface UserWithUnits {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  userUnits: UserUnit[];
}

/** ประเภทกะ */
export type ShiftType = "morning" | "night";

/** รายการลงเวลา */
export interface UserCheckInDate {
  shiftType: ShiftType;
  locationNameIn: string;
  locationNameOut: string | null;
  day: number;
  month: string; // เดือนภาษาไทย เช่น "ธันวาคม"
  year: number; // ปี พ.ศ. เช่น 2568
  startTime: string | null; // HH:MM:SS
  endTime: string | null; // HH:MM:SS
  userEmail: string;
}

/** โครงสร้างข้อมูลผู้ใช้ที่มาจาก API */
export interface UserResult {
  email: string;
  firstname: string;
  lastname: string;
  userUnits: { unit: { name: string } }[];
  userCheckInDates: UserCheckInDate[];
}

type ImportTimeData = {
  email: string;
  firstname: string;
  lastname: string;
};

export interface ImportDateTime {
  userEmail: string | null;
  userId?: ImportTimeData | null;
  day: number;
  month: string;
  year: number;
  startTime: string | null;
  endTime: string | null;
  shiftType: "morning" | "night";
}

export interface ImportTime {
  userEmail: string;
  id: string;
  endTime: string;
  shiftType: string;
  startTime: string;
}

export interface UpdateUserPermissionPayload {
  email: string;
  newPermission: string;
  staffEmail: string;
}
