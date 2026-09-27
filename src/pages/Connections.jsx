import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Send,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

function Connections() {
  const { user } = useAuth();

  const [connections, setConnections] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedConnection, setSelectedConnection] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [sendingMessage, setSendingMessage] =
    useState(false);
  const [messageError, setMessageError] = useState("");

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      loadConnections(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!selectedConnection || !user?.id) {
      return;
    }

    loadMessages(
      user.id,
      selectedConnection.id,
      selectedConnection.requestId
    );
    subscribeToMessages(
      user.id,
      selectedConnection.id,
      selectedConnection.requestId
    );

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    selectedConnection?.id,
    selectedConnection?.requestId,
    user?.id,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function loadConnections(currentUserId) {
    setLoading(true);
    setError("");

    if (!currentUserId) {
      setError("No logged-in user was found.");
      setLoading(false);
      return;
    }

    const {
      data: requests,
      error: requestsError,
    } = await supabase
      .from("help_requests")
      .select(`
        id,
        requester_id,
        helper_id,
        subject,
        message,
        status,
        created_at,
        help_offer_id
      `)
      .or(
        `requester_id.eq.${currentUserId},helper_id.eq.${currentUserId}`
      )
      .order("created_at", {
        ascending: false,
      });

    if (requestsError) {
      console.error(
        "Connections requests error:",
        requestsError
      );

      setError(requestsError.message);
      setConnections([]);
      setPendingCount(0);
      setLoading(false);
      return;
    }

    const allRequests = requests || [];

    const pending = allRequests.filter(
      (request) => request.status === "pending"
    );

    setPendingCount(pending.length);

    const accepted = allRequests.filter(
      (request) => request.status === "accepted"
    );

    if (accepted.length === 0) {
      setConnections([]);
      setLoading(false);
      return;
    }

    // Every accepted request is its own connection/card,
    // even if it's with the same peer as another one
    // (e.g. two different subjects with the same student).
    const uniqueRequests = accepted;

    const peerIds = [
      ...new Set(
        uniqueRequests
          .map((request) =>
            request.requester_id === currentUserId
              ? request.helper_id
              : request.requester_id
          )
          .filter(Boolean)
      ),
    ];

    let profiles = [];

    if (peerIds.length > 0) {
      const {
        data: profileData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          class_level,
          school,
          bio,
          subjects_help,
          interests
        `)
        .in("id", peerIds);

      if (profilesError) {
        console.error(
          "Connections profiles error:",
          profilesError
        );

        setError(profilesError.message);
        setConnections([]);
        setLoading(false);
        return;
      }

      profiles = profileData || [];
    }

    const offerIds = [
      ...new Set(
        uniqueRequests
          .map((request) => request.help_offer_id)
          .filter(Boolean)
      ),
    ];

    let offers = [];

    if (offerIds.length > 0) {
      const {
        data: offerData,
        error: offersError,
      } = await supabase
        .from("help_offers")
        .select(`
          id,
          user_id,
          subject,
          topic,
          description
        `)
        .in("id", offerIds);

      if (offersError) {
        console.error(
          "Connections offers error:",
          offersError
        );

        setError(offersError.message);
        setConnections([]);
        setLoading(false);
        return;
      }

      offers = offerData || [];
    }

    const acceptedRequestIds = accepted.map(
      (request) => request.id
    );

    let sessions = [];

    if (acceptedRequestIds.length > 0) {
      const {
        data: sessionData,
        error: sessionsError,
      } = await supabase
        .from("help_request_sessions")
        .select(`
          id,
          help_request_id,
          availability_id,
          status,
          meeting_method,
          meeting_link,
          meeting_notes,
          created_at,
          help_availability (
            id,
            available_date,
            start_time,
            end_time
          )
        `)
        .in(
          "help_request_id",
          acceptedRequestIds
        );

      if (sessionsError) {
        console.error(
          "Connections sessions error:",
          sessionsError
        );

        setError(sessionsError.message);
        setConnections([]);
        setLoading(false);
        return;
      }

      sessions = sessionData || [];
    }

    sessions.sort((a, b) => {
      const aDate =
        a.help_availability?.available_date || "";

      const bDate =
        b.help_availability?.available_date || "";

      const dateComparison =
        aDate.localeCompare(bDate);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      const aTime =
        a.help_availability?.start_time || "";

      const bTime =
        b.help_availability?.start_time || "";

      return aTime.localeCompare(bTime);
    });

    const profileMap = new Map(
      profiles.map((item) => [item.id, item])
    );

    const offerMap = new Map(
      offers.map((item) => [item.id, item])
    );

    const sessionsByRequest = new Map();

    sessions.forEach((session) => {
      if (!session?.id) {
        return;
      }

      if (
        !sessionsByRequest.has(
          session.help_request_id
        )
      ) {
        sessionsByRequest.set(
          session.help_request_id,
          []
        );
      }

      sessionsByRequest
        .get(session.help_request_id)
        .push(session);
    });

    const realConnections = uniqueRequests.map(
      (request) => {
        const peerId =
          request.requester_id === currentUserId
            ? request.helper_id
            : request.requester_id;

        const peerProfile = profileMap.get(peerId);

        const offer = offerMap.get(
          request.help_offer_id
        );

        const requestSessions =
          sessionsByRequest.get(request.id) || [];

        const fullName =
          peerProfile?.full_name ||
          "PeerLink Student";

        const initials =
          fullName
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "S";

        return {
          id: peerId,
          requestId: request.id,
          name: fullName,
          initials,
          classLevel:
            peerProfile?.class_level || "Student",
          school: peerProfile?.school || "",
          bio: peerProfile?.bio || "",
          subjectsHelp:
            Array.isArray(
              peerProfile?.subjects_help
            )
              ? peerProfile.subjects_help
              : [],
          interests:
            Array.isArray(
              peerProfile?.interests
            )
              ? peerProfile.interests
              : [],
          subject:
            offer?.subject ||
            request.subject ||
            "Academic Help",
          topic:
            offer?.topic || "Peer Learning",
          description:
            offer?.description ||
            request.message ||
            "Learning together through PeerLink.",
          sessions: requestSessions,
        };
      }
    );

    setConnections(realConnections);
    setLoading(false);
  }

  async function loadMessages(
    currentUserId,
    peerId,
    requestId
  ) {
    setLoadingMessages(true);
    setMessageError("");

    const {
      data,
      error: messagesError,
    } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, message, created_at, help_request_id"
      )
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
      )
      .eq("help_request_id", requestId)
      .order("created_at", {
        ascending: true,
      });

    if (messagesError) {
      console.error(
        "Load messages error:",
        messagesError
      );

      setMessageError(messagesError.message);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(data || []);
    setLoadingMessages(false);
  }

  function subscribeToMessages(
    currentUserId,
    peerId,
    requestId
  ) {
    if (channelRef.current) {
      supabase.removeChannel(
        channelRef.current
      );
    }

    const channel = supabase
      .channel(
        `messages-${currentUserId}-${peerId}-${requestId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new;

          const belongsToConversation =
            newMessage.help_request_id === requestId &&
            ((newMessage.sender_id === currentUserId &&
              newMessage.receiver_id === peerId) ||
              (newMessage.sender_id === peerId &&
                newMessage.receiver_id === currentUserId));

          if (!belongsToConversation) {
            return;
          }

          setMessages((previous) => {
            const alreadyExists = previous.some(
              (message) =>
                message.id === newMessage.id
            );

            if (alreadyExists) {
              return previous;
            }

            return [...previous, newMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Message realtime channel error."
          );
        }
      });

    channelRef.current = channel;
  }

  async function sendMessage() {
    const cleanedMessage =
      messageText.trim();

    if (!cleanedMessage) {
      return;
    }

    if (!user?.id) {
      setMessageError(
        "Your session could not be verified."
      );
      return;
    }

    if (!selectedConnection?.id) {
      return;
    }

    setSendingMessage(true);
    setMessageError("");

    const {
      data: insertedMessage,
      error: insertError,
    } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id:
          selectedConnection.id,
        help_request_id:
          selectedConnection.requestId,
        message: cleanedMessage,
      })
      .select(
        "id, sender_id, receiver_id, message, created_at, help_request_id"
      )
      .single();

    if (insertError) {
      console.error(
        "Send message error:",
        insertError
      );

      setMessageError(insertError.message);
      setSendingMessage(false);
      return;
    }

    setMessages((previous) => {
      const alreadyExists = previous.some(
        (message) =>
          message.id === insertedMessage.id
      );

      if (alreadyExists) {
        return previous;
      }

      return [...previous, insertedMessage];
    });

    setMessageText("");
    setSendingMessage(false);
  }

  function formatMessageTime(dateString) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  function formatMessageDate(dateString) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  function formatSessionDate(dateString) {
    if (!dateString) {
      return "Date unavailable";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatSessionTime(timeString) {
    if (!timeString) {
      return "Time unavailable";
    }

    const [hours, minutes] =
      timeString.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function closeChat() {
    setSelectedConnection(null);
    setMessages([]);
    setMessageText("");
    setMessageError("");

    if (channelRef.current) {
      supabase.removeChannel(
        channelRef.current
      );

      channelRef.current = null;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />

          <div className="relative">
            <div className="h-6 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />

            <div className="mt-5 h-10 w-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />

            <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>

        <div className="flex items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white py-16 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Loader2
              size={19}
              className="animate-spin"
            />
            Loading your peer network...
          </div>
        </div>
      </div>
    );
  }

  const totalConnections = connections.length;
  const activeConnections = connections.length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-slate-100 blur-3xl dark:bg-slate-800/60" />
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Users size={14} />
                PeerLink Community
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                My Connections
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Keep track of the students you’re learning
                with, helping, and building meaningful academic
                connections with.
              </p>
            </div>

            <Link
              to="/find-help"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30"
            >
              Find Students
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                We couldn’t load your connections.
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-300/80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadConnections(user?.id)
              }
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-50 dark:bg-slate-900 dark:text-red-300 dark:ring-red-500/20 dark:hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Users size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Network
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {totalConnections}
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Total connections
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Connected
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {activeConnections}
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Active connections
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <Clock3 size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Awaiting
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {pendingCount}
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pending requests
          </p>
        </div>
      </section>

      {/* Connections */}
      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Your Peer Network
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Students you’ve connected with through real
              PeerLink requests.
            </p>
          </div>

          {connections.length > 0 && (
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {connections.length}{" "}
              {connections.length === 1
                ? "connection"
                : "connections"}
            </span>
          )}
        </div>

        {connections.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-10">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-500/10" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Users size={27} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Your network is just getting started
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Accept a help request or find another student
                to start building your peer network.
              </p>

              <Link
                to="/find-help"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Find Students
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {connections.map((connection) => (
              <article
                key={connection.requestId}
                className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
              >
                {/* Card top */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {connection.initials}

                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950 dark:text-white">
                          {connection.name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {connection.classLevel}
                        </p>

                        {connection.school && (
                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {connection.school}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Active
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
                        <BookOpen size={15} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Learning focus
                        </p>

                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                          {connection.subject}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {connection.topic}
                    </p>

                    <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {connection.description}
                    </p>
                  </div>

                  {/* Sessions */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="text-indigo-600 dark:text-indigo-400"
                        />

                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Sessions
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {connection.sessions.length}
                      </span>
                    </div>

                    {connection.sessions.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">
                          No scheduled session has been
                          attached to this connection yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {connection.sessions.map(
                          (session) => (
                            <div
                              key={session.id}
                              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                  <CalendarDays size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {formatSessionDate(
                                      session
                                        .help_availability
                                        ?.available_date
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    {formatSessionTime(
                                      session
                                        .help_availability
                                        ?.start_time
                                    )}{" "}
                                    –{" "}
                                    {formatSessionTime(
                                      session
                                        .help_availability
                                        ?.end_time
                                    )}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                        session.status ===
                                        "scheduled"
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                      }`}
                                    >
                                      {session.status ||
                                        "scheduled"}
                                    </span>

                                    {session.meeting_method && (
                                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        {session.meeting_method}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {session?.id ? (
                                <Link
                                  to={`/session/${session.id}`}
                                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                                >
                                  Open Session
                                  <ArrowRight size={14} />
                                </Link>
                              ) : (
                                <p className="mt-3 text-xs font-medium text-red-500">
                                  Session ID unavailable
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedConnection(connection)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                    >
                      <MessageCircle size={16} />
                      Message
                    </button>

                    {connection.sessions.length > 0 &&
                      connection.sessions[0]?.id && (
                        <Link
                          to={`/session/${connection.sessions[0].id}`}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                          aria-label={`Open ${connection.name}'s next session`}
                        >
                          <ArrowRight size={17} />
                        </Link>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/60 blur-3xl dark:bg-indigo-400/10" />

        <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
              <Users size={17} />
            </div>

            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Grow your learning network
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Find students who need help with subjects you
              understand and build useful academic connections.
            </p>
          </div>

          <Link
            to="/find-help"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-md dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-500/20 dark:hover:bg-slate-800"
          >
            Find Students
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Chat Modal */}
      {selectedConnection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex h-full items-center justify-center">
            <div className="flex h-full max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
              {/* Chat Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {selectedConnection.initials}

                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-950 dark:text-white">
                      {selectedConnection.name}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {selectedConnection.subject} ·{" "}
                      {selectedConnection.topic}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeChat}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close chat"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 dark:bg-slate-950/60 sm:px-6 sm:py-6">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Loading conversation...
                    </div>
                  </div>
                ) : messageError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      We couldn’t load this conversation.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-300/80">
                      {messageError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        loadMessages(
                          user.id,
                          selectedConnection.id,
                          selectedConnection.requestId
                        )
                      }
                      className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 dark:bg-slate-900 dark:text-red-300 dark:ring-red-500/20"
                    >
                      Try again
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-full items-center justify-center">
                    <div className="max-w-sm text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <MessageCircle size={25} />
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                        Start the conversation
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Send {selectedConnection.name} your first
                        message about {selectedConnection.subject}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(
                      (message, index) => {
                        const isMine =
                          message.sender_id ===
                          user.id;

                        const previousMessage =
                          messages[index - 1];

                        const showDate =
                          !previousMessage ||
                          formatMessageDate(
                            previousMessage.created_at
                          ) !==
                            formatMessageDate(
                              message.created_at
                            );

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="my-5 text-center">
                                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                  {formatMessageDate(
                                    message.created_at
                                  )}
                                </span>
                              </div>
                            )}

                            <div
                              className={`flex ${
                                isMine
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                                  isMine
                                    ? "rounded-br-md bg-indigo-600 text-white"
                                    : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800"
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-6">
                                  {message.message}
                                </p>

                                <div
                                  className={`mt-1 text-[10px] ${
                                    isMine
                                      ? "text-indigo-100"
                                      : "text-slate-400 dark:text-slate-500"
                                  }`}
                                >
                                  {formatMessageTime(
                                    message.created_at
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="flex items-end gap-3">
                  <textarea
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder={`Message ${selectedConnection.name}...`}
                    className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      sendingMessage ||
                      !messageText.trim()
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sendingMessage ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  Press Enter to send · Shift + Enter for a new line
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Connections;