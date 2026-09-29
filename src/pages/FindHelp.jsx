import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  HandHelping,
  Loader2,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../services/supabase";

const subjects = ["Mathematics", "Physics", "Computer Science"];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  const [requestMessage, setRequestMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in to find a peer who can help.");
        return;
      }

      setCurrentUserId(user.id);

      const { data, error: offersError } = await supabase
        .from("help_offers")
        .select(
          `
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
            help_offer_id,
            available_date,
            start_time,
            end_time
          )
        `
        )
        .neq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (offersError) {
        throw offersError;
      }

      const cleanedOffers = (data || []).map((offer) => ({
        ...offer,
        help_availability: [...(offer.help_availability || [])].sort(
          (a, b) => {
const dateCompare = a.available_date.localeCompare(
  b.available_date
);

            if (dateCompare !== 0) {
              return dateCompare;
            }

            return a.start_time.localeCompare(b.start_time);
          }
        ),
      }));

      setOffers(cleanedOffers);
    } catch (err) {
      console.error("Error loading help offers:", err);
      setError("We couldn't load peer offers right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return offers;
    }

    return offers.filter((offer) => {
      const profile = offer.profiles;

      return [
        offer.subject,
        offer.topic,
        offer.description,
        profile?.full_name,
        profile?.class_level,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [offers, search]);

  function openRequest(offer) {
    setSelectedOffer(offer);
    setSelectedAvailabilities([]);
    setSubject(offer.subject || "");
    setMessage("");
    setRequestMessage({
      type: "",
      text: "",
    });
  }

  function closeRequest() {
    if (sending) return;

    setSelectedOffer(null);
    setSelectedAvailabilities([]);
    setSubject("");
    setMessage("");
    setRequestMessage({
      type: "",
      text: "",
    });
  }

  function toggleAvailability(availability) {
    setSelectedAvailabilities((current) => {
      const exists = current.some((item) => item.id === availability.id);

      if (exists) {
        return current.filter((item) => item.id !== availability.id);
      }

      return [...current, availability];
    });
  }

  async function sendRequest() {
    if (!selectedOffer) return;

    if (!subject) {
      setRequestMessage({
        type: "error",
        text: "Please select the subject you need help with.",
      });
      return;
    }

    if (selectedAvailabilities.length === 0) {
      setRequestMessage({
        type: "error",
        text: "Please choose at least one preferred time.",
      });
      return;
    }

    if (!message.trim()) {
      setRequestMessage({
        type: "error",
        text: "Please tell your peer what you need help with.",
      });
      return;
    }

    setSending(true);
    setRequestMessage({
      type: "",
      text: "",
    });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("You must be signed in to send a request.");
      }

      if (session.user.id === selectedOffer.user_id) {
        throw new Error("You cannot send a request to yourself.");
      }

      const { data: existingRequest, error: existingError } = await supabase
        .from("help_requests")
        .select("id")
        .eq("requester_id", session.user.id)
        .eq("offer_id", selectedOffer.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingRequest) {
        throw new Error(
          "You already have a pending request for this peer offer."
        );
      }

      const { data: request, error: requestError } = await supabase
        .from("help_requests")
        .insert({
          requester_id: session.user.id,
          offer_id: selectedOffer.id,
          subject,
          message: message.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      const preferences = selectedAvailabilities.map((availability) => ({
        request_id: request.id,
        availability_id: availability.id,
      }));

      const { error: preferenceError } = await supabase
        .from("help_request_preferences")
        .insert(preferences);

      if (preferenceError) {
        await supabase.from("help_requests").delete().eq("id", request.id);
        throw preferenceError;
      }

      const { error: notificationError } = await supabase.rpc(
        "create_request_notification",
        {
          p_request_id: request.id,
          p_event: "offer_requested",
        }
      );

      if (notificationError) {
        console.warn(
          "Request created, but notification could not be sent:",
          notificationError
        );
      }

      setRequestMessage({
        type: "success",
        text: "Your request has been sent successfully.",
      });

      setTimeout(() => {
        closeRequest();
      }, 1000);
    } catch (err) {
      console.error("Error sending request:", err);

      setRequestMessage({
        type: "error",
        text:
          err?.message ||
          "Something went wrong while sending your request. Please try again.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f9fb] text-[#10212b] dark:bg-[#0a1824] dark:text-[#f4fbfd]">
      {/* Soft page atmosphere */}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-sky-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#d8e3e8] bg-white shadow-[0_18px_50px_rgba(16,42,55,0.07)] dark:border-[#294352] dark:bg-[#102432] dark:shadow-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_36%)]" />

          <div className="relative grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-10">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Peer Network
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#10212b] sm:text-4xl lg:text-5xl dark:text-white">
                Find the right peer to{" "}
                <span className="text-cyan-600 dark:text-cyan-300">
                  learn with.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#526772] sm:text-base dark:text-[#c8dbe3]">
                Discover students who can help you understand difficult topics,
                prepare for class, or work through a problem together.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#526772] dark:text-[#a9c0ca]">
                <div className="flex items-center gap-2 rounded-full bg-[#f1f5f7] px-3 py-2 dark:bg-[#172d3c]">
                  <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  {offers.length} peer offers
                </div>

                <div className="flex items-center gap-2 rounded-full bg-[#f1f5f7] px-3 py-2 dark:bg-[#172d3c]">
                  <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Learn together
                </div>
              </div>
            </div>

            <div className="hidden lg:flex h-36 w-36 items-center justify-center rounded-[28px] border border-cyan-100 bg-[#f1fafc] dark:border-cyan-400/20 dark:bg-[#173241]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#075985] to-[#06b6d4] text-white shadow-lg shadow-cyan-900/15">
                <HandHelping className="h-9 w-9" />
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mt-6 rounded-2xl border border-[#d8e3e8] bg-white p-4 shadow-[0_10px_30px_rgba(16,42,55,0.04)] dark:border-[#294352] dark:bg-[#102432]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70848e] dark:text-[#91aab5]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by subject, topic, or peer..."
              className="w-full rounded-2xl border border-[#d8e3e7] bg-[#f1f5f6] py-3.5 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#294352] dark:bg-[#172633] dark:text-white dark:focus:border-cyan-400 dark:focus:bg-[#1b2d3b]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6c808a] transition hover:bg-white hover:text-[#10212b] dark:text-[#9eb3bd] dark:hover:bg-[#203746] dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#d8e3e8] bg-white dark:border-[#294352] dark:bg-[#102432]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-400/10">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-300" />
              </div>

              <p className="mt-4 text-sm font-semibold text-[#405661] dark:text-[#c8dbe3]">
                Finding peer offers...
              </p>

              <p className="mt-1 text-xs text-[#71848d] dark:text-[#91aab5]">
                Looking for students who can help.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-white p-8 text-center dark:border-red-400/20 dark:bg-[#102432]">
              <p className="text-sm font-semibold text-red-600 dark:text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={loadOffers}
                className="mt-5 rounded-xl bg-[#073b4c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 dark:bg-cyan-400 dark:text-[#062b38] dark:hover:bg-cyan-300"
              >
                Try again
              </button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="rounded-3xl border border-[#d8e3e8] bg-white px-6 py-14 text-center dark:border-[#294352] dark:bg-[#102432]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4f6] dark:bg-[#172d3c]">
                <Search className="h-6 w-6 text-[#71848d] dark:text-[#91aab5]" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#10212b] dark:text-white">
                No peer offers found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647985] dark:text-[#9eb3bd]">
                Try a different subject, topic, or search term. New peer offers
                will also appear here as students make them available.
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#cbd9df] bg-white px-4 py-2.5 text-sm font-semibold text-[#405661] transition hover:border-cyan-400 hover:text-cyan-700 dark:border-[#36515f] dark:bg-[#172d3c] dark:text-[#c8dbe3] dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#10212b] dark:text-white">
                    Available peers
                  </h2>

                  <p className="mt-1 text-xs text-[#6a7d86] dark:text-[#91aab5]">
                    {filteredOffers.length}{" "}
                    {filteredOffers.length === 1 ? "offer" : "offers"} available
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {filteredOffers.map((offer) => {
                  const profile = offer.profiles;
                  const availability = offer.help_availability || [];

                  return (
                    <article
                      key={offer.id}
                      className="group overflow-hidden rounded-3xl border border-[#d8e3e8] bg-white shadow-[0_12px_35px_rgba(16,42,55,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b9d8e1] hover:shadow-[0_18px_45px_rgba(16,42,55,0.08)] dark:border-[#294352] dark:bg-[#102432] dark:shadow-none dark:hover:border-[#3c6170]"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-black text-white shadow-md shadow-cyan-900/10">
                              {getInitials(profile?.full_name)}
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-[#10212b] dark:text-white">
                                {profile?.full_name || "Peer student"}
                              </h3>

                              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#687c86] dark:text-[#9eb3bd]">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {profile?.class_level || "Student"}
                              </div>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-bold text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                            {offer.subject}
                          </span>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#70838d] dark:text-[#8fa8b3]">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                            {offer.topic || "General support"}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-[#405661] dark:text-[#c8dbe3]">
                            {offer.description ||
                              "This peer is available to help with this subject."}
                          </p>
                        </div>

                        {availability.length > 0 && (
                          <div className="mt-5 rounded-2xl border border-[#dce6ea] bg-[#f3f6f7] p-4 dark:border-[#294352] dark:bg-[#182a38]">
                            <div className="mb-3 flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                              <span className="text-xs font-bold text-[#405661] dark:text-[#c8dbe3]">
                                Available times
                              </span>
                            </div>

                            <div className="space-y-2">
                              {availability.slice(0, 3).map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-xs dark:bg-[#1d3342]"
                                >
                                  <div className="flex min-w-0 items-center gap-2 text-[#405661] dark:text-[#c8dbe3]">
                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                                    <span className="truncate font-medium">
                                      {formatDate(slot.available_date)}
                                    </span>
                                  </div>

                                  <span className="shrink-0 font-semibold text-[#627680] dark:text-[#a8bdc6]">
                                    {formatTime(slot.start_time)} –{" "}
                                    {formatTime(slot.end_time)}
                                  </span>
                                </div>
                              ))}

                              {availability.length > 3 && (
                                <p className="pt-1 text-[11px] font-semibold text-[#71848d] dark:text-[#91aab5]">
                                  +{availability.length - 3} more available time
                                  {availability.length - 3 === 1 ? "" : "s"}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => openRequest(offer)}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#073b4c] px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-600 dark:bg-cyan-400 dark:text-[#062b38] dark:hover:bg-cyan-300"
                        >
                          Request Help
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Request modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07151d]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#d8e3e8] bg-white shadow-2xl dark:border-[#294352] dark:bg-[#122331]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e1e8eb] bg-white px-5 py-5 dark:border-[#294352] dark:bg-[#122331] sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-600 dark:text-cyan-300">
                  <HandHelping className="h-4 w-4" />
                  Request Help
                </div>

                <h2 className="mt-2 text-xl font-black text-[#10212b] dark:text-white">
                  Ask {selectedOffer.profiles?.full_name || "your peer"} for
                  help
                </h2>

                <p className="mt-1 text-sm text-[#647985] dark:text-[#9eb3bd]">
                  Choose when you'd like to connect and explain what you need.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRequest}
                disabled={sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8e3e8] bg-[#f3f6f7] text-[#60747e] transition hover:border-[#b9cbd2] hover:text-[#10212b] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#36515f] dark:bg-[#172d3c] dark:text-[#9eb3bd] dark:hover:text-white"
                aria-label="Close request dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Preferred times */}
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white dark:bg-cyan-400 dark:text-[#062b38]">
                    <Clock3 className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#12313d] dark:text-white">
                      Choose preferred times
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#54707c] dark:text-[#a9c0ca]">
                      Select one or more times that work for you.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {(selectedOffer.help_availability || []).map((slot) => {
                    const selected = selectedAvailabilities.some(
                      (item) => item.id === slot.id
                    );

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleAvailability(slot)}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-cyan-500 bg-white shadow-sm ring-4 ring-cyan-500/10 dark:border-cyan-400 dark:bg-[#1b3140]"
                            : "border-[#d8e3e8] bg-white/70 hover:border-cyan-300 dark:border-[#36515f] dark:bg-[#172d3c] dark:hover:border-cyan-500"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-cyan-600 text-white dark:bg-cyan-400 dark:text-[#062b38]"
                                : "bg-[#edf3f5] text-[#6c808a] dark:bg-[#203746] dark:text-[#9eb3bd]"
                            }`}
                          >
                            {selected ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <CalendarDays className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#29404a] dark:text-white">
                              {formatDate(slot.available_date)}
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#6b7f89] dark:text-[#9eb3bd]">
                              {formatTime(slot.start_time)} –{" "}
                              {formatTime(slot.end_time)}
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="request-subject"
                  className="mb-2 block text-sm font-bold text-[#29404a] dark:text-white"
                >
                  Subject
                </label>

                <select
                  id="request-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-[#d8e3e8] bg-[#f3f6f7] px-4 py-3 text-sm text-[#10212b] outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#36515f] dark:bg-[#172d3c] dark:text-white dark:focus:border-cyan-400 dark:focus:bg-[#1b3140]"
                >
                  <option value="">Select a subject</option>

                  {subjects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="request-message"
                  className="mb-2 block text-sm font-bold text-[#29404a] dark:text-white"
                >
                  What do you need help with?
                </label>

                <textarea
                  id="request-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  placeholder="For example: I need help understanding quadratic equations before my next class."
                  className="w-full resize-none rounded-xl border border-[#d8e3e8] bg-[#f3f6f7] px-4 py-3 text-sm leading-6 text-[#10212b] outline-none transition placeholder:text-[#8a9ba3] focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#36515f] dark:bg-[#172d3c] dark:text-white dark:placeholder:text-[#718b96] dark:focus:border-cyan-400 dark:focus:bg-[#1b3140]"
                />
              </div>

              {/* Feedback */}
              {requestMessage.text && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                    requestMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {requestMessage.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0" />
                    )}

                    <span>{requestMessage.text}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#e1e8eb] bg-white p-5 dark:border-[#294352] dark:bg-[#122331] sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeRequest}
                disabled={sending}
                className="rounded-xl border border-[#d3dfe4] bg-white px-5 py-3 text-sm font-semibold text-[#526772] transition hover:border-[#b9cbd2] hover:bg-[#f5f8f9] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#36515f] dark:bg-[#172d3c] dark:text-[#c8dbe3] dark:hover:bg-[#1d3544]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={sendRequest}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#075985] to-[#06b6d4] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:-translate-y-0.5 hover:from-[#064e72] hover:to-[#0891b2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindHelp;