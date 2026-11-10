import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV } from '../nav';
import { LogOut, Menu as MenuIcon, UserRound, CalendarDays } from 'lucide-react';

const isMobile = () => window.innerWidth <= 860;

export default function Layout() {
  const { user, logout } = useAuth();
  // true = hanya ikon, false = menu penuh. Di HP default-nya hanya ikon.
  const [collapsed, setCollapsed] = useState(() => isMobile());

  // Tanggal hari ini (untuk tanggal produksi)
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
          <img className="logo-img" src="/logo-sidebar.png" alt="" />
          <img
            className="brand-wordmark"
            src="/wordmark-light.png"
            alt="Rosalina Collection"
          />
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

          {/* TANGGAL HARI INI */}
          <div className="topbar-date">
            <CalendarDays size={16} />
            <span>{today}</span>
          </div>

          <div className="spacer" />

          {/* INFO PENGGUNA (kanan atas) */}
          <div className="who">
            <UserRound size={18} />
            <strong>{user.nama}</strong>
            <span className="badge muted">{user.role}</span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}