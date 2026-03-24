const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://manudjaya-api.arthurringo.com"
    : "/api";

type ApiError = {
  error?: string;
  message?: string;
};

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const err = data as ApiError | null;
    throw new Error(
      err?.error || err?.message || `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

/* =========================
   TYPES
========================= */

export type RegisterResponse = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone_number: string | null;
};

export type LoginResponse = {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  phone_number?: string | null;
  message?: string;
};

export type LogoutResponse = {
  message: string;
};

export type UserResponse = {
  id: number;
  email: string;
  full_name?: string;
  name?: string;
  role?: string;
  phone_number?: string | null;
  phone?: string | null;
  password?: string;
};

export type Category = {
  id: number;
  name: string;
  image_url: string | null;
};

export type Destination = {
  id: number;
  name: string;
  image_url: string | null;
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  category_id: number;
  category_name: string;
};

export type DestinationDetail = {
  id: number;
  name: string;
  date: string;
  descriptions: string;
  image_url?: string | null;
  start_time?: string;
  end_time?: string;
  price?: string;
  category_id?: number;
  category_name?: string;
  address?: string;
};

/* =========================
   AUTH API
========================= */

// REGISTER
export async function registerUser(payload: {
  full_name: string;
  email: string;
  password: string;
}) {
  return apiFetch<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify({
      data: payload,
    }),
  });
}

// LOGIN
export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      data: payload,
    }),
  });
}

// LOGOUT
export async function logoutUser() {
  return apiFetch<LogoutResponse>("/logout", {
    method: "POST",
  });
}

// GET ALL USERS
export async function getUsers() {
  return apiFetch<UserResponse[]>("/users", {
    method: "GET",
  });
}

/* =========================
   CATEGORY API
========================= */

// GET ALL CATEGORIES
export async function getCategories() {
  return apiFetch<Category[]>("/categories");
}

// CREATE CATEGORY
export async function createCategory(payload: {
  name: string;
  image_url: string;
}) {
  return apiFetch<Category>("/category", {
    method: "POST",
    body: JSON.stringify({
      data: payload,
    }),
  });
}

// UPDATE CATEGORY
export async function updateCategory(
  id: string | number,
  payload: { name: string }
) {
  return apiFetch<Category[] | Category>(`/category/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: payload,
    }),
  });
}

// DELETE CATEGORY
export async function deleteCategory(id: string | number) {
  return apiFetch<Category[] | Category>(`/category/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   DESTINATION API
========================= */

// GET ALL DESTINATIONS
export async function getDestinations(params?: {
  day?: "today" | "tomorrow" | "this_week";
  price?: "free";
}) {
  const searchParams = new URLSearchParams();

  if (params?.day) searchParams.set("day", params.day);
  if (params?.price) searchParams.set("price", params.price);

  const query = searchParams.toString();

  return apiFetch<Destination[]>(`/destinations${query ? `?${query}` : ""}`);
}

// GET DESTINATION DETAIL BY ID
export async function getDestinationById(id: string | number) {
  return apiFetch<DestinationDetail>(`/destination/${id}`);
}