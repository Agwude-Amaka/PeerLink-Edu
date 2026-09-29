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

      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-900/15" />

      <div className="pointer-events-none absolute right-[-180px] top-48 h-[420px] w-[420px] rounded-full bg-slate-300/20 blur-3xl dark:bg-slate-800/20" />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[32px] border border-[#008f9f]/20 bg-[#0b1d25] px-6 py-8 text-white shadow-[0_25px_70px_rgba(8,60,70,0.14)] sm:px-8 sm:py-10 lg:px-11 lg:py-12 dark:border-[#43d4df]/15 dark:bg-[#0b171e]">
        {/* Aqua atmosphere */}
        <div className="pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full bg-[#00aebe]/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-180px] right-[18%] h-[360px] w-[360px] rounded-full bg-[#43d4df]/10 blur-3xl" />

        <div className="pointer-events-none absolute left-[42%] top-0 h-px w-[58%] bg-gradient-to-r from-transparent via-[#67dfe7]/30 to-transparent" />

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
            <div className="inline-flex items-center gap-2 rounded-full border border-[#43d4df]/20 bg-[#43d4df]/10 px-3.5 py-2 text-xs font-bold text-[#8ce8ee] backdrop-blur-md">
              <Sparkles size={13} />
              Your learning space
            </div>

            <h1 className="mt-6 max-w-3xl text-[clamp(2.8rem,5vw,4.7rem)] font-black leading-[0.94] tracking-[-0.06em]">
              Learn better.
              <br />
              <span className="text-[#55d6df]">Together.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#c6d8dd] sm:text-base">
              Find a peer who understands what you're learning, get the
              support you need, or share what you already know with someone
              else.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/find-help"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-[#14232c] shadow-xl shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#e8f8fa]"
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#6ee0e7]/20 bg-[#ffffff]/[0.06] px-5 py-3.5 text-sm font-extrabold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#43d4df]/10"
              >
                <HandHelping size={17} />

                Offer help
              </Link>
            </div>
          </div>

          {/* Learning network visual */}
          <div className="relative hidden h-[250px] lg:block">
            {/* Connection lines */}
            <div className="absolute left-[18%] top-[35%] h-px w-[62%] rotate-[10deg] bg-gradient-to-r from-transparent via-[#55d6df]/45 to-transparent" />

            <div className="absolute left-[27%] top-[58%] h-px w-[47%] -rotate-[20deg] bg-gradient-to-r from-transparent via-[#91a6ae]/35 to-transparent" />

            <div className="absolute left-[48%] top-[28%] h-px w-[30%] rotate-[55deg] bg-gradient-to-r from-transparent via-[#43d4df]/35 to-transparent" />

            {/* Main card */}
            <div className="absolute left-1/2 top-1/2 w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#91a6ae]">
                    PeerLink
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-white">
                    Learning network
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#43d4df]/15 text-[#67dfe7]">
                  <Users size={18} />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#43d4df]/15 text-[#67dfe7] shadow-[0_0_50px_rgba(67,212,223,0.16)]">
                  <BookOpen size={29} />

                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#10232b] bg-emerald-400" />
                </div>
              </div>

              <div className="mt-5 flex justify-center">
                <div className="flex -space-x-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111f27] bg-[#00aebe] text-[9px] font-extrabold">
                    MA
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111f27] bg-[#3b6570] text-[9px] font-extrabold">
                    CH
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111f27] bg-[#55d6df] text-[9px] font-extrabold text-[#143039]">
                    PH
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111f27] bg-[#31464f] text-[9px] font-extrabold text-[#cbd9dd]">
                    +
                  </span>
                </div>
              </div>
            </div>

            {/* Floating nodes */}
            <span className="absolute left-[4%] top-[28%] h-3 w-3 rounded-full bg-[#55d6df] shadow-[0_0_0_8px_rgba(67,212,223,0.08)]" />

            <span className="absolute bottom-[19%] left-[15%] h-2.5 w-2.5 rounded-full bg-[#91a6ae] shadow-[0_0_0_7px_rgba(145,166,174,0.08)]" />

            <span className="absolute right-[7%] top-[25%] h-3 w-3 rounded-full bg-[#8ce8ee] shadow-[0_0_0_8px_rgba(140,232,238,0.08)]" />

            <span className="absolute bottom-[15%] right-[18%] h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_7px_rgba(52,211,153,0.08)]" />
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3">
        {/* Connections */}
        <div className="group rounded-[24px] border border-[#d9e5e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,50,60,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(20,50,60,0.09)] dark:border-[#29424c] dark:bg-[#101f27] dark:shadow-none">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e2f8fa] text-[#008f9f] dark:bg-[#15343d] dark:text-[#55d6df]">
              <Users size={19} />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              Active
            </span>
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#14232c] dark:text-white">
            {loadingStats ? "—" : stats.peerConnections}
          </p>

          <p className="mt-1 text-sm font-semibold text-[#60737c] dark:text-[#91a6ae]">
            Peer connections
          </p>
        </div>

        {/* Topics */}
        <div className="group rounded-[24px] border border-[#d9e5e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,50,60,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(20,50,60,0.09)] dark:border-[#29424c] dark:bg-[#101f27] dark:shadow-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f1f4] text-[#35616c] dark:bg-[#1b323c] dark:text-[#8ce8ee]">
            <BookOpen size={19} />
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#14232c] dark:text-white">
            {loadingStats ? "—" : stats.topicsHelpedWith}
          </p>

          <p className="mt-1 text-sm font-semibold text-[#60737c] dark:text-[#91a6ae]">
            Topics in progress
          </p>
        </div>

        {/* Pending */}
        <div className="group rounded-[24px] border border-[#d9e5e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,50,60,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(20,50,60,0.09)] dark:border-[#29424c] dark:bg-[#101f27] dark:shadow-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Clock3 size={19} />
          </div>

          <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#14232c] dark:text-white">
            {loadingStats ? "—" : stats.pendingRequests}
          </p>

          <p className="mt-1 text-sm font-semibold text-[#60737c] dark:text-[#91a6ae]">
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
        <div className="overflow-hidden rounded-[28px] border border-[#d9e5e9] bg-white shadow-[0_8px_30px_rgba(20,50,60,0.05)] dark:border-[#29424c] dark:bg-[#101f27] dark:shadow-none">
          <div className="flex items-center justify-between border-b border-[#e4ecef] px-5 py-6 sm:px-7 dark:border-[#29424c]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00aebe]" />

                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#71838c] dark:text-[#91a6ae]">
                  Discover
                </p>
              </div>

              <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#14232c] dark:text-white">
                Topics students need help with
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#536871] dark:text-[#a9bbc1]">
                Explore subjects and connect with helpful peers.
              </p>
            </div>

            <Link
              to="/find-help"
              className="group hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-[#008f9f] transition hover:bg-[#e2f8fa] sm:inline-flex dark:text-[#55d6df] dark:hover:bg-[#15343d]"
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
                className="group flex items-center justify-between rounded-[20px] border border-[#e1eaed] bg-[#f1f6f8] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#a8dfe4] hover:bg-[#e7f8fa] hover:shadow-sm dark:border-[#29424c] dark:bg-[#162932] dark:hover:border-[#3c6974] dark:hover:bg-[#1b323c]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                      index === 0
                        ? "bg-[#d8f4f7] text-[#007d8c] dark:bg-[#153e46] dark:text-[#67dfe7]"
                        : index === 1
                          ? "bg-[#e4edf0] text-[#3b5d67] dark:bg-[#203640] dark:text-[#a9dce1]"
                          : "bg-[#dcebef] text-[#315e6a] dark:bg-[#1d3942] dark:text-[#8edce4]"
                    }`}
                  >
                    {item.initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#14232c] dark:text-white">
                      {item.subject}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-[#60737c] dark:text-[#91a6ae]">
                      {item.topic}
                    </p>
                  </div>
                </div>

                <Link
                  to="/find-help"
                  className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-[#008f9f] transition hover:bg-white dark:text-[#55d6df] dark:hover:bg-[#203640]"
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

          <div className="border-t border-[#e4ecef] px-5 py-4 sm:hidden dark:border-[#29424c]">
            <Link
              to="/find-help"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#e2f8fa] px-4 py-3 text-sm font-bold text-[#007d8c] dark:bg-[#15343d] dark:text-[#67dfe7]"
            >
              Explore all subjects
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Activity */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#d9e5e9] bg-white shadow-[0_8px_30px_rgba(20,50,60,0.05)] dark:border-[#29424c] dark:bg-[#101f27] dark:shadow-none">
          <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-44 w-44 rounded-full bg-[#00aebe]/5 blur-3xl" />

          <div className="relative border-b border-[#e4ecef] px-5 py-6 sm:px-7 dark:border-[#29424c]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00aebe]" />

              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#71838c] dark:text-[#91a6ae]">
                Your activity
              </p>
            </div>

            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#14232c] dark:text-white">
              Build your network
            </h2>
          </div>

          <div className="relative p-6 sm:p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e2f8fa] text-[#008f9f] dark:bg-[#15343d] dark:text-[#55d6df]">
              <Users size={23} />
            </div>

            <h3 className="mt-6 text-base font-extrabold text-[#14232c] dark:text-white">
              Make your profile discoverable
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#536871] dark:text-[#a9bbc1]">
              Add your subjects, strengths, and a short bio so the right peers
              can find you when they need help.
            </p>

            <Link
              to="/profile"
              className="group mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#14232c] px-4 py-3 text-sm font-extrabold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#008f9f] dark:bg-white dark:text-[#14232c] dark:hover:bg-[#e2f8fa]"
            >
              Complete profile

              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="border-t border-[#e4ecef] bg-[#f1f6f8] px-6 py-4 dark:border-[#29424c] dark:bg-[#162932]">
            <p className="text-xs leading-5 text-[#60737c] dark:text-[#a9bbc1]">
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