import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import logo from "../../assets/logo.png";
import { loginUser, getMe } from "../../services/api";
import { setSession } from "../../utils/auth";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();
  const [showPw, setShowPw] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      const me = await getMe();
      setSession({ id: me.id, role: me.role, full_name: me.full_name, email: me.email ?? res.email ?? email });
      setLoggedIn(true);
      navigate(me.role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email atau kata sandi salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginShell">
      {/* LEFT - background + quote */}
      <section className="loginLeft" aria-label="Banner">
        <div className="loginLeft__overlay" />

        <div className="loginLeft__content">
          <Link to="/" className="logoLink" aria-label="Kembali ke Beranda">
            <img className="loginLeft__logo" src={logo} alt="Logo" />
          </Link>

          <div className="loginLeft__quote">
            “Gaperlu bingung
            <br />
            rencanain liburan kamu.”
          </div>
        </div>
      </section>

      {/* RIGHT - panel nempel kanan */}
      <section className="loginRight" aria-label="Login panel">
        <div className="loginRightPanel">
          <h1 className="loginTitle">Selamat Datang Kembali!</h1>

          <form className="loginForm" onSubmit={handleLogin}>
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="pwToggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  title={showPw ? "Sembunyikan" : "Tampilkan"}
                >
                  👁
                </button>
              </div>
            </label>

            {error && <div className="formError">{error}</div>}

            <button className="loginBtn" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>

            <div className="loginHint">
              Belum punya akun? <Link className="link" to="/register">Daftar</Link>
            </div>

          </form>
        </div>
      </section>
    </div>
  );
}
