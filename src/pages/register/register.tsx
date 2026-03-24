import { useState, type FormEvent } from "react";
import "./register.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../services/api";
import { setSession } from "../../utils/auth";

export default function Register() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const registerRes = await registerUser({ full_name: fullName, email, password });
      await loginUser({ email, password });
      setSession({ ...registerRes, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registerShell">
      {/* LEFT - background + quote */}
      <section className="registerLeft" aria-label="Banner">
        <div className="registerLeft__overlay" />

        <div className="registerLeft__content">
          <Link to="/" className="logoLink">
            <img className="loginLeft__logo" src={logo} alt="Logo" />
          </Link>
          <div className="registerLeft__quote">
            “Gaperlu bingung
            <br />
            rencanain liburan kamu.”
          </div>
        </div>
      </section>

      {/* RIGHT - panel nempel kanan */}
      <section className="registerRight" aria-label="Register panel">
        <div className="registerRightPanel">
          <h1 className="registerTitle">Daftar Sekarang</h1>

          <form className="registerForm" onSubmit={handleRegister}>
            <label className="field">
              <span className="field__label">Nama Lengkap</span>
              <input
                className="field__input"
                type="text"
                placeholder="Masukkan Nama Lengkap"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Alamat Email</span>
              <input
                className="field__input"
                type="email"
                placeholder="Masukkan Alamat Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Kata Sandi</span>

              <div className="field__inputWrap">
                <input
                  className="field__input field__input--withIcon"
                  type={showPw ? "text" : "password"}
                  placeholder="Masukkan Kata Sandi"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="pwToggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={
                    showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                >
                  👁
                </button>
              </div>
            </label>

            {error && <p className="registerError">{error}</p>}

            <button className="registerBtn" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Buat Akun"}
            </button>

            <div className="registerHint">
              Sudah punya akun?{" "}
              <a className="link" href="/login">
                Masuk
              </a>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
