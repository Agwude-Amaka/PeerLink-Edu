import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HandHelping,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

const subjects = [
  {
    subject: "Mathematics",
    topic: "Trigonometry",
    initials: "MA",
  },
  {
    subject: "Chemistry",
    topic: "Mole Concept",
    initials: "CH",
  },
  {
    subject: "Physics",
    topic: "Waves",
    initials: "PH",
  },
];

function Dashboard() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboardStats() {
      if (!user?.id) {
        if (active) {
          setRequests([]);
          setLoadingStats(false);
        }

        return;
      }

      setLoadingStats(true);
      setStatsError("");

      const { data, error } = await supabase
        .from("help_requests")
        .select(
          "id, requester_id, helper_id, subject, message, status, created_at"
        )
        .or(`requester_id.eq.${user.id},helper_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Dashboard requests error:", error);
        setStatsError("Unable to load your activity right now.");
        setRequests([]);
      } else {
        setRequests(data || []);
      }

      setLoadingStats(false);
    }

    loadDashboardStats();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const acceptedRequests = requests.filter(
      (request) => request.status === "accepted"
    );

    const acceptedPeers = new Set();

    acceptedRequests.forEach((request) => {
      const peerId =
        request.requester_id === user?.id
          ? request.helper_id
          : request.requester_id;

      if (peerId) {
        acceptedPeers.add(peerId);
      }
    });

    const helpedSubjects = new Set();

    requests
      .filter(
        (request) =>
          request.requester_id === user?.id &&
          request.status === "accepted"
      )
      .forEach((request) => {
        const subject = request.subject?.trim();

        if (subject) {
          helpedSubjects.add(subject.toLowerCase());
        }
      });

    const pendingRequests = requests.filter(
      (request) =>
        request.status === "pending" &&
        (request.requester_id === user?.id ||
          request.helper_id === user?.id)
    );

    return {
      peerConnections: acceptedPeers.size,
      topicsHelpedWith: helpedSubjects.size,
      pendingRequests: pendingRequests.length,
    };
  }, [requests, user?.id]);

  return (
    <main className="relative mx-auto w-full max-w-[1400px] overflow-hidden pb-12">
      {/* =====================================================
          PAGE ATMOSPHERE
      ====================================================== */}

      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-950/20" />

      <div className="pointer-events-none absolute right-[-180px] top-48 h-[420px] w-[420px] rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-950/15" />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[#0b1020] px-6 py-8 text-white shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:px-8 sm:py-10 lg:px-11 lg:py-12">
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-180px] right-[18%] h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-3xl" />

        <div className="pointer-events-none absolute left-[42%] top-0 h-px w-[58%] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_330px] lg:items-center">
          {/* Copy */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-indigo-200 backdrop-blur-md">
              <Sparkles size={13} />
              Your learning space
            </div>

            <h1 className="mt-6 max-w-3xl text-[clamp(2.8rem,5vw,4.7rem)] font-black leading-[0.94] tracking-[-0.06em]">
              Learn better.
              <br />
              <span className="text-indigo-300">Together.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Find a peer who understands what you're learning, get the
              support you need, or share what you already know with someone
              else.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/find-help"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                <Search size={17} />

                Find help

                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/offer-help"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-sm font-extrabold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <HandHelping size={17} />

                Offer help
              </Link>
            </div>
          </div>

          {/* Learning network visual */}
          <div className="relative hidden h-[250px] lg:block">
            {/* Connection lines */}
            <div className="absolute left-[18%] top-[35%] h-px w-[62%] rotate-[10deg] bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />

            <div className="absolute left-[27%] top-[58%] h-px w-[47%] -rotate-[20deg] bg-gradient-to-r from-transparent via-violet-300/30 to-transparent" />

            <div className="absolute left-[48%] top-[28%] h-px w-[30%] rotate-[55deg] bg-gradient-to-r from-transparent via-indigo-300/30 to-transparent" />

            {/* Main card */}
            <div className="absolute left-1/2 top-1/2 w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    PeerLink
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-white">
                    Learning network
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                  <Users size={18} />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-indigo-500/15 text-indigo-300 shadow-[0_0_50px_rgba(99,102,241,0.16)]">
                  <BookOpen size={29} />

                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#101628] bg-emerald-400" />
                </div>
              </div>

              <div className="mt-5 flex justify-center">
                <div className="flex -space-x-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111729] bg-indigo-500 text-[9px] font-extrabold">
                    MA
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111729] bg-violet-500 text-[9px] font-extrabold">
                    CH
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111729] bg-emerald-500 text-[9px] font-extrabold">
                    PH
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111729] bg-slate-700 text-[9px] font-extrabold text-slate-300">
                    +
                  </span>
                </div>
              </div>
            </div>

            {/* Floating nodes */}
            <span className="absolute left-[4%] top-[28%] h-3 w-3 rounded-full bg-indigo-400 shadow-[0_0_0_8px_rgba(99,102,241,0.08)]" />

            <span className="absolute bottom-[19%] left-[15%] h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_0_7px_rgba(139,92,246,0.08)]" />

            <span className="absolute right-[7%] top-[25%] h-3 w-3 rounded-full bg-indigo-300 shadow-[0_0_0_8px_rgba(129,140,248,0.08)]" />

            <span className="absolute bottom-[15%] right-[18%] h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_7px_rgba(52,211,153,0.08)]" />
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3">
        {/* Connections */}
        <div className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Users size={19} />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              Active
            </span>
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            {loadingStats ? "—" : stats.peerConnections}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Peer connections
          </p>
        </div>

        {/* Topics */}
        <div className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <BookOpen size={19} />
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            {loadingStats ? "—" : stats.topicsHelpedWith}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Topics in progress
          </p>
        </div>

        {/* Pending */}
        <div className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Clock3 size={19} />
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            {loadingStats ? "—" : stats.pendingRequests}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Pending requests
          </p>
        </div>
      </section>

      {/* Error */}
      {statsError && (
        <div className="relative z-10 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {statsError}
        </div>
      )}

      {/* =====================================================
          DISCOVER + ACTIVITY
      ====================================================== */}

      <section className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        {/* Discover */}
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-6 sm:px-7 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Discover
                </p>
              </div>

              <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                Topics students need help with
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Explore subjects and connect with helpful peers.
              </p>
            </div>

            <Link
              to="/find-help"
              className="group hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 sm:inline-flex dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            >
              View all

              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {subjects.map((item, index) => (
              <div
                key={item.subject}
                className="group flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                      index === 0
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : index === 1
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                          : "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    }`}
                  >
                    {item.initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">
                      {item.subject}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.topic}
                    </p>
                  </div>
                </div>

                <Link
                  to="/find-help"
                  className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-white dark:text-indigo-300 dark:hover:bg-slate-800"
                >
                  Explore

                  <ChevronRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-5 py-4 sm:hidden dark:border-slate-800">
            <Link
              to="/find-help"
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              Explore all subjects
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Activity */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-44 w-44 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative border-b border-slate-100 px-5 py-6 sm:px-7 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Your activity
              </p>
            </div>

            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
              Build your network
            </h2>
          </div>

          <div className="relative p-6 sm:p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Users size={23} />
            </div>

            <h3 className="mt-6 text-base font-extrabold text-slate-950 dark:text-white">
              Make your profile discoverable
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Add your subjects, strengths, and a short bio so the right peers
              can find you when they need help.
            </p>

            <Link
              to="/profile"
              className="group mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"
            >
              Complete profile

              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/30">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              A stronger profile makes it easier to build meaningful study
              connections.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;