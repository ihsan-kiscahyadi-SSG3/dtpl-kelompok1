export type User = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type SessionData = {
  email: string;
  id?: number;
  full_name?: string;
  name?: string;
  role?: string;
  phone_number?: string | null;
  phone?: string | null;
  password?: string;
};

const USERS_KEY = "dummy_users";
const SESSION_KEY = "dummy_session";

export async function getSessionUser(): Promise<User | null> {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  const data = JSON.parse(session) as SessionData;
  if (!data.email) return null;

  return {
    name: data.full_name ?? data.name ?? "",
    email: data.email,
    password: data.password ?? "",
    phone: data.phone_number ?? data.phone ?? undefined,
  };
}

export function updateUser(updated: User) {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const newUsers = users.map(u =>
    u.email === updated.email ? updated : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
}

export function setSession(data: string | SessionData) {
    const sessionData = typeof data === "string" ? { email: data } : data;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function getSession(): SessionData | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as SessionData : null;
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

/* Ambil semua user */
export function getUsers(): User[] {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

/* Simpan user baru */
export function registerUser(user: User): { success: boolean; message: string } {
    const users = getUsers();

    const exists = users.find(u => u.email === user.email);
    if (exists) {
        return { success: false, message: "Email sudah terdaftar" };
    }

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return { success: true, message: "Berhasil daftar" };
}

/* Login */
export function loginUser(email: string, password: string): boolean {
  const users = getUsers();
  const ok = users.some(u => u.email === email && u.password === password);
  if (ok) setSession(email);
  return ok;
}