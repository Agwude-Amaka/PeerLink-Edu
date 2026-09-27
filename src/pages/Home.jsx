import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HandHelping,
  Moon,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

function Home() {
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

  function toggleTheme() {
    const nextTheme = !isDark;

    setIsDark(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);

    localStorage.setItem(
      "peerlink-theme",
      nextTheme ? "dark" : "light"
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950 dark:bg-[#080c18] dark:text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-48 h-[600px] w-[600px] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-950/30" />

        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-950/20" />

        <div className="absolute bottom-[-300px] left-[30%] h-[600px] w-[600px] rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-950/20" />
      </div>

      {/* Navbar */}
      <header className="relative z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#080c18]/75">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-12">
          {/* Brand */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition duration-200 group-hover:-translate-y-0.5 dark:bg-indigo-500">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>

            <div className="leading-none">
              <div className="text-[17px] font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white">
                PeerLink{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  Edu
                </span>
              </div>

              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Learn together
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:inline-flex dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              Log in
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-slate-950"
            >
              <span className="hidden sm:inline">
                Create account
              </span>

              <span className="sm:hidden">Sign up</span>

              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1400px] items-center gap-16 px-6 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:py-20">
          {/* Hero copy */}
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Sparkles size={13} fill="currentColor" />
              </span>

              Your learning network
            </div>

            <h1 className="max-w-4xl text-[clamp(3.5rem,7vw,6.8rem)] font-black leading-[0.88] tracking-[-0.065em] text-slate-950 dark:text-white">
              Learn better.
              <br />

              <span className="text-indigo-600 dark:text-indigo-400">
                Together.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              PeerLink Edu connects students who need help with
              students who can share what they know — creating a
              learning community where everyone can contribute,
              connect, and grow.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Get started

                <ArrowRight
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
              >
                I already have an account
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                </span>
                Find peer support
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Users size={12} />
                </span>
                Learn from students
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <GraduationCap size={12} />
                </span>
                Grow together
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-[520px]">
            {/* Glow */}
            <div className="absolute -inset-8 rounded-[50px] bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10" />

            <div className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#111827]/90 dark:shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 dark:border-white/10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                    PeerLink network
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                    Everyone has something to share.
                  </h2>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Users size={21} />
                </div>
              </div>

              {/* Feature cards */}
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/40 dark:border-white/5 dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <HandHelping size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Find Help
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Find students who understand the subject
                        you're working through.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/40 dark:border-white/5 dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <GraduationCap size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Offer Help
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Share what you know and become a helpful
                        part of the network.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/40 dark:border-white/5 dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Learn Together
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Turn peer support into real learning
                        connections.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom status */}
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white dark:bg-white/[0.07]">
                <div>
                  <p className="text-sm font-bold">
                    Your next connection starts here.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Learn. Share. Connect.
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500">
                  <ArrowRight size={17} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-t border-slate-200/70 bg-white/50 py-20 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
              How PeerLink works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl dark:text-white">
              Simple learning. Real connections.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
              PeerLink makes it easy to find the right person,
              ask for help, and share your own knowledge.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Find someone",
                text: "Browse available help offers and find a student who can help with what you're learning.",
              },
              {
                number: "02",
                title: "Connect",
                text: "Send a request, choose your preferred times, and coordinate your learning session.",
              },
              {
                number: "03",
                title: "Grow together",
                text: "Learn from each other and build meaningful academic connections along the way.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {step.number}
                </span>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-slate-950 px-7 py-12 text-white shadow-2xl sm:px-12 dark:bg-indigo-950/50 dark:ring-1 dark:ring-white/10">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-indigo-300">
                Start your PeerLink journey
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Learn something new with someone who gets it.
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Create your account and become part of your
                school's peer learning network.
              </p>
            </div>

            <Link
              to="/signup"
              className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create account

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/70 px-6 py-7 dark:border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <BookOpen size={16} />
            </div>

            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              PeerLink Edu
            </span>
          </div>

          <p className="text-xs font-medium text-slate-400">
            Learn together. Grow together.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default Home;