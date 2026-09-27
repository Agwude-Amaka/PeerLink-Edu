import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Inbox,
  Loader2,
  Save,
  Send,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const subjects = [
  "Mathematics",
  "Physics",
  "Computer Science",
];

const statusFilters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

function Requests() {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [activeOffers, setActiveOffers] = useState(new Set());
  const [offerCheckFailed, setOfferCheckFailed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");

  // Edit request
  const [editingRequest, setEditingRequest] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editPreferences, setEditPreferences] = useState([]);
  const [editAvailablePreferences, setEditAvailablePreferences] =
    useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessageStatus, setEditMessageStatus] = useState("");

  // Delete request
  const [deletingRequestId, setDeletingRequestId] = useState(null);
  const [deleteConfirmRequest, setDeleteConfirmRequest] =
    useState(null);

  // Scheduling
  const [schedulingRequest, setSchedulingRequest] = useState(null);
  const [requestPreferences, setRequestPreferences] = useState([]);
  const [existingSessions, setExistingSessions] = useState([]);
  const [selectedSessionSlots, setSelectedSessionSlots] =
    useState([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");

  const [sessionMap, setSessionMap] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be verified.");
      setLoading(false);
      return;
    }

    const { data: sent, error: sentError } = await supabase
      .from("help_requests")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (sentError) {
      console.error("Sent requests error:", sentError);
      setError(sentError.message);
      setLoading(false);
      return;
    }

    const { data: received, error: receivedError } = await supabase
      .from("help_requests")
      .select("*")
      .eq("helper_id", user.id)
      .order("created_at", { ascending: false });

    if (receivedError) {
      console.error("Received requests error:", receivedError);
      setError(receivedError.message);
      setLoading(false);
      return;
    }

    const sentList = sent || [];
    const receivedList = received || [];

    setSentRequests(sentList);
    setReceivedRequests(receivedList);

    // ----------------------------------------------------------
    // Check the exact offer attached to each request.
    // ----------------------------------------------------------

    const offerIds = [
      ...sentList.map((request) => request.help_offer_id),
      ...receivedList.map((request) => request.help_offer_id),
    ].filter(Boolean);

    setOfferCheckFailed(false);

    const uniqueOfferIds = [...new Set(offerIds)];

    if (uniqueOfferIds.length > 0) {
      const {
        data: offerData,
        error: offerError,
      } = await supabase
        .from("help_offers")
        .select("id")
        .in("id", uniqueOfferIds);

      if (offerError) {
        console.error("Active offers check error:", offerError);
        setOfferCheckFailed(true);
      } else {
        setActiveOffers(
          new Set((offerData || []).map((offer) => offer.id))
        );
      }
    } else {
      setActiveOffers(new Set());
    }

    // ----------------------------------------------------------
    // Load profiles.
    // ----------------------------------------------------------

    const profileIds = [
      ...sentList.map((request) => request.helper_id),
      ...receivedList.map((request) => request.requester_id),
    ].filter(Boolean);

    const uniqueProfileIds = [...new Set(profileIds)];

    if (uniqueProfileIds.length > 0) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, class_level, bio")
        .in("id", uniqueProfileIds);

      if (profileError) {
        console.error("Profile lookup error:", profileError);
      } else {
        const profileMap = {};

        (profileData || []).forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        setProfiles(profileMap);
      }
    } else {
      setProfiles({});
    }

    // ----------------------------------------------------------
    // Load scheduled sessions.
    // ----------------------------------------------------------

    const requestIds = [
      ...sentList.map((request) => request.id),
      ...receivedList.map((request) => request.id),
    ];

    if (requestIds.length > 0) {
      const {
        data: sessions,
        error: sessionsError,
      } = await supabase
        .from("help_request_sessions")
        .select(`
          id,
          help_request_id,
          availability_id,
          status,
          help_availability (
            id,
            available_date,
            start_time,
            end_time
          )
        `)
        .in("help_request_id", requestIds);

      if (sessionsError) {
        console.error("Request sessions error:", sessionsError);
      } else {
        const groupedSessions = {};

        (sessions || []).forEach((session) => {
          if (!groupedSessions[session.help_request_id]) {
            groupedSessions[session.help_request_id] = [];
          }

          groupedSessions[session.help_request_id].push(session);
        });

        Object.values(groupedSessions).forEach((list) => {
          list.sort((a, b) => {
            const aDate =
              a.help_availability?.available_date || "";
            const bDate =
              b.help_availability?.available_date || "";

            const dateComparison = aDate.localeCompare(bDate);

            if (dateComparison !== 0) {
              return dateComparison;
            }

            return (
              a.help_availability?.start_time || ""
            ).localeCompare(
              b.help_availability?.start_time || ""
            );
          });
        });

        setSessionMap(groupedSessions);
      }
    } else {
      setSessionMap({});
    }

    setLoading(false);
  }

  async function updateRequest(requestId, status) {
    setUpdatingId(requestId);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session could not be verified.");
      setUpdatingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("help_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("helper_id", user.id);

    if (updateError) {
      console.error("Request update error:", updateError);
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    if (status === "declined") {
      const { error: notificationError } = await supabase.rpc(
        "create_request_notification",
        {
          p_request_id: requestId,
          p_event: "request_declined",
        }
      );

      if (notificationError) {
        console.error(
          "Declined request notification error:",
          notificationError
        );
      }
    }

    setReceivedRequests((previous) =>
      previous.map((request) =>
        request.id === requestId
          ? { ...request, status }
          : request
      )
    );

    setSentRequests((previous) =>
      previous.map((request) =>
        request.id === requestId
          ? { ...request, status }
          : request
      )
    );

    setUpdatingId(null);

    await loadRequests();
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatAvailabilityDate(dateString) {
    if (!dateString) return "Date unavailable";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "Time unavailable";

    const [hours, minutes] = timeString.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusClasses(status) {
    switch (status) {
      case "accepted":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";

      case "declined":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

      default:
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
    }
  }

  function getStatusIcon(status) {
    if (status === "accepted") return <CheckCircle2 size={14} />;
    if (status === "declined") return <XCircle size={14} />;
    return <Clock3 size={14} />;
  }

  function formatStatus(status) {
    if (!status) return "Pending";

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function offerIsAvailable(request) {
    if (!request.help_offer_id) return false;

    if (offerCheckFailed) return true;

    return activeOffers.has(request.help_offer_id);
  }

  function getPersonName(request, direction) {
    const profileId =
      direction === "received"
        ? request.requester_id
        : request.helper_id;

    return profiles[profileId]?.full_name || "Peer Student";
  }

  function getPersonInitial(request, direction) {
    const name = getPersonName(request, direction);

    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "P"
    );
  }

  function matchesFilter(request) {
    if (activeFilter === "all") return true;

    return (request.status || "pending") === activeFilter;
  }

  const filteredReceivedRequests = useMemo(
    () => receivedRequests.filter(matchesFilter),
    [receivedRequests, activeFilter]
  );

  const filteredSentRequests = useMemo(
    () => sentRequests.filter(matchesFilter),
    [sentRequests, activeFilter]
  );

  // ----------------------------------------------------------
  // EDIT REQUEST
  // ----------------------------------------------------------

  function openEdit(request) {
    setEditingRequest(request);
    setEditSubject(request.subject || "");
    setEditMessage(request.message || "");
    setEditMessageStatus("");
    setError("");

    loadRequestPreferences(request.id);
  }

  async function loadRequestPreferences(requestId) {
    const {
      data,
      error: preferenceError,
    } = await supabase
      .from("help_request_preferences")
      .select(`
        id,
        availability_id,
        help_availability (
          id,
          available_date,
          start_time,
          end_time
        )
      `)
      .eq("help_request_id", requestId);

    if (preferenceError) {
      console.error(
        "Load request preferences error:",
        preferenceError
      );

      setEditMessageStatus(preferenceError.message);
      setEditPreferences([]);
      setEditAvailablePreferences([]);
      return;
    }

    const preferences = (data || [])
      .map((item) => item.help_availability)
      .filter(Boolean)
      .sort((a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      });

    setEditAvailablePreferences(preferences);
    setEditPreferences(preferences);
  }

  function closeEdit() {
    if (savingEdit) return;

    setEditingRequest(null);
    setEditSubject("");
    setEditMessage("");
    setEditPreferences([]);
    setEditAvailablePreferences([]);
    setEditMessageStatus("");
  }

  function toggleEditPreference(availability) {
    setEditPreferences((previous) => {
      const exists = previous.some(
        (item) => item.id === availability.id
      );

      if (exists) {
        return previous.filter(
          (item) => item.id !== availability.id
        );
      }

      return [...previous, availability].sort((a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      });
    });
  }

  async function saveEdit() {
    if (!editingRequest) return;

    if (!editSubject) {
      setEditMessageStatus("Please choose a subject.");
      return;
    }

    if (!editMessage.trim()) {
      setEditMessageStatus(
        "Please explain what you need help with."
      );
      return;
    }

    if (editPreferences.length === 0) {
      setEditMessageStatus(
        "Please select at least one preferred time."
      );
      return;
    }

    setSavingEdit(true);
    setEditMessageStatus("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setEditMessageStatus(
        "Your session could not be verified."
      );
      setSavingEdit(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("help_requests")
      .update({
        subject: editSubject,
        message: editMessage.trim(),
        availability_id: null,
      })
      .eq("id", editingRequest.id)
      .eq("requester_id", user.id)
      .eq("status", "pending");

    if (updateError) {
      console.error("Edit request error:", updateError);
      setEditMessageStatus(updateError.message);
      setSavingEdit(false);
      return;
    }

    const { error: deletePreferencesError } = await supabase
      .from("help_request_preferences")
      .delete()
      .eq("help_request_id", editingRequest.id);

    if (deletePreferencesError) {
      console.error(
        "Delete old preferences error:",
        deletePreferencesError
      );

      setEditMessageStatus(deletePreferencesError.message);
      setSavingEdit(false);
      return;
    }

    const preferenceRows = editPreferences.map(
      (availability) => ({
        help_request_id: editingRequest.id,
        availability_id: availability.id,
      })
    );

    const {
      error: insertPreferencesError,
    } = await supabase
      .from("help_request_preferences")
      .insert(preferenceRows);

    if (insertPreferencesError) {
      console.error(
        "Insert new preferences error:",
        insertPreferencesError
      );

      setEditMessageStatus(insertPreferencesError.message);
      setSavingEdit(false);
      return;
    }

    setSentRequests((previous) =>
      previous.map((request) =>
        request.id === editingRequest.id
          ? {
              ...request,
              subject: editSubject,
              message: editMessage.trim(),
              availability_id: null,
            }
          : request
      )
    );

    setEditMessageStatus(
      "Request updated successfully."
    );

    setTimeout(() => {
      closeEdit();
      loadRequests();
    }, 800);

    setSavingEdit(false);
  }

  // ----------------------------------------------------------
  // DELETE REQUEST
  // ----------------------------------------------------------

  function requestDeleteConfirmation(request) {
    setDeleteConfirmRequest(request);
  }

  function closeDeleteConfirmation() {
    if (deletingRequestId) return;

    setDeleteConfirmRequest(null);
  }

  async function deleteRequest(requestId) {
    setDeletingRequestId(requestId);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be verified.");
      setDeletingRequestId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("help_requests")
      .delete()
      .eq("id", requestId)
      .eq("requester_id", user.id)
      .eq("status", "pending");

    if (deleteError) {
      console.error("Delete request error:", deleteError);
      setError(deleteError.message);
      setDeletingRequestId(null);
      return;
    }

    setSentRequests((previous) =>
      previous.filter((request) => request.id !== requestId)
    );

    setDeletingRequestId(null);
    setDeleteConfirmRequest(null);
  }

  // ----------------------------------------------------------
  // SCHEDULING
  // ----------------------------------------------------------

  async function openSchedule(request) {
    if (!offerIsAvailable(request)) {
      setScheduleMessage(
        "This offer is no longer available."
      );
      return;
    }

    setSchedulingRequest(request);
    setRequestPreferences([]);
    setExistingSessions([]);
    setSelectedSessionSlots([]);
    setScheduleMessage("");
    setError("");
    setLoadingPreferences(true);

    const {
      data: preferencesData,
      error: preferenceError,
    } = await supabase
      .from("help_request_preferences")
      .select(`
        id,
        availability_id,
        help_availability (
          id,
          available_date,
          start_time,
          end_time
        )
      `)
      .eq("help_request_id", request.id);

    if (preferenceError) {
      console.error(
        "Schedule preferences error:",
        preferenceError
      );

      setScheduleMessage(preferenceError.message);
      setLoadingPreferences(false);
      return;
    }

    const preferences = (preferencesData || [])
      .map((item) => item.help_availability)
      .filter(Boolean)
      .sort((a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      });

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase
      .from("help_request_sessions")
      .select(`
        id,
        help_request_id,
        availability_id,
        status,
        help_availability (
          id,
          available_date,
          start_time,
          end_time
        )
      `)
      .eq("help_request_id", request.id);

    if (sessionError) {
      console.error(
        "Existing session lookup error:",
        sessionError
      );

      setScheduleMessage(sessionError.message);
      setLoadingPreferences(false);
      return;
    }

    const existing = (sessionData || [])
      .map((session) => session.help_availability)
      .filter(Boolean);

    setRequestPreferences(preferences);
    setExistingSessions(existing);
    setSelectedSessionSlots(existing);

    if (preferences.length === 0) {
      setScheduleMessage(
        "This request has no preferred times attached to it."
      );
    } else if (existing.length > 0) {
      setScheduleMessage(
        `${existing.length} ${
          existing.length === 1
            ? "session is"
            : "sessions are"
        } already scheduled for this request.`
      );
    }

    setLoadingPreferences(false);
  }

  function closeSchedule() {
    if (scheduling) return;

    setSchedulingRequest(null);
    setRequestPreferences([]);
    setExistingSessions([]);
    setSelectedSessionSlots([]);
    setScheduleMessage("");
  }

  function isAlreadyScheduled(availabilityId) {
    return existingSessions.some(
      (item) => item.id === availabilityId
    );
  }

  function toggleSessionSlot(availability) {
    setScheduleMessage("");

    if (isAlreadyScheduled(availability.id)) {
      return;
    }

    setSelectedSessionSlots((previous) => {
      const alreadySelected = previous.some(
        (item) => item.id === availability.id
      );

      if (alreadySelected) {
        return previous.filter(
          (item) => item.id !== availability.id
        );
      }

      return [...previous, availability].sort((a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      });
    });
  }

  async function scheduleRequest() {
    if (!schedulingRequest) return;

    if (!offerIsAvailable(schedulingRequest)) {
      setScheduleMessage(
        "This offer is no longer available."
      );
      return;
    }

    if (schedulingRequest.status !== "pending") {
      setScheduleMessage(
        "This request is no longer pending."
      );
      return;
    }

    const newSlots = selectedSessionSlots.filter(
      (slot) => !isAlreadyScheduled(slot.id)
    );

    if (
      newSlots.length === 0 &&
      existingSessions.length === 0
    ) {
      setScheduleMessage(
        "Please select at least one session time."
      );
      return;
    }

    setScheduling(true);
    setScheduleMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setScheduleMessage(
        "Your session could not be verified."
      );
      setScheduling(false);
      return;
    }

    if (schedulingRequest.helper_id !== user.id) {
      setScheduleMessage(
        "You do not have permission to schedule this request."
      );
      setScheduling(false);
      return;
    }

    if (newSlots.length > 0) {
      const sessionRows = newSlots.map(
        (availability) => ({
          help_request_id: schedulingRequest.id,
          availability_id: availability.id,
          status: "scheduled",
        })
      );

      const { error: sessionError } = await supabase
        .from("help_request_sessions")
        .insert(sessionRows);

      if (sessionError) {
        console.error(
          "Create sessions error:",
          sessionError
        );

        setScheduleMessage(sessionError.message);
        setScheduling(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("help_requests")
      .update({
        status: "accepted",
      })
      .eq("id", schedulingRequest.id)
      .eq("helper_id", user.id)
      .eq("status", "pending");

    if (updateError) {
      console.error(
        "Accept request error:",
        updateError
      );

      setScheduleMessage(updateError.message);
      setScheduling(false);
      return;
    }

const { error: notificationError } = await supabase.rpc(
  "create_request_notification",
  {
    p_request_id: schedulingRequest.id,
    p_event: "request_accepted",
  }
);

if (notificationError) {
  console.error(
    "Accepted request notification error:",
    notificationError
  );
}

    await loadRequests();

    const totalScheduled =
      existingSessions.length + newSlots.length;

    setScheduleMessage(
      `${totalScheduled} ${
        totalScheduled === 1
          ? "session"
          : "sessions"
      } scheduled successfully.`
    );

    setTimeout(() => {
      closeSchedule();
    }, 1000);

    setScheduling(false);
  }

  const totalRequests =
    sentRequests.length + receivedRequests.length;

  const pendingReceived = receivedRequests.filter(
    (request) => request.status === "pending"
  ).length;

  const acceptedRequests = [
    ...sentRequests,
    ...receivedRequests,
  ].filter(
    (request) => request.status === "accepted"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10 text-slate-900 dark:text-slate-100">
      {/* -------------------------------------------------- */}
      {/* HERO */}
      {/* -------------------------------------------------- */}

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-slate-100 blur-3xl dark:bg-slate-800/60" />
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Inbox size={14} />
                Your PeerLink activity
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Requests
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
                Manage the help you've requested and the students
                who have reached out to you.
              </p>
            </div>

            <Link
              to="/find-help"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Find a Peer
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total requests
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {totalRequests}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Waiting for you
              </p>

              <p className="mt-2 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {pendingReceived}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Accepted
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {acceptedRequests}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* FILTERS */}
      {/* -------------------------------------------------- */}

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeFilter === filter.key
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            Something went wrong.
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-[2rem] border border-slate-200 bg-white py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Loader2 size={22} className="animate-spin" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Loading your requests...
          </p>
        </div>
      )}

      {!loading && (
        <>
          {/* ------------------------------------------------ */}
          {/* RECEIVED */}
          {/* ------------------------------------------------ */}

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Inbox size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                    Incoming
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                    Requests For You
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Students asking you for academic help.
                  </p>
                </div>
              </div>

              <span className="hidden text-sm font-medium text-slate-400 sm:block dark:text-slate-500">
                {filteredReceivedRequests.length} shown
              </span>
            </div>

            {filteredReceivedRequests.length === 0 ? (
              <EmptyState
                icon={<Inbox size={28} />}
                title={
                  receivedRequests.length === 0
                    ? "No requests yet"
                    : "No matching requests"
                }
                description={
                  receivedRequests.length === 0
                    ? "When another student asks you for help, it will appear here."
                    : "Try another status filter to see your other requests."
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredReceivedRequests.map((request) => {
                  const sessions = sessionMap[request.id] || [];
                  const studentName = getPersonName(
                    request,
                    "received"
                  );
                  const offerAvailable =
                    offerIsAvailable(request);

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="p-6 sm:p-7">
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <Avatar
                                initials={getPersonInitial(
                                  request,
                                  "received"
                                )}
                                accent="indigo"
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                    {request.subject}
                                  </span>

                                  <span className="text-xs text-slate-400">
                                    {formatDate(
                                      request.created_at
                                    )}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                                  {studentName}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                                  Asked you for help
                                </p>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                  {request.message}
                                </p>
                              </div>
                            </div>

                            <StatusBadge status={request.status} />
                          </div>

                          {!offerAvailable && (
                            <UnavailableOffer />
                          )}

                          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                            {request.status === "pending" ? (
                              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRequest(
                                      request.id,
                                      "declined"
                                    )
                                  }
                                  disabled={
                                    updatingId === request.id
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                >
                                  {updatingId === request.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                  Decline
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openSchedule(request)
                                  }
                                  disabled={
                                    !offerAvailable ||
                                    (loadingPreferences &&
                                      schedulingRequest?.id ===
                                        request.id)
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {loadingPreferences &&
                                  schedulingRequest?.id ===
                                    request.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CalendarDays size={16} />
                                  )}
                                  Choose Times & Accept
                                </button>
                              </div>
                            ) : request.status === "accepted" &&
                              sessions.length > 0 ? (
                              <SessionReady
                                sessions={sessions}
                              />
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-slate-500">
                                This request has been{" "}
                                {request.status || "processed"}.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ------------------------------------------------ */}
          {/* SENT */}
          {/* ------------------------------------------------ */}

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Send size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    Outgoing
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                    Requests You Sent
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Keep track of the help you've asked for.
                  </p>
                </div>
              </div>

              <span className="hidden text-sm font-medium text-slate-400 sm:block dark:text-slate-500">
                {filteredSentRequests.length} shown
              </span>
            </div>

            {filteredSentRequests.length === 0 ? (
              <EmptyState
                icon={<Send size={28} />}
                title={
                  sentRequests.length === 0
                    ? "No requests sent"
                    : "No matching requests"
                }
                description={
                  sentRequests.length === 0
                    ? "Find a peer and send your first help request."
                    : "Try another status filter to see your other requests."
                }
                action={
                  sentRequests.length === 0 ? (
                    <Link
                      to="/find-help"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Find a Peer
                      <ArrowRight size={16} />
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredSentRequests.map((request) => {
                  const sessions = sessionMap[request.id] || [];
                  const helperName = getPersonName(
                    request,
                    "sent"
                  );
                  const offerAvailable =
                    offerIsAvailable(request);

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="p-6 sm:p-7">
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <Avatar
                                initials={getPersonInitial(
                                  request,
                                  "sent"
                                )}
                                accent="slate"
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                    {request.subject}
                                  </span>

                                  <span className="text-xs text-slate-400">
                                    {formatDate(
                                      request.created_at
                                    )}
                                  </span>
                                </div>

                                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                                  {helperName}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                                  Your help request
                                </p>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                  {request.message}
                                </p>
                              </div>
                            </div>

                            <StatusBadge status={request.status} />
                          </div>

                          {!offerAvailable && (
                            <UnavailableOffer sent />
                          )}

                          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                            {request.status === "pending" && (
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(request)
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Edit3 size={16} />
                                  Edit Request
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    requestDeleteConfirmation(
                                      request
                                    )
                                  }
                                  disabled={
                                    deletingRequestId ===
                                    request.id
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            )}

                            {request.status === "accepted" &&
                            sessions.length > 0 ? (
                              <SessionReady
                                sessions={sessions}
                                sent
                              />
                            ) : request.status ===
                              "accepted" ? (
                              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                Your request was accepted.
                              </p>
                            ) : request.status ===
                              "declined" ? (
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                This request was declined.
                              </p>
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-slate-500">
                                Waiting for {helperName} to
                                respond.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                  Keep learning
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
                  Need help with something else?
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Find another peer and send them a request.
                </p>
              </div>

              <Link
                to="/find-help"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-900/60 dark:hover:bg-slate-800"
              >
                Find a Peer
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>
        </>
      )}

      {/* -------------------------------------------------- */}
      {/* DELETE MODAL */}
      {/* -------------------------------------------------- */}

      {deleteConfirmRequest && (
        <ModalBackdrop onClose={closeDeleteConfirmation}>
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 size={21} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
              Delete this request?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              This pending help request will be permanently
              removed. This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={Boolean(deletingRequestId)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteRequest(deleteConfirmRequest.id)
                }
                disabled={Boolean(deletingRequestId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deletingRequestId ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Request
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* -------------------------------------------------- */}
      {/* EDIT MODAL */}
      {/* -------------------------------------------------- */}

      {editingRequest && (
        <ModalBackdrop onClose={closeEdit}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <ModalHeader
              eyebrow="Manage Request"
              title="Edit Help Request"
              description="Update your message and preferred times."
              onClose={closeEdit}
              disabled={savingEdit}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-6 sm:p-7">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Subject
                  </label>

                  <select
                    value={editSubject}
                    onChange={(event) =>
                      setEditSubject(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  >
                    <option value="">Choose a subject</option>

                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    What do you need help with?
                  </label>

                  <textarea
                    value={editMessage}
                    onChange={(event) =>
                      setEditMessage(event.target.value)
                    }
                    rows={5}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Preferred times
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Choose the times that work for you.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        Selected times
                      </p>

                      {editPreferences.length === 0 ? (
                        <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
                          No preferred times selected.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {editPreferences.map((availability) => (
                            <button
                              key={availability.id}
                              type="button"
                              onClick={() =>
                                toggleEditPreference(
                                  availability
                                )
                              }
                              className="flex w-full items-center gap-3 rounded-xl border-2 border-indigo-600 bg-white p-3 text-left shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                <CheckCircle2 size={17} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  {formatAvailabilityDate(
                                    availability.available_date
                                  )}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {formatTime(
                                    availability.start_time
                                  )}{" "}
                                  –{" "}
                                  {formatTime(
                                    availability.end_time
                                  )}
                                </p>
                              </div>

                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Remove
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Available from your original request
                      </p>

                      <div className="mt-3 space-y-2">
                        {editAvailablePreferences.filter(
                          (availability) =>
                            !editPreferences.some(
                              (selected) =>
                                selected.id === availability.id
                            )
                        ).length === 0 ? (
                          <p className="text-sm italic text-slate-500 dark:text-slate-400">
                            All available times are selected.
                          </p>
                        ) : (
                          editAvailablePreferences
                            .filter(
                              (availability) =>
                                !editPreferences.some(
                                  (selected) =>
                                    selected.id === availability.id
                                )
                            )
                            .map((availability) => (
                              <button
                                key={availability.id}
                                type="button"
                                onClick={() =>
                                  toggleEditPreference(
                                    availability
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  <CalendarDays size={17} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                    {formatAvailabilityDate(
                                      availability.available_date
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    {formatTime(
                                      availability.start_time
                                    )}{" "}
                                    –{" "}
                                    {formatTime(
                                      availability.end_time
                                    )}
                                  </p>
                                </div>

                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                  Add
                                </span>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {editMessageStatus && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      editMessageStatus.includes("successfully")
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {editMessageStatus}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingEdit ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* -------------------------------------------------- */}
      {/* SCHEDULE MODAL */}
      {/* -------------------------------------------------- */}

      {schedulingRequest && (
        <ModalBackdrop onClose={closeSchedule}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <ModalHeader
              eyebrow="Schedule Peer Sessions"
              title="Choose Times & Accept"
              description="Select one or more times you are willing to accept."
              onClose={closeSchedule}
              disabled={scheduling}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-6 sm:p-7">
                {/* Request summary */}
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
                  <div className="flex items-start gap-4">
                    <Avatar
                      initials={getPersonInitial(
                        schedulingRequest,
                        "received"
                      )}
                      accent="indigo"
                    />

                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 dark:text-white">
                        {getPersonName(
                          schedulingRequest,
                          "received"
                        )}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {schedulingRequest.subject}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {schedulingRequest.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preferred times */}
                <div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Student's preferred times
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Select one or more times. Already scheduled
                      times cannot be added twice.
                    </p>
                  </div>

                  {loadingPreferences ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 py-12 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Loading preferred times...
                      </div>
                    </div>
                  ) : requestPreferences.length === 0 ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        No preferred times were found.
                      </p>

                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        This request was created before the
                        multiple-time system was added.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requestPreferences.map((availability) => {
                        const alreadyScheduled =
                          isAlreadyScheduled(availability.id);

                        const isSelected =
                          alreadyScheduled ||
                          selectedSessionSlots.some(
                            (item) =>
                              item.id === availability.id
                          );

                        return (
                          <button
                            key={availability.id}
                            type="button"
                            onClick={() =>
                              toggleSessionSlot(availability)
                            }
                            disabled={alreadyScheduled}
                            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                              alreadyScheduled
                                ? "cursor-not-allowed border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                                : isSelected
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  alreadyScheduled
                                    ? "bg-emerald-600 text-white"
                                    : isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                                }`}
                              >
                                {alreadyScheduled ||
                                isSelected ? (
                                  <CheckCircle2 size={20} />
                                ) : (
                                  <CalendarDays size={19} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  {formatAvailabilityDate(
                                    availability.available_date
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {formatTime(
                                    availability.start_time
                                  )}{" "}
                                  –{" "}
                                  {formatTime(
                                    availability.end_time
                                  )}
                                </p>
                              </div>

                              {alreadyScheduled && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Scheduled
                                </span>
                              )}

                              {!alreadyScheduled &&
                                isSelected && (
                                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    Selected
                                  </span>
                                )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedSessionSlots.length > 0 && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                      {selectedSessionSlots.length}{" "}
                      {selectedSessionSlots.length === 1
                        ? "session"
                        : "sessions"}{" "}
                      selected
                    </p>

                    <div className="mt-3 space-y-1.5">
                      {selectedSessionSlots.map((slot) => (
                        <p
                          key={slot.id}
                          className="text-sm text-indigo-700 dark:text-indigo-300"
                        >
                          {formatAvailabilityDate(
                            slot.available_date
                          )}{" "}
                          ·{" "}
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {existingSessions.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Existing scheduled sessions
                    </p>

                    <div className="mt-3 space-y-1.5">
                      {existingSessions.map((slot) => (
                        <p
                          key={slot.id}
                          className="text-sm text-emerald-700 dark:text-emerald-300"
                        >
                          {formatAvailabilityDate(
                            slot.available_date
                          )}{" "}
                          ·{" "}
                          {formatTime(slot.start_time)} –{" "}
                          {formatTime(slot.end_time)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {scheduleMessage && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      scheduleMessage.includes(
                        "successfully"
                      )
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {scheduleMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={closeSchedule}
                disabled={scheduling}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={scheduleRequest}
                disabled={
                  scheduling ||
                  loadingPreferences ||
                  requestPreferences.length === 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {scheduling ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Finishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Accept & Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

/* ========================================================= */
/* SMALL UI COMPONENTS                                       */
/* ========================================================= */

function Avatar({ initials, accent = "indigo" }) {
  const styles =
    accent === "slate"
      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300";

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${styles}`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  function classes() {
    switch (status) {
      case "accepted":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";

      case "declined":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

      default:
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
    }
  }

  const icon =
    status === "accepted" ? (
      <CheckCircle2 size={14} />
    ) : status === "declined" ? (
      <XCircle size={14} />
    ) : (
      <Clock3 size={14} />
    );

  const label =
    status?.charAt(0).toUpperCase() +
      status?.slice(1) || "Pending";

  return (
    <span
      className={`inline-flex h-fit w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${classes()}`}
    >
      {icon}
      {label}
    </span>
  );
}

function UnavailableOffer({ sent = false }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <XCircle
        size={18}
        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
      />

      <div>
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
          This offer is no longer available.
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
          {sent
            ? "The peer's original help offer has been removed."
            : "The original help offer attached to this request has been removed."}
        </p>
      </div>
    </div>
  );
}

function SessionReady({ sessions, sent = false }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          {sessions.length}{" "}
          {sessions.length === 1 ? "session" : "sessions"}{" "}
          scheduled
        </p>

        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
          {sent
            ? "Your scheduled peer sessions are ready."
            : "Your peer sessions are ready."}
        </p>
      </div>

      <Link
        to={`/session-hub/${sessions[0].id}`}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Open Session Hub
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action = null,
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {action}
    </div>
  );
}

function ModalBackdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
  disabled,
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <X size={19} />
      </button>
    </div>
  );
}

export default Requests;