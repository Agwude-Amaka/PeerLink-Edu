import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Play,
  Square,
  Users,
} from "lucide-react";
import { supabase } from "../services/supabase";

function LiveClassMode({
  session,
  currentUserId,
  otherStudent,
  onOpenNotes,
  onOpenResources,
  onOpenConversation,
}) {
  const [liveStatus, setLiveStatus] = useState(
    session?.live_status || "not_started"
  );

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [startingClass, setStartingClass] =
    useState(false);

  const [endingClass, setEndingClass] =
    useState(false);

  const [classMessage, setClassMessage] =
    useState("");

  /*
   * Keep the local live status synchronized
   * with the session received from Supabase.
   */
  useEffect(() => {
    setLiveStatus(
      session?.live_status || "not_started"
    );
  }, [session?.live_status]);

  /*
   * Start a timer while the class is live.
   */
  useEffect(() => {
    if (liveStatus !== "live") {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(
        (previous) => previous + 1
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [liveStatus]);

  /*
   * Listen for changes to this session so that
   * another student can see when the class starts
   * or ends without manually refreshing.
   */
  useEffect(() => {
    if (!session?.id) {
      return;
    }

    const channel =
      supabase
        .channel(
          `live-class-${session.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "help_request_sessions",
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            const nextStatus =
              payload.new?.live_status;

            if (nextStatus) {
              setLiveStatus(nextStatus);
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  function formatDuration(seconds) {
    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds =
      seconds % 60;

    const formattedMinutes =
      String(minutes).padStart(2, "0");

    const formattedSeconds =
      String(
        remainingSeconds
      ).padStart(2, "0");

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        "0"
      )}:${formattedMinutes}:${formattedSeconds}`;
    }

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  async function startClass() {
    if (!session?.id || !currentUserId) {
      return;
    }

    setStartingClass(true);
    setClassMessage("");

    const {
      error: updateError,
    } = await supabase
      .from("help_request_sessions")
      .update({
        live_status: "live",
      })
      .eq("id", session.id);

    if (updateError) {
      console.error(
        "Start live class error:",
        updateError
      );

      setClassMessage(
        updateError.message ||
          "The class could not be started."
      );

      setStartingClass(false);
      return;
    }

    setElapsedSeconds(0);
    setLiveStatus("live");
    setClassMessage(
      "Your live class has started."
    );

    setStartingClass(false);
  }

  async function endClass() {
    if (!session?.id || !currentUserId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to end this live class?"
      );

    if (!confirmed) {
      return;
    }

    setEndingClass(true);
    setClassMessage("");

    const {
      error: updateError,
    } = await supabase
      .from("help_request_sessions")
      .update({
        live_status: "ended",
      })
      .eq("id", session.id);

    if (updateError) {
      console.error(
        "End live class error:",
        updateError
      );

      setClassMessage(
        updateError.message ||
          "The class could not be ended."
      );

      setEndingClass(false);
      return;
    }

    setLiveStatus("ended");
    setClassMessage(
      "This live class has ended."
    );

    setEndingClass(false);
  }

  const initials =
    otherStudent?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map(
        (part) => part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S";

  const subject =
    session?.offer?.subject ||
    session?.request?.subject ||
    "Peer Learning";

  const topic =
    session?.offer?.topic ||
    "Learning Session";

  /*
   * BEFORE CLASS
   */
  if (liveStatus === "not_started") {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Play size={23} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  Live Class
                </p>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Clock3 size={12} />
                  Ready to start
                </span>
              </div>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Ready for your session?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Start the class when you and your
                peer are ready. Your shared notes
                and learning resources will remain
                available during the session.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startClass}
            disabled={startingClass}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {startingClass ? (
              "Starting..."
            ) : (
              <>
                <Play
                  size={17}
                  fill="currentColor"
                />
                Start Live Class
              </>
            )}
          </button>
        </div>

        {classMessage && (
          <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {classMessage}
          </div>
        )}
      </section>
    );
  }

  /*
   * ENDED CLASS
   */
  if (liveStatus === "ended") {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={30} />
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Session ended
          </span>

          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Great work!
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            This live class has ended. Your shared
            notes and resources remain available
            in this Session Hub.
          </p>

          <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={onOpenNotes}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen size={15} />
              Notes
            </button>

            <button
              type="button"
              onClick={onOpenResources}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen size={15} />
              Resources
            </button>

            <button
              type="button"
              onClick={onOpenConversation}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MessageCircle size={15} />
              Conversation
            </button>
          </div>
        </div>
      </section>
    );
  }

  /*
   * LIVE CLASSROOM
   */
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
      {/* Live header */}
      <div className="border-b border-white/10 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                LIVE
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300">
                PeerLink Classroom
              </span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
              {topic}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {subject}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Class time
              </p>

              <p className="mt-1 font-mono text-lg font-bold text-white">
                {formatDuration(
                  elapsedSeconds
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={endClass}
              disabled={endingClass}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Square
                size={14}
                fill="currentColor"
              />
              {endingClass
                ? "Ending..."
                : "End Class"}
            </button>
          </div>
        </div>
      </div>

      {/* Main classroom */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Classroom */}
          <div className="min-h-[420px] rounded-3xl border border-white/10 bg-slate-900 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">
                  Classroom
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your private peer-learning space
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Connected
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {/* Current user */}
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-800/70 p-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500 text-xl font-bold text-white shadow-lg">
                  You
                </div>

                <p className="mt-4 text-sm font-bold text-white">
                  You
                </p>

                <span className="mt-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                  {session?.request
                    ?.requester_id ===
                  currentUserId
                    ? "Learner"
                    : "Peer Helper"}
                </span>
              </div>

              {/* Other student */}
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-800/70 p-6 text-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white shadow-lg">
                    {initials}
                  </div>

                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-800 bg-emerald-400" />
                </div>

                <p className="mt-4 text-sm font-bold text-white">
                  {otherStudent?.full_name ||
                    "Your Peer"}
                </p>

                <span className="mt-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                  {session?.request
                    ?.requester_id ===
                  currentUserId
                    ? "Peer Helper"
                    : "Learner"}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-500">
              <Users size={15} />
              2 students in this classroom
            </div>
          </div>

          {/* Classroom tools */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                  <BookOpen size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Learning Tools
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Everything you need for class
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={onOpenNotes}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.07]"
                >
                  <BookOpen
                    size={16}
                    className="text-indigo-300"
                  />

                  <span className="text-xs font-semibold text-slate-200">
                    Shared Notes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onOpenResources}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.07]"
                >
                  <BookOpen
                    size={16}
                    className="text-indigo-300"
                  />

                  <span className="text-xs font-semibold text-slate-200">
                    Session Resources
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onOpenConversation}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.07]"
                >
                  <MessageCircle
                    size={16}
                    className="text-indigo-300"
                  />

                  <span className="text-xs font-semibold text-slate-200">
                    Conversation
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Session status
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 size={17} />
                </span>

                <div>
                  <p className="text-sm font-bold text-white">
                    Class is live
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Both students can work here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {classMessage && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-medium text-slate-300">
            {classMessage}
          </div>
        )}
      </div>
    </section>
  );
}

export default LiveClassMode;

