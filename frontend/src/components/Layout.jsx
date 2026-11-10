import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV } from '../nav';
import { LogOut, Menu as MenuIcon, UserRound } from 'lucide-react';

const isMobile = () => window.innerWidth <= 860;

export default function Layout() {
  const { user, logout } = useAuth();
  // true = hanya ikon, false = menu penuh. Di HP default-nya hanya ikon.
  const [collapsed, setCollapsed] = useState(() => isMobile());

  const groups = NAV
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.roles.includes(user.role)),
    }))
    .filter((g) => g.items.length);

  return (
    <div className="app">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* BRAND */}
        <div className="brand">
          <span className="logo">R</span>
          <div>
            <strong>Rosalina</strong>
            <small>Collection</small>
          </div>
        </div>

        {/* NAVIGASI */}
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
                    title={collapsed ? i.label : undefined}
                    onClick={() => { if (isMobile()) setCollapsed(true); }}
                    className={({ isActive }) =>
                      `nav-link icon-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {Icon && <Icon className="nav-icon" size={18} strokeWidth={2} />}
                    <span>{i.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* KELUAR (kiri bawah) */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            title={collapsed ? 'Keluar' : undefined}
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Layar gelap di HP saat sidebar terbuka */}
      {!collapsed && <div className="scrim" onClick={() => setCollapsed(true)} />}

      <div className="main">
        <header className="topbar">
          {/* HAMBURGER (kiri) */}
          <button
            type="button"
            className="btn ghost nav-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Buka menu' : 'Tutup menu'}
            aria-expanded={!collapsed}
          >
            <MenuIcon size={20} />
          </button>

          <div className="spacer" />

          {/* INFO PENGGUNA (kanan atas) */}
          <div className="who">
            <UserRound size={18} />
            <strong>{user.nama}</strong>
            <span className="badge muted">{user.role}</span>
          </div>

          {/* KELUAR (kanan atas) */}
          <button className="btn ghost sm" onClick={logout}>
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