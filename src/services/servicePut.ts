import axios from "axios";
import { getToken } from "../utils/authService";
import type { ImportTime, UpdateUserPermissionPayload } from "../types/types";
import CryptoJs from "crypto-js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { Authorization: `Bearer ${getToken()}` },
});

export const Put_update_user = async (payload: ImportTime) => {
  if (!payload.userEmail) {
    console.warn("Email is missing in function Put_update_user");
    return [];
  }
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.put(`/api/datetime/update?data=${encoded}`);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const PutUpdateLocation = async (payload: any) => {
  if (!payload.userEmail) {
    console.warn("Email is missing in function Put_update_user");
    return [];
  }
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.put(
      `/api/location/point/ma/update?data=${encoded}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const PutUpdateUserPermission = async (
  payload: UpdateUserPermissionPayload,
) => {
  if (!payload.email) {
    return "Email is missing in function Put_update_user";
  }
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.put(
      `/api/user/update/permission?data=${encoded}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};
