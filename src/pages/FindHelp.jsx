import { useEffect, useMemo, useState } from "react";
import {
  Search,
  GraduationCap,
  HandHelping,
  Loader2,
  X,
  Send,
  BookOpen,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Users,
} from "lucide-react";
import { supabase } from "../services/supabase";

const subjects = [
  "Mathematics",
  "Physics",
  "Computer Science",
];

function FindHelp() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState([]);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("No logged-in user found.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error: offersError } = await supabase
        .from("help_offers")
        .select(`
          id,
          user_id,
          subject,
          topic,
          description,
          created_at,
          profiles (
            id,
            full_name,
            class_level,
            bio
          ),
          help_availability (
            id,
            available_date,
            start_time,
            end_time
          )
        `)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (offersError) {
        console.error("Find Help error:", offersError);
        setError(offersError.message);
        setLoading(false);
        return;
      }

      const sortedOffers = (data || []).map((offer) => {
        const sortedAvailability = [
          ...(offer.help_availability || []),
        ].sort((a, b) => {
          const dateComparison =
            a.available_date.localeCompare(b.available_date);

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return a.start_time.localeCompare(b.start_time);
        });

        return {
          ...offer,
          help_availability: sortedAvailability,
        };
      });

      setOffers(sortedOffers);
      setLoading(false);
    }

    loadOffers();
  }, []);

  const filteredOffers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return offers;

    return offers.filter((offer) => {
      const profile = offer.profiles;

      return (
        offer.subject?.toLowerCase().includes(searchText) ||
        offer.topic?.toLowerCase().includes(searchText) ||
        offer.description?.toLowerCase().includes(searchText) ||
        profile?.full_name?.toLowerCase().includes(searchText) ||
        profile?.class_level?.toLowerCase().includes(searchText)
      );
    });
  }, [offers, search]);

  function getInitials(name) {
    return (
      name
        ?.split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "S"
    );
  }

  function formatDate(dateString) {
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

  function openRequest(offer) {
    if (offer.user_id === currentUserId) {
      return;
    }

    setSelectedOffer(offer);
    setSelectedAvailabilities([]);
    setSubject(offer.subject || "");
    setMessage("");
    setRequestMessage("");
  }

  function closeRequest() {
    if (sending) return;

    setSelectedOffer(null);
    setSelectedAvailabilities([]);
    setSubject("");
    setMessage("");
    setRequestMessage("");
  }

  function toggleAvailability(availability) {
    setRequestMessage("");

    setSelectedAvailabilities((previous) => {
      const alreadySelected = previous.some(
        (item) => item.id === availability.id
      );

      if (alreadySelected) {
        return previous.filter(
          (item) => item.id !== availability.id
        );
      }

      return [...previous, availability];
    });
  }

  async function sendRequest() {
    if (!selectedOffer) return;

    if (selectedAvailabilities.length === 0) {
      setRequestMessage(
        "Please choose at least one preferred time."
      );
      return;
    }

    if (!subject) {
      setRequestMessage("Please choose a subject.");
      return;
    }

    if (!message.trim()) {
      setRequestMessage("Please explain what you need help with.");
      return;
    }

    setSending(true);
    setRequestMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setRequestMessage("Your session could not be verified.");
      setSending(false);
      return;
    }

    if (user.id === selectedOffer.user_id) {
      setRequestMessage("You cannot request help from yourself.");
      setSending(false);
      return;
    }

    const { data: existingRequest, error: existingError } =
      await supabase
        .from("help_requests")
        .select("id")
        .eq("requester_id", user.id)
        .eq("helper_id", selectedOffer.user_id)
        .eq("help_offer_id", selectedOffer.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existingError) {
      console.error(
        "Existing request check error:",
        existingError
      );
      setRequestMessage(existingError.message);
      setSending(false);
      return;
    }

    if (existingRequest) {
      setRequestMessage(
        "You already have a pending request for this offer."
      );
      setSending(false);
      return;
    }

    const { data: request, error: insertError } =
      await supabase
        .from("help_requests")
        .insert({
          requester_id: user.id,
          helper_id: selectedOffer.user_id,
          help_offer_id: selectedOffer.id,
          availability_id: null,
          subject,
          message: message.trim(),
          status: "pending",
        })
        .select("id")
        .single();

    if (insertError) {
      console.error("Request Help error:", insertError);
      setRequestMessage(insertError.message);
      setSending(false);
      return;
    }

    const preferenceRows = selectedAvailabilities.map(
      (availability) => ({
        help_request_id: request.id,
        availability_id: availability.id,
      })
    );

    const { error: preferencesError } = await supabase
      .from("help_request_preferences")
      .insert(preferenceRows);

    if (preferencesError) {
      console.error(
        "Request preferences error:",
        preferencesError
      );

      await supabase
        .from("help_requests")
        .delete()
        .eq("id", request.id);

      setRequestMessage(preferencesError.message);
      setSending(false);
      return;
    }
const { error: notificationError } = await supabase.rpc(
  "create_request_notification",
  {
    p_request_id: request.id,
    p_event: "offer_requested",
  }
);

if (notificationError) {
  console.error(
    "Request notification error:",
    notificationError
  );
}

    setRequestMessage("Request sent successfully.");

    setTimeout(() => {
      closeRequest();
    }, 1000);

    setSending(false);
  }

  return (
    <>
      <main className="relative mx-auto w-full max-w-[1400px] space-y-8 px-4 py-2 sm:px-6 lg:px-8">
        {/* Background atmosphere */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_36%)]" />

          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Sparkles size={14} />
                  Peer Network
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Find the right peer
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {" "}
                    to learn with.
                  </span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                  Discover students who can help you understand
                  difficult topics, prepare for a class, or work
                  through a problem together.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300">
                  <Users size={19} />
                </div>

                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {offers.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    peer offers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students, subjects, topics, or classes..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 px-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">
                {filteredOffers.length}
              </span>
              {filteredOffers.length === 1 ? "match" : "matches"}
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-16">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Loader2 size={24} className="animate-spin" />
              </div>

              <h2 className="mt-5 font-bold text-slate-900 dark:text-white">
                Finding available help
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                We’re checking the latest peer offers and
                availability.
              </p>
            </div>
          </section>
        )}

        {/* Error */}
        {!loading && error && (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm dark:bg-red-950/40 dark:text-red-300">
                <X size={20} />
              </div>

              <div>
                <h2 className="font-bold text-red-800 dark:text-red-200">
                  We couldn't load help offers.
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* No results */}
        {!loading && !error && filteredOffers.length === 0 && (
          <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Search size={26} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              {search
                ? "No matching offers"
                : "No help offers yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {search
                ? "Try another student name, subject, topic, or class."
                : "When students offer help, their available subjects and times will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Clear search
                <ArrowRight size={15} />
              </button>
            )}
          </section>
        )}

        {/* Offers */}
        {!loading && !error && filteredOffers.length > 0 && (
          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                  Available now
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Students ready to help
                </h2>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose a peer whose subject and times work for you.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOffers.map((offer) => {
                const profile = offer.profiles;
                const fullName =
                  profile?.full_name || "PeerLink Student";

                return (
                  <article
                    key={offer.id}
                    className="group flex flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_50px_rgba(79,70,229,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-indigo-500/30"
                  >
                    <div className="flex-1 p-6">
                      {/* Profile */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">
                            {getInitials(fullName)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-900 dark:text-white">
                              {fullName}
                            </h3>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <GraduationCap size={14} />
                              {profile?.class_level ||
                                "Class not set"}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <HandHelping size={17} />
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="mt-6 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <BookOpen size={15} />
                        </div>

                        <span className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                          {offer.subject}
                        </span>
                      </div>

                      {/* Topic */}
                      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {offer.topic}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {offer.description ||
                          "This student is available to help you learn this topic."}
                      </p>

                      {/* Availability */}
                      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                        <div className="flex items-center gap-2">
                          <Clock3
                            size={16}
                            className="text-indigo-600 dark:text-indigo-300"
                          />

                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Available times
                          </p>
                        </div>

                        <div className="mt-3 space-y-2">
                          {offer.help_availability?.length > 0 ? (
                            offer.help_availability
                              .slice(0, 3)
                              .map((availability) => (
                                <div
                                  key={availability.id}
                                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                                >
                                  <CalendarDays
                                    size={15}
                                    className="shrink-0 text-slate-400"
                                  />

                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                      {formatDate(
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
                                </div>
                              ))
                          ) : (
                            <p className="text-xs italic text-slate-400">
                              No availability added yet.
                            </p>
                          )}

                          {offer.help_availability?.length > 3 && (
                            <p className="pt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              +{" "}
                              {offer.help_availability.length - 3}{" "}
                              more available times
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openRequest(offer)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
                      >
                        Request Help
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Request Modal */}
      {selectedOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !sending) {
              closeRequest();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="relative shrink-0 border-b border-slate-100 px-6 py-6 dark:border-slate-800 sm:px-7">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <HandHelping size={13} />
                    Request help
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Send a learning request
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Ask{" "}
                    {selectedOffer.profiles?.full_name ||
                      "this student"}{" "}
                    to help you with {selectedOffer.topic}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRequest}
                  disabled={sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close request modal"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-6 sm:p-7">
                {/* Student */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                    {getInitials(
                      selectedOffer.profiles?.full_name
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {selectedOffer.profiles?.full_name ||
                        "PeerLink Student"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {selectedOffer.subject} ·{" "}
                      {selectedOffer.topic}
                    </p>
                  </div>
                </div>

                {/* Preferred Times */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Pick your preferred times
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Select one or more options that work for
                        you. The helper chooses the final session
                        time after accepting.
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                      <Clock3 size={17} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {selectedOffer.help_availability?.length > 0 ? (
                      selectedOffer.help_availability.map(
                        (availability) => {
                          const isSelected =
                            selectedAvailabilities.some(
                              (item) =>
                                item.id === availability.id
                            );

                          return (
                            <button
                              key={availability.id}
                              type="button"
                              onClick={() =>
                                toggleAvailability(
                                  availability
                                )
                              }
                              className={`w-full rounded-2xl border p-3.5 text-left transition ${
                                isSelected
                                  ? "border-indigo-500 bg-white shadow-sm ring-4 ring-indigo-500/10 dark:border-indigo-400 dark:bg-slate-800"
                                  : "border-transparent bg-white hover:border-indigo-200 hover:shadow-sm dark:bg-slate-800/80 dark:hover:border-indigo-500/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    isSelected
                                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 size={18} />
                                  ) : (
                                    <CalendarDays size={17} />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {formatDate(
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

                                {isSelected && (
                                  <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                    Selected
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        }
                      )
                    ) : (
                      <p className="rounded-xl bg-white p-4 text-sm italic text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        This offer currently has no available
                        times.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-3.5 py-3 ring-1 ring-indigo-100 dark:bg-slate-800 dark:ring-indigo-500/20">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      {selectedAvailabilities.length === 0
                        ? "No preferred times selected"
                        : `${selectedAvailabilities.length} preferred ${
                            selectedAvailabilities.length === 1
                              ? "time"
                              : "times"
                          } selected`}
                    </p>

                    {selectedAvailabilities.length > 0 && (
                      <CheckCircle2
                        size={15}
                        className="text-emerald-500"
                      />
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Subject
                  </label>

                  <select
                    value={subject}
                    onChange={(event) =>
                      setSubject(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  >
                    <option value="">Choose a subject</option>

                    {subjects.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      What do you need help with?
                    </label>

                    <span className="text-xs text-slate-400">
                      {message.length}/500
                    </span>
                  </div>

                  <textarea
                    value={message}
                    onChange={(event) => {
                      if (event.target.value.length <= 500) {
                        setMessage(event.target.value);
                      }
                    }}
                    rows={4}
                    placeholder="Tell them what you'd like help understanding..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />
                </div>

                {/* Selected times */}
                {selectedAvailabilities.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400">
                        <CheckCircle2 size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          Your preferred times
                        </p>

                        <div className="mt-2 space-y-1.5">
                          {selectedAvailabilities.map(
                            (availability) => (
                              <p
                                key={availability.id}
                                className="text-sm text-emerald-700 dark:text-emerald-400"
                              >
                                {formatDate(
                                  availability.available_date
                                )}{" "}
                                ·{" "}
                                {formatTime(
                                  availability.start_time
                                )}{" "}
                                –{" "}
                                {formatTime(
                                  availability.end_time
                                )}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {requestMessage && (
                  <div
                    className={`rounded-2xl border px-4 py-3.5 text-sm font-semibold ${
                      requestMessage.includes("successfully")
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-red-100 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    }`}
                  >
                    {requestMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeRequest}
                disabled={sending}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={sendRequest}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
              >
                {sending ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FindHelp;