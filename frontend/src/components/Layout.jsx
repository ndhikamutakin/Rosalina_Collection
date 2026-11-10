
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV } from '../nav';
import {
  LogOut,
  Menu as MenuIcon,
  UserRound,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const groups = NAV
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.roles.includes(user.role)),
    }))
    .filter((g) => g.items.length);

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* BRAND */}
        <div className="brand">
          <span className="logo">R</span>
          <div>
            <strong>Rosalina</strong>
            <small>Collection</small>
          </div>
        </div>

        {/* SIDEBAR NAVIGASI */}
        <nav>
          {groups.map((g) => (
            <div key={g.section}>
              <div className="nav-section">{g.section}</div>

              {g.items.map((i) => {
                const Icon = i.icon;

                return (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `nav-link icon-nav-link ${
                        isActive ? 'active' : ''
                      }`
                    }
                  >
                    {Icon && (
                      <Icon
                        className="nav-icon"
                        size={18}
                        strokeWidth={2}
                      />
                    )}

                    <span>{i.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* KELUAR KIRI BAWAH - OWNER DAN ADMIN */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Keluar</span>
          </button>
        </div>

      </aside>

      {open && (
        <div
          className="scrim"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="main">

        {/* NAVBAR ATAS */}
        <header className="topbar">

          <button
            className="btn ghost sm menu-btn"
            onClick={() => setOpen(true)}
          >
            <MenuIcon size={18} />
            Menu
          </button>

          <div className="spacer" />

          {/* INFORMASI PENGGUNA */}
          <div className="who">
            <UserRound size={18} />
            <strong>{user.nama}</strong>
            <span className="badge muted">{user.role}</span>
          </div>

          {/* KELUAR KANAN ATAS */}
          <button
            className="btn ghost sm"
            onClick={logout}
          >
            <LogOut size={17} />
            Keluar
          </button>

        </header>

        <main className="content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
