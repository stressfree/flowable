import { NavLink } from 'react-router';
import { useHelp } from './HelpContext';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-[#4f46e5]'
      : 'text-[#374151] hover:bg-gray-100 hover:text-[#111827]'
  }`;

export function Sidebar() {
  const { toggle } = useHelp();

  return (
    <aside className="w-[220px] bg-white border-r border-[#e5e7eb] flex flex-col shrink-0">
      <div className="px-4 py-5 flex items-center gap-2 border-b border-[#e5e7eb]">
        <div className="w-8 h-8 rounded-md bg-[#4f46e5] flex items-center justify-center text-white font-bold text-lg">
          D
        </div>
        <span className="text-[#111827] font-semibold text-base">Decisioning</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-[#9ca3af] font-semibold">
          Workspace
        </p>
        <div className="space-y-1">
          <NavLink to="/companies" className={navItemClass}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Companies
          </NavLink>
          <NavLink to="/bundles" className={navItemClass}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Bundles
          </NavLink>
          <NavLink to="/bundles/new" className={navItemClass}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            New Bundle
          </NavLink>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-[#e5e7eb] space-y-3">
        <div className="flex items-center gap-2 px-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-[#6b7280]">Flowable connected</span>
        </div>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#374151] hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help & Docs
        </button>
      </div>
    </aside>
  );
}
