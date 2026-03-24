import { useEffect, useState } from "react";
import { getSessionUser, updateUser } from "../../utils/auth";

export default function ChangeEmail() {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getSessionUser>>>(null);
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = await getSessionUser();
      setUser(sessionUser);
      setLoading(false);
    };

    void loadUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) return <p>Unauthorized</p>;

  const save = () => {
    if (email !== confirm) {
      alert("Email tidak sama");
      return;
    }

    updateUser({ ...user, email });
    alert("Email berhasil diubah (login ulang)");
  };

  return (
    <>
      <h2>Ubah Email</h2>

      <p>
        Email Saat Ini: <b>{user.email}</b>
      </p>

      <label>Email Baru</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />

      <label>Konfirmasi Email</label>
      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <br />
      <button onClick={save}>Simpan Email Baru</button>
    </>
  );
}
