import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";

function AppLayout() {
  const { profile } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fullName = profile?.full_name || "Student";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function toggleSidebar() {
    setSidebarOpen((current) => !current);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        closeSidebar={closeSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
          {/* Left side */}
          <div className="flex min-w-0 items-center gap-4">
            {/* Hamburger appears here ONLY when sidebar is closed */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Open navigation menu"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Menu size={22} strokeWidth={2} />
              </button>
            )}

            {/* Heading */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-400">
                PeerLink Edu
              </p>

              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Student workspace
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell />

            {/* Student information */}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fullName}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile?.class_level || "Student"}
              </p>
            </div>

            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {initials}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;