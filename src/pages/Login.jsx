import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
const [isDark, setIsDark] = useState(() =>
  document.documentElement.classList.contains("dark")
);

useEffect(() => {
  const savedTheme = localStorage.getItem("peerlink-theme");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    setIsDark(true);
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
    setIsDark(false);
  }
}, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function toggleTheme() {
  const nextTheme = !isDark;

  setIsDark(nextTheme);

  document.documentElement.classList.toggle("dark", nextTheme);

  localStorage.setItem(
    "peerlink-theme",
    nextTheme ? "dark" : "light"
  );
}

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950 dark:bg-[#080c18] dark:text-white">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-950/30" />
        <div className="absolute right-[-180px] top-[15%] h-[520px] w-[520px] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-950/30" />
        <div className="absolute bottom-[-250px] left-[35%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-950/20" />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#080c18]/70">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-12">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="PeerLink Edu home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition-transform duration-200 group-hover:-translate-y-0.5 dark:bg-indigo-500">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>

            <div className="leading-none">
              <div className="text-[17px] font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white">
                PeerLink <span className="text-indigo-600 dark:text-indigo-400">Edu</span>
              </div>

              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Learn together
              </div>
            </div>
          </Link>

          {/* Navigation */}
       <div className="flex items-center gap-2 sm:gap-3">
  <Link
    to="/"
    className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:inline-flex dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
  >
    Back to home
  </Link>

  {/* Theme toggle */}
  <button
    type="button"
    onClick={toggleTheme}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
  >
    {isDark ? (
      <Sun size={18} />
    ) : (
      <Moon size={18} />
    )}
  </button>

  <Link
    to="/signup"
    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-slate-950"
  >
    <span className="hidden sm:inline">Create account</span>
    <span className="sm:hidden">Sign up</span>
    <ArrowRight size={15} />
  </Link>
</div>
        </div>
      </header>

      {/* Main */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-76px)] max-w-[1400px] items-center gap-12 px-6 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:py-16">
        {/* Left side */}
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Sparkles size={13} fill="currentColor" />
            </span>

            Your learning network
          </div>

          {/* Heading */}
          <h1 className="max-w-[760px] text-[clamp(3.5rem,7vw,6.8rem)] font-black leading-[0.88] tracking-[-0.065em] text-slate-950 dark:text-white">
            Learn better.
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">
              Together.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
            PeerLink Edu connects students who need help with students who
            can share what they know — making learning more collaborative,
            supportive, and real.
          </p>

          {/* Feature points */}
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Users size={12} />
              </span>
              Find your people
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <GraduationCap size={12} />
              </span>
              Share what you know
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Sparkles size={12} />
              </span>
              Grow together
            </div>
          </div>

          {/* Decorative network */}
          <div className="relative mt-12 hidden h-28 max-w-lg md:block">
            <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-indigo-500/30" />

            <div className="absolute left-[8%] top-[26%] h-3 w-3 rounded-full bg-indigo-400 shadow-[0_0_0_7px_rgba(99,102,241,0.10)]" />
            <div className="absolute left-[31%] top-[66%] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_0_7px_rgba(139,92,246,0.10)]" />
            <div className="absolute left-[51%] top-[22%] h-4 w-4 rounded-full bg-indigo-600 shadow-[0_0_0_8px_rgba(79,70,229,0.10)] dark:bg-indigo-400" />
            <div className="absolute right-[25%] top-[64%] h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_0_7px_rgba(139,92,246,0.10)]" />
            <div className="absolute right-[5%] top-[28%] h-3 w-3 rounded-full bg-indigo-400 shadow-[0_0_0_7px_rgba(99,102,241,0.10)]" />

            <div className="absolute left-[49%] top-[8%] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 dark:bg-indigo-500">
              <BookOpen size={21} />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
          {/* Glow behind card */}
          <div className="absolute -inset-5 rounded-[40px] bg-indigo-400/10 blur-2xl dark:bg-indigo-500/10" />

          {/* Login card */}
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-9 dark:border-white/10 dark:bg-[#111827]/90 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <BookOpen size={20} />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                    PeerLink Edu
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Student learning network
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                Secure
              </span>
            </div>

            {/* Form intro */}
            <div className="mt-8">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                Ready to keep learning?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Sign in to find help, manage your offers, and stay connected
                with your learning community.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Email address
                </label>

                <div className="group relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-500"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-indigo-400 dark:focus:bg-white/[0.06] dark:focus:ring-indigo-400/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>
                </div>

                <div className="group relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-500"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-indigo-400 dark:focus:bg-white/[0.06] dark:focus:ring-indigo-400/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {loading ? "Logging in..." : "Log in to PeerLink"}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-7 border-t border-slate-100 pt-6 text-center dark:border-white/10">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Create one
                </Link>
              </p>
            </div>

            {/* Security note */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <Lock size={12} />
              Your account information stays protected.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;