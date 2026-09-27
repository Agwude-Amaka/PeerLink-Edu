import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  HandHelping,
  ClipboardList,
  Users,
  UserCircle,
  BookOpen,
  LogOut,
  Moon,
  Sun,
  FolderOpen,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Find Help",
    path: "/find-help",
    icon: Search,
  },
  {
    label: "Offer Help",
    path: "/offer-help",
    icon: HandHelping,
  },
  {
    label: "My Offers",
    path: "/my-offers",
    icon: FolderOpen,
  },
  {
    label: "Requests",
    path: "/requests",
    icon: ClipboardList,
  },
  {
    label: "Connections",
    path: "/connections",
    icon: Users,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserCircle,
  },
];

function Navbar({
  sidebarOpen,
  toggleSidebar,
  closeSidebar,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const fullName = profile?.full_name || "Student";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function toggleTheme() {
    const nextMode = !darkMode;

    setDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("peerlink-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("peerlink-theme", "light");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-200/80 bg-white shadow-[8px_0_30px_rgba(15,23,42,0.06)] transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 dark:shadow-[8px_0_30px_rgba(0,0,0,0.2)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <Link
            to="/dashboard"
            onClick={closeSidebar}
            className="group flex min-w-0 items-center gap-3"
          >
            {/* Logo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition duration-200 group-hover:scale-[1.03]">
              <BookOpen size={21} strokeWidth={2} />
            </div>

            {/* Brand text */}
            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                PeerLink{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  Edu
                </span>
              </p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Learn together
              </p>
            </div>
          </Link>

          {/* Close */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Close navigation menu"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                location.pathname === item.path ||
                (item.path === "/my-offers" &&
                  location.pathname.startsWith("/my-offers/"));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                  }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                  )}

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                        : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-sm dark:group-hover:bg-slate-800 dark:group-hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.9}
                    />
                  </span>

                  <span className="flex-1">{item.label}</span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="text-indigo-500 dark:text-indigo-400"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="mb-3 flex w-full items-center justify-between rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </span>

              {darkMode ? "Light mode" : "Dark mode"}
            </span>

            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                darkMode
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  darkMode ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          {/* User card */}
          <Link
            to="/profile"
            onClick={closeSidebar}
            className="group mb-3 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 transition-all duration-200 hover:border-indigo-100 hover:bg-indigo-50/60 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900"
          >
            {/* Avatar */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
              {initials}

              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-emerald-500 dark:border-slate-900" />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                {fullName}
              </p>

              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {profile?.class_level || "Student"}
              </p>
            </div>

            <ChevronRight
              size={15}
              className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400 dark:text-slate-600"
            />
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg">
              <LogOut size={17} />
            </span>

            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;