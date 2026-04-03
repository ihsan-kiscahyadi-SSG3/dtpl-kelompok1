import { Link, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import {logoutUser} from "../services/api.ts";

const SESSION_KEY = "dummy_session";

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function Navbar() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ email: string } | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const logout = async () => {
      await logoutUser()
      clearSession();
      setSession(null);
      setOpen(false);
      navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="logoLink" aria-label="Kembali ke Beranda">
          <img className="loginLeft__logo" src={logo} alt="Logo" />
        </Link>

        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "nav__link" + (isActive ? " nav__link--active" : "")
            }
          >
            Beranda
          </NavLink>

          <NavLink
            to="/paket"
            className={({ isActive }) =>
              "nav__link" + (isActive ? " nav__link--active" : "")
            }
          >
            Paket Wisata
          </NavLink>

          <Link to="/penginapan" className="nav__link">Penginapan</Link>
          <a className="nav__link" href="#tentang">
            Tentang Kami
          </a>
        </nav>

        <div className="nav__actions">
          {!session ? (
            <>
              <Link to="/login" className="btn btn--ghost">
                Masuk
              </Link>
              <Link to="/register" className="btn btn--primary">
                Daftar
              </Link>
            </>
          ) : (
            <div className="navAuth">
              <button className="navIconBtn" type="button" title="Tickets">
                <span className="navIconBtn__icon" aria-hidden="true">
                  🎟️
                </span>
                <span className="navIconBtn__label">Tickets</span>
              </button>

              <button className="navIconBtn" type="button" title="Wishlist">
                <span className="navIconBtn__icon" aria-hidden="true">
                  ❤️
                </span>
                <span className="navIconBtn__label">Wishlist</span>
              </button>

              <div className="profileMenu" ref={menuRef}>
                <button
                  type="button"
                  className="profileBtn"
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  title={session.email}
                >
                  <span className="profileIcon" aria-hidden="true">
                    👤
                  </span>
                  <span className="profileCaret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {open && (
                  <div className="profileDropdown" role="menu">
                    <button
                      className="profileItem"
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate("/account");
                      }}
                    >
                      Pengaturan Akun
                    </button>

                    <button
                      className="profileItem profileItem--danger"
                      type="button"
                      onClick={logout}
                    >
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
