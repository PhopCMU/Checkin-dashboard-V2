import CryptoJS from "crypto-js";
import { getToken } from "../utils/authService";
import axios from "axios";
import type { ImportDateTime } from "../types/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const Post_Organzation = async (
  email: string,
  data: {
    userId: number;
    unitId: number | null;
    permissions: string[];
    role: string;
  },
) => {
  if (!email) {
    console.warn("Email is missing in function Post_Organzation");
    return;
  }
  try {
    const payload = { email, data };
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const response = await api.post(
      `/api/user/user-units`,
      {
        encryptedData: encrypted,
      },
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const Post_Import_Time = async (payload: ImportDateTime) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();
    const response = await api.post(
      `/api/datetime/import/data`,
      { encryptedData: encrypted },
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
};

export const Post_Add_Department = async (payload: any) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const response = await api.post(
      `/api/user/add/department`,
      { encryptedData: encrypted },
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Add department failed:", error);
    return null;
  }
};

export const Postaddlocation = async (payload: any) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();
    const response = await api.post(
      `/api/location/point/ma/add`,
      { encryptedData: encrypted },
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Add department failed:", error);
    return null;
  }
};
