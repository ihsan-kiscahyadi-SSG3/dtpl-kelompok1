import { Link, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import { logoutUser } from "../services/api.ts";
import { useAuth } from "../contexts/AuthContext";
import { clearSession } from "../utils/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const { isLoggedIn, setLoggedIn, role, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleAdminClick = async () => {
    const latestRole = await refreshUser();
    if (latestRole === "admin") {
      setOpen(false);
      navigate("/admin/dashboard");
    }
  };

  const logout = async () => {
    await logoutUser();
    clearSession();
    setLoggedIn(false);
    setOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="logoLink" aria-label="Kembali ke Beranda">
          <img className="loginLeft__logo" src={logo} alt="Logo" />
        </Link>

        {role !== "admin" && (
          <nav className={`nav${menuOpen ? " nav--open" : ""}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                "nav__link" + (isActive ? " nav__link--active" : "")
              }
              onClick={closeMenu}
            >
              Beranda
            </NavLink>

            <NavLink
              to="/paket"
              className={({ isActive }) =>
                "nav__link" + (isActive ? " nav__link--active" : "")
              }
              onClick={closeMenu}
            >
              Paket Wisata
            </NavLink>

            <Link to="/penginapan" className="nav__link" onClick={closeMenu}>
              Penginapan
            </Link>
            <a className="nav__link" href="#tentang" onClick={closeMenu}>
              Tentang Kami
            </a>
          </nav>
        )}

        <div className="nav__actions">
          {!isLoggedIn ? (
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
              {role !== "admin" && (
                <>
                  <button
                    className="navIconBtn"
                    type="button"
                    title="Tickets"
                    onClick={() => navigate("/riwayat-pesanan")}
                  >
                    <span className="navIconBtn__icon" aria-hidden="true">
                      🎟️
                    </span>
                    <span className="navIconBtn__label">Tickets</span>
                  </button>
                  <button
                    className="navIconBtn"
                    type="button"
                    title="Wishlist"
                    onClick={() => navigate("/wishlist")}
                  >
                    <span className="navIconBtn__icon" aria-hidden="true">
                      ❤️
                    </span>
                    <span className="navIconBtn__label">Wishlist</span>
                  </button>
                </>
              )}

              <div className="profileMenu" ref={menuRef}>
                <button
                  type="button"
                  className="profileBtn"
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
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
                    {role === "admin" && (
                      <button
                        className="profileItem"
                        type="button"
                        onClick={handleAdminClick}
                      >
                        Admin Backoffice
                      </button>
                    )}
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

          <button
            type="button"
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
