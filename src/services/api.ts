const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8081"
  : "https://api.desamanudjaya.com";

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
    if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
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
  destination_type?: string;
  image_url?: string | null;
  start_time?: string;
  end_time?: string;
  latitude?: string;
  longitude?: string;
  price?: string;
  ticket_type?: string;
  category_id?: number;
  category_name?: string;
  category?: { id: number; name: string; image_url: string | null };
  address?: string;
};

/* =========================
   AUTH API
========================= */
export async function updateProfile(payload?: {
  full_name?: string;
  email?: string;
  phone_number?: string;
  password?: string;
}) {
  return apiFetch<UserResponse>("/me", {
    method: "PATCH",
    body: JSON.stringify({
      data: payload || {},
    }),
  });
}
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
  category_id?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.day) searchParams.set("day", params.day);
  if (params?.price) searchParams.set("price", params.price);
  if (params?.category_id) searchParams.set("category_id", String(params.category_id));

  const query = searchParams.toString();

  return apiFetch<Destination[]>(`/destinations${query ? `?${query}` : ""}`);
}

// GET DESTINATION DETAIL BY ID
export async function getDestinationById(id: string | number) {
  return apiFetch<DestinationDetail>(`/destination/${id}`);
}

/* =========================
   ACCOMMODATION API
========================= */

export type Accommodation = {
  id: number;
  name: string;
  facilities: string[];
  price: string;
  image_url: string | null;
};

export async function getAccommodations() {
  return apiFetch<Accommodation[]>("/accommodations");
}

export async function getAccommodationById(id: string | number) {
  return apiFetch<Accommodation>(`/accommodation/${id}`);
}

/* =========================
   ORDER API
========================= */

export type OrderVisitorDetail = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
};

export type OrderResponse = {
  id: number;
  user_id: number;
  user_name: string;
  qty: number;
  order_total: string;
  tax: string;
  sub_total: string;
  status: string;
  order_item: {
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
  order_visitor_details: OrderVisitorDetail[];
};

// CREATE ORDER
export async function createOrder(payload: {
  ticket_id: number;
  ticket_type: string;
  qty: number;
}) {
  return apiFetch<OrderResponse>("/order", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
}

// UPDATE ORDER
export async function updateOrder(orderId: number, payload: { qty: number }) {
  return apiFetch<OrderResponse>(`/order/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ data: payload }),
  });
}

/* =========================
   WISHLIST API
========================= */

export type WishlistDestination = {
  id: number;
  name: string;
  date: string;
  descriptions: string;
  start_time: string;
  end_time: string;
  image_url: string | null;
  latitude: string;
  longitude: string;
  price: string;
  ticket_type: string;
  category: { id: number; name: string; image_url: string | null };
};

export async function getWishlists() {
  return apiFetch<WishlistDestination[]>("/wishlists");
}

export async function addWishlist(destinationId: number) {
  return apiFetch<{ message: string }>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ data: { destination_id: destinationId } }),
  });
}

export async function removeWishlist(destinationId: number) {
  return apiFetch<{ message: string }>(`/wishlist/${destinationId}`, {
    method: "DELETE",
  });
}

/* =========================
   ORDER HISTORY API
========================= */

export type OrderHistoryItem = {
  id: number;
  booking_code: string;
  qty: number;
  sub_total: string;
  tax: string;
  order_total: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_item: {
    id: number;
    name: string;
    date: string;
    start_time: string;
    end_time: string;
    image_url: string | null;
    price: string;
    category_id: number;
    category_name: string;
  };
  visitor_details: OrderVisitorDetail[];
};

export async function getOrderHistories() {
  return apiFetch<OrderHistoryItem[]>("/order_histories");
}

export async function getOrderHistory(id: number) {
  return apiFetch<OrderHistoryItem>(`/order_history/${id}`);
}

// CREATE ORDER VISITOR DETAILS
export async function createOrderVisitorDetails(
  orderId: number,
  visitors: { name: string; email: string; phone_number: string }[]
) {
  return apiFetch<OrderResponse>(`/order/${orderId}/visitor_details`, {
    method: "POST",
    body: JSON.stringify({ data: visitors }),
  });
}