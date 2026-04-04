import axios from "axios";
import CryptoJs from "crypto-js";
import { getToken } from "../utils/authService";
import type { ImportTimeUserData } from "../types/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const Get_data_list_check_in_to_day = async (email: string) => {
  if (!email) {
    console.warn("Email is missing in function Get_data_list_check_in_to_day");
    return [];
  }

  try {
    const payload = { email };
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(`/api/list/all/admin?data=${encoded}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    }

    // console.warn('Unexpected API response format:', response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return [];
  }
};

export const Get_data_users = async (email: string) => {
  if (!email) {
    console.warn("Email is missing in function Get_data_users");
    return [];
  }
  try {
    const payload = { email };
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(`/api/user/list/name?data=${encoded}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    }

    // console.warn('Unexpected API response format:', response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const Get_data_list_organization = async (email: string) => {
  if (!email) {
    console.warn("Email is missing in function Get_data_list_organization");
    return [];
  }
  try {
    const payload = { email };
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(
      `/api/user/list/name/organization?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    }

    // console.warn('Unexpected API response format:', response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const Get_departments = async (email: string) => {
  if (!email) {
    console.warn("Email is missing in function Get_data_list_organization");
    return [];
  }
  try {
    const payload = { email };
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(
      `/api/user/list/department?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    }

    // console.warn('Unexpected API response format:', response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const Get_filtered_reports = async (data: {
  email: string;
  months: string;
  years: number;
  day?: number;
  staffIds: number[];
  emails: string[];
}) => {
  if (!data.email) {
    console.warn("Email is missing in function Get_filtered_reports");
    return [];
  }
  try {
    const payload = {
      email: data.email,
      months: data.months,
      years: data.years,
      day: data.day,
      staffIds: data.staffIds,
      emails: data.emails,
    };

    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(
      `/api/data/report-data-checkin?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    }

    console.warn("Unexpected API response format:", response.data);
    return [];
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const Get_filtered_Import_Date = async (payload: ImportTimeUserData) => {
  if (!payload.email) {
    console.warn("Email is missing in function Get_filtered_reports");
    return [];
  }
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(`/api/list/header?data=${encoded}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const Get_filtered_Import_User_Data = async (data: {
  userEmail: string;
  months: string;
  years: number;
  day?: number | null;
  email: string;
}) => {
  if (!data.email) {
    console.warn("Email is missing in function Get_filtered_reports");
    return [];
  }
  try {
    const payload = {
      userEmail: data.email,
      months: data.months,
      years: data.years,
      day: data.day,
      email: data.email,
    };

    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(
      `/api/data/import-data-checkin?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    // ✅ จัดการ response ตามรูปแบบที่ backend ส่ง:
    // { statusCode: 200, success: true, data: [...] }
    if (Array.isArray(response.data.results)) {
      // console.log("Attendance fetched successfully:", response.data.results);
      return response.data.results;
    } else {
      return response.data;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const GetLocationsLists = async (email: string) => {
  try {
    const payload = { email };
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.get(
      `/api/location/point/ma/list?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    return response.data;
  } catch (e) {
    console.error("Failed to fetch data:", e);
    return [];
  }
};
