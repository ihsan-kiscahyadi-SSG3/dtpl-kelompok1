import { useEffect, useState } from "react";
import { getSessionUser, updateUser } from "../../utils/auth";

export default function ProfileInfo() {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getSessionUser>>>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = await getSessionUser();
      setUser(sessionUser);
      setName(sessionUser?.name || "");
      setPhone(sessionUser?.phone || "");
      setLoading(false);
    };

    void loadUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) return <p>Unauthorized</p>;

  const save = () => {
    updateUser({ ...user, name, phone });
    alert("Profil berhasil disimpan");
  };

  return (
    <>
      <h2>Informasi Akun</h2>

      <label>Nama Lengkap</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Nomor Telepon</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      <br />
      <button onClick={save}>Simpan Profil Saya</button>
    </>
  );
}
