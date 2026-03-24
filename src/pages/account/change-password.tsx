import { useEffect, useState } from "react";
import { getSessionUser, updateUser } from "../../utils/auth";

export default function ChangePassword() {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getSessionUser>>>(null);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
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
    if (user.password && oldPw !== user.password) {
      alert("Kata sandi lama salah");
      return;
    }
    if (newPw !== confirm) {
      alert("Konfirmasi tidak cocok");
      return;
    }

    updateUser({ ...user, password: newPw });
    alert("Kata sandi berhasil diubah");
  };

  return (
    <>
      <h2>Ubah Kata Sandi</h2>

      <label>Kata Sandi Saat Ini</label>
      <input type="password" onChange={(e) => setOldPw(e.target.value)} />

      <label>Kata Sandi Baru</label>
      <input type="password" onChange={(e) => setNewPw(e.target.value)} />

      <label>Konfirmasi Kata Sandi</label>
      <input type="password" onChange={(e) => setConfirm(e.target.value)} />
      <br />
      <button onClick={save}>Simpan Kata Sandi</button>
    </>
  );
}
