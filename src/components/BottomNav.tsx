import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Item {
  to: string;
  label: string;
  icon: ReactNode;
  /** Other paths that should light up this tab */
  match?: (path: string) => boolean;
}

const items: Item[] = [
  {
    to: '/',
    label: 'Today',
    match: (p) => p === '/' || (p.startsWith('/patients/') && p.length > '/patients/'.length),
    icon: (
      <path d="M5 6h14v13H5zM5 10h14M9 4v4M15 4v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    ),
  },
  {
    to: '/pack',
    label: 'Pack list',
    icon: <path d="M4 8h16v12H4zM8 8V5h8v3M4 13h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  },
  {
    to: '/orders',
    label: 'Orders',
    match: (p) => p.startsWith('/orders'),
    icon: <path d="M7 4h10v17H7zM10 9h4M10 13h4M10 17h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  },
  {
    to: '/patients',
    label: 'Patients',
    match: (p) => p === '/patients' || p === '/tests',
    icon: (
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main" className="pb-safe border-t border-rule bg-surface">
      <ul className="mx-auto flex max-w-3xl">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.to;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-caption ${
                  active ? 'text-ink' : 'text-ink-2'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  {item.icon}
                </svg>
                <span className={active ? 'underline decoration-2 underline-offset-4' : ''}>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
