import { NavLink } from 'react-router-dom';
import { Home, Search, Moon, BookOpen, BarChart3 } from 'lucide-react';

const accent = '#c4a07c';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/cycle', icon: Moon, label: 'Cycle' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
];

export default function Navbar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(20,16,16,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around py-3">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '3px',
              padding: '2px 8px',
              color: isActive ? accent : '#4a4440',
              transition: 'color 0.3s',
            })}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span
              style={{
                fontSize: '8px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
              }}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
