const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export interface User {
  id: string;
  name: string;
  age: number;
  referral_source: string;
  avatar_base64: string | null;
  credits: number;
  created_at: string;
}

export interface GenerationSummary {
  id: string;
  gender: "boy" | "girl";
  baby_photo_base64: string;
  created_at: string;
}

export interface Generation extends GenerationSummary {
  user_id: string;
  father_photo_base64: string;
  father_age: number;
  father_height_cm: number;
  mother_photo_base64: string;
  mother_age: number;
  mother_height_cm: number;
  predicted_height_cm: number;
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let detail = "request_failed";
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export const api = {
  createUser: (data: { name: string; age: number; referral_source: string }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),

  getUser: (id: string) => request<User>(`/users/${id}`),

  updateUser: (id: string, data: { name?: string; avatar_base64?: string }) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  createGeneration: (data: {
    user_id: string;
    gender: "boy" | "girl";
    father_photo_base64: string;
    father_age: number;
    father_height_cm: number;
    mother_photo_base64: string;
    mother_age: number;
    mother_height_cm: number;
  }) => request<Generation>("/generations", { method: "POST", body: JSON.stringify(data) }),

  listGenerations: (userId: string) =>
    request<GenerationSummary[]>(`/generations?user_id=${userId}`),

  getGeneration: (id: string) => request<Generation>(`/generations/${id}`),
};

export const dataUri = (b64: string) =>
  b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
