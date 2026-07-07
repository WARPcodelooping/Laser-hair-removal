/**
 * ClientLayout — обёртка с парящей нижней навигацией (Главная / Услуги / Профиль).
 * До заполнения имени и телефона табы «Услуги» и «Профиль» заблокированы.
 */
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../store/app';

const tabs = [
  {
    to: '/',
    label: 'Главная',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    ),
  },
  {
    to: '/services',
    label: 'Услуги',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    ),
  },
  {
    to: '/profile',
    label: 'Профиль',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    ),
  },
];

export default function ClientLayout() {
  const { client } = useApp();
  const unregistered = !client?.name || !client?.phone;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 pb-32">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 px-5 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="mx-auto flex max-w-md rounded-[26px] border border-white/80 bg-white/85 p-1.5 shadow-dock backdrop-blur-xl">
          {tabs.map((t) => {
            const locked = unregistered && t.to !== '/';
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                aria-disabled={locked}
                onClick={(e) => {
                  if (locked) e.preventDefault();
                }}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-head font-semibold transition-all duration-200 ${
                    locked
                      ? 'text-muted/50'
                      : isActive
                        ? 'bg-gradient-to-b from-softer to-soft/40 text-accent'
                        : 'text-muted active:scale-95'
                  }`
                }
              >
                {locked ? (
                  <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ) : (
                  <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    {t.icon}
                  </svg>
                )}
                {t.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
