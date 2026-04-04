import axios from "axios";
import { getToken } from "../utils/authService";

import CryptoJs from "crypto-js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { Authorization: `Bearer ${getToken()}` },
});

export const Delete_Import_Time = async (id: number, email: string) => {
  if (!id) {
    console.warn("Id is missing in function Delete_Import_Time");
    return [];
  }
  if (!email) {
    console.warn("Email is missing in function Delete_Import_Time");
    return [];
  }
  const payload = { id, email };
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(payload),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.delete(`/api/datetime/delete?data=${encoded}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to Delete data: Import Time", error);
    return [];
  }
};

export const DeleteAssignDepartment = async (id: number) => {
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(id),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.delete(
      `/api/user/delete/department?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to Delete data: Assign Department", error);
  }
};

export const DeleteLocation = async (id: number) => {
  try {
    const encrypted = CryptoJs.AES.encrypt(
      JSON.stringify(id),
      import.meta.env.VITE_CRYPTO_SECRET_KEY,
    ).toString();

    const encoded = encodeURIComponent(encrypted);
    const response = await api.delete(
      `/api/location/point/ma/delete?data=${encoded}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to Delete data: Location", error);
  }
};
