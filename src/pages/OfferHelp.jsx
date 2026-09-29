import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

const commonSubjects = [
  "Mathematics",
  "Chemistry",
  "Physics",
  "Biology",
  "English",
  "Computer Science",
];

function OfferHelp() {
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const [availableDate, setAvailableDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [availability, setAvailability] = useState([]);

  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  function getSelectedSubject() {
    if (subject === "Other") {
      return customSubject.trim();
    }

    return subject.trim();
  }

  function addAvailability() {
    setMessage("");

    if (!availableDate || !startTime || !endTime) {
      setMessage("Please choose a date, start time, and end time.");
      return;
    }

    if (startTime >= endTime) {
      setMessage("End time must be later than start time.");
      return;
    }

    const alreadyExists = availability.some(
      (item) =>
        item.date === availableDate &&
        item.startTime === startTime &&
        item.endTime === endTime
    );

    if (alreadyExists) {
      setMessage("You have already added this availability.");
      return;
    }

    setAvailability((previous) => [
      ...previous,
      {
        date: availableDate,
        startTime,
        endTime,
      },
    ]);

    setAvailableDate("");
    setStartTime("");
    setEndTime("");
  }

  function removeAvailability(itemToRemove) {
    setAvailability((previous) =>
      previous.filter(
        (item) =>
          !(
            item.date === itemToRemove.date &&
            item.startTime === itemToRemove.startTime &&
            item.endTime === itemToRemove.endTime
          )
      )
    );
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function handlePublish(event) {
    event.preventDefault();
    setMessage("");

    const finalSubject = getSelectedSubject();

    if (!subject) {
      setMessage("Please select a subject.");
      return;
    }

    if (subject === "Other" && !customSubject.trim()) {
      setMessage("Please enter the name of your subject.");
      return;
    }

    if (!finalSubject) {
      setMessage("Please select a subject.");
      return;
    }

    if (!topic.trim()) {
      setMessage("Please enter a topic.");
      return;
    }

    if (!description.trim()) {
      setMessage("Please describe what you can help with.");
      return;
    }

    if (availability.length === 0) {
      setMessage("Please add at least one availability time.");
      return;
    }

    setPublishing(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      const { data: offer, error: offerError } = await supabase
        .from("help_offers")
        .insert({
          user_id: user.id,
          subject: finalSubject,
          topic: topic.trim(),
          description: description.trim(),
        })
        .select()
        .single();

      if (offerError) {
        console.error("Help offer error:", offerError);
        throw new Error(offerError.message);
      }

      const availabilityRows = availability.map((item) => ({
        help_offer_id: offer.id,
        available_date: item.date,
        start_time: item.startTime,
        end_time: item.endTime,
      }));

      const { error: availabilityError } = await supabase
        .from("help_availability")
        .insert(availabilityRows);

      if (availabilityError) {
        console.error("Availability error:", availabilityError);

        await supabase
          .from("help_offers")
          .delete()
          .eq("id", offer.id);

        throw new Error(availabilityError.message);
      }

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          type: "offer_created",
          title: "Offer created",
          message: `Your ${finalSubject} help offer is now live.`,
          reference_id: offer.id,
          reference_type: "help_offer",
        });

      if (notificationError) {
        console.error(
          "Offer notification error:",
          notificationError
        );
      }

      setMessage("Help offer published successfully!");

      setSubject("");
      setCustomSubject("");
      setTopic("");
      setDescription("");
      setAvailability([]);
      setAvailableDate("");
      setStartTime("");
      setEndTime("");
    } catch (error) {
      console.error("Publish Help Offer error:", error);

      setMessage(
        error.message || "Something went wrong while publishing."
      );
    } finally {
      setPublishing(false);
    }
  }

  const sortedAvailability = [...availability].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return a.startTime.localeCompare(b.startTime);
  });

  const isSuccess = message.includes("successfully");

  return (
    <main className="relative min-h-full overflow-hidden">
      {/* Page atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl dark:bg-cyan-400/10" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/30 blur-3xl dark:bg-[#173143]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-[30px] border border-[#d8e3e8] bg-white px-6 py-8 shadow-[0_20px_60px_-30px_rgba(15,45,60,0.25)] dark:border-[#294352] dark:bg-[#102432] sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-100/60 blur-3xl dark:bg-cyan-400/10" />
          <div className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-sky-100/50 blur-3xl dark:bg-sky-500/10" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Sparkles size={14} />
                PeerLink Community
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#10212b] dark:text-[#f4fbfd] sm:text-4xl">
                Share what you know.
                <span className="block text-cyan-600 dark:text-cyan-300">
                  Help someone grow.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#526873] dark:text-[#c8dbe3] sm:text-base">
                Create a help offer, choose your availability,
                and make it easier for another student to learn
                from you.
              </p>
            </div>

            <div className="hidden shrink-0 lg:flex">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-[28px] bg-[#073b4c] shadow-xl shadow-cyan-900/10 dark:bg-[#0b3042]">
                <div className="absolute inset-3 rounded-[22px] border border-white/10" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-[#062b38] shadow-lg shadow-cyan-400/25">
                  <Users size={27} />
                </div>

                <div className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-lg dark:bg-[#203746] dark:text-cyan-300">
                  <Sparkles size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main form */}
          <section className="overflow-hidden rounded-[30px] border border-[#d8e3e8] bg-white shadow-[0_20px_60px_-35px_rgba(15,45,60,0.3)] dark:border-[#294352] dark:bg-[#102432]">
            <div className="border-b border-[#e3eaed] px-6 py-6 dark:border-[#294352] sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                  <BookOpen size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#10212b] dark:text-[#f4fbfd]">
                    Create a help offer
                  </h2>

                  <p className="mt-1 text-sm text-[#607985] dark:text-[#93aeb9]">
                    Tell students what you can help them learn.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handlePublish}
              className="space-y-8 p-6 sm:p-8"
            >
              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2.5 block text-sm font-semibold text-[#253c47] dark:text-[#e5f0f4]"
                >
                  Subject
                </label>

                <div className="relative">
                  <BookOpen
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#718792]"
                  />

                  <select
                    id="subject"
                    value={subject}
                    onChange={(event) => {
                      setSubject(event.target.value);

                      if (event.target.value !== "Other") {
                        setCustomSubject("");
                      }

                      setMessage("");
                    }}
                    className="w-full appearance-none rounded-2xl border border-[#d8e3e8] bg-[#f1f5f7] px-11 py-3.5 text-sm font-medium text-[#405661] outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#294352] dark:bg-[#172d3c] dark:text-[#d7e5eb] dark:focus:border-cyan-400 dark:focus:bg-[#1b3545]"
                  >
                    <option value="">Select a subject</option>

                    {commonSubjects.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}

                    <option value="Other">Other subject</option>
                  </select>
                </div>

                {subject === "Other" && (
                  <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                    <label
                      htmlFor="customSubject"
                      className="block text-sm font-semibold text-[#253c47] dark:text-[#e5f0f4]"
                    >
                      Enter your subject
                    </label>

                    <p className="mt-1 text-xs leading-5 text-[#607985] dark:text-[#93aeb9]">
                      Add a subject that isn't in the list,
                      such as Economics, Geography, Government,
                      Literature, or Further Mathematics.
                    </p>

                    <input
                      id="customSubject"
                      type="text"
                      value={customSubject}
                      onChange={(event) => {
                        setCustomSubject(event.target.value);
                        setMessage("");
                      }}
                      placeholder="e.g. Economics"
                      className="mt-3 w-full rounded-xl border border-[#cfe0e5] bg-white px-4 py-3 text-sm text-[#405661] outline-none transition placeholder:text-[#8a9aa2] focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-[#3a5665] dark:bg-[#172d3c] dark:text-[#e5f0f4]"
                    />
                  </div>
                )}
              </div>

              {/* Topic */}
              <div>
                <label
                  htmlFor="topic"
                  className="mb-2.5 block text-sm font-semibold text-[#253c47] dark:text-[#e5f0f4]"
                >
                  Topic
                </label>

                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    setMessage("");
                  }}
                  placeholder="e.g. Trigonometry, Mole Concept, Waves"
                  className="w-full rounded-2xl border border-[#d8e3e8] bg-[#f1f5f7] px-4 py-3.5 text-sm text-[#405661] outline-none transition placeholder:text-[#8a9aa2] focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#294352] dark:bg-[#172d3c] dark:text-[#d7e5eb] dark:focus:border-cyan-400 dark:focus:bg-[#1b3545]"
                />
              </div>

              {/* Description */}
              <div>
                <div className="mb-2.5 flex items-end justify-between gap-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-[#253c47] dark:text-[#e5f0f4]"
                  >
                    What can you help with?
                  </label>

                  <span className="hidden text-xs text-[#7b8e97] sm:block">
                    Be specific
                  </span>
                </div>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setMessage("");
                  }}
                  rows={5}
                  placeholder="Describe what you understand and how you could help another student."
                  className="w-full resize-none rounded-2xl border border-[#d8e3e8] bg-[#f1f5f7] px-4 py-3.5 text-sm leading-6 text-[#405661] outline-none transition placeholder:text-[#8a9aa2] focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-[#294352] dark:bg-[#172d3c] dark:text-[#d7e5eb] dark:focus:border-cyan-400 dark:focus:bg-[#1b3545]"
                />
              </div>

              {/* Availability */}
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#253c47] dark:text-[#e5f0f4]">
                      Availability
                    </h3>

                    <span className="rounded-full bg-[#e8f0f3] px-2 py-0.5 text-[11px] font-semibold text-[#607985] dark:bg-[#203746] dark:text-[#a9bec7]">
                      {availability.length}{" "}
                      {availability.length === 1 ? "slot" : "slots"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-[#718792] dark:text-[#93aeb9]">
                    Add the dates and times when you can actually help.
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#d8e3e8] bg-[#f1f5f7] p-4 dark:border-[#294352] dark:bg-[#172d3c] sm:p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Date */}
                    <div>
                      <label
                        htmlFor="availableDate"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#607985] dark:text-[#a9bec7]"
                      >
                        Date
                      </label>

                      <div className="relative">
                        <CalendarDays
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718792]"
                        />

                        <input
                          id="availableDate"
                          type="date"
                          value={availableDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(event) => {
                            setAvailableDate(event.target.value);
                            setMessage("");
                          }}
                          className="w-full rounded-xl border border-[#d8e3e8] bg-white px-10 py-3 text-sm text-[#405661] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-[#3a5665] dark:bg-[#102432] dark:text-[#d7e5eb]"
                        />
                      </div>
                    </div>

                    {/* Start */}
                    <div>
                      <label
                        htmlFor="startTime"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#607985] dark:text-[#a9bec7]"
                      >
                        Start time
                      </label>

                      <div className="relative">
                        <Clock3
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718792]"
                        />

                        <input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(event) => {
                            setStartTime(event.target.value);
                            setMessage("");
                          }}
                          className="w-full rounded-xl border border-[#d8e3e8] bg-white px-10 py-3 text-sm text-[#405661] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-[#3a5665] dark:bg-[#102432] dark:text-[#d7e5eb]"
                        />
                      </div>
                    </div>

                    {/* End */}
                    <div>
                      <label
                        htmlFor="endTime"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#607985] dark:text-[#a9bec7]"
                      >
                        End time
                      </label>

                      <div className="relative">
                        <Clock3
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718792]"
                        />

                        <input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(event) => {
                            setEndTime(event.target.value);
                            setMessage("");
                          }}
                          className="w-full rounded-xl border border-[#d8e3e8] bg-white px-10 py-3 text-sm text-[#405661] outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-[#3a5665] dark:bg-[#102432] dark:text-[#d7e5eb]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addAvailability}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073b4c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 dark:bg-cyan-400 dark:text-[#062b38] dark:hover:bg-cyan-300"
                  >
                    <Plus size={17} />
                    Add availability
                  </button>
                </div>

                {sortedAvailability.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718792] dark:text-[#93aeb9]">
                        Your available times
                      </p>

                      <span className="text-xs font-medium text-[#718792] dark:text-[#93aeb9]">
                        {sortedAvailability.length} added
                      </span>
                    </div>

                    <div className="space-y-3">
                      {sortedAvailability.map((item) => (
                        <div
                          key={`${item.date}-${item.startTime}-${item.endTime}`}
                          className="group flex items-center justify-between gap-4 rounded-2xl border border-[#d8e3e8] bg-white px-4 py-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md dark:border-[#3a5665] dark:bg-[#102432] dark:hover:border-cyan-400/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                              <CalendarDays size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#253c47] dark:text-[#e5f0f4]">
                                {formatDate(item.date)}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#607985] dark:text-[#93aeb9]">
                                <Clock3 size={13} />

                                <span>
                                  {formatTime(item.startTime)} –{" "}
                                  {formatTime(item.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAvailability(item)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#718792] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            aria-label="Remove availability"
                            title="Remove availability"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Guidance */}
              <div className="rounded-[22px] border border-cyan-100 bg-cyan-50/70 p-5 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm dark:bg-[#203746] dark:text-cyan-300">
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#253c47] dark:text-[#e5f0f4]">
                      Keep it student-friendly
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#607985] dark:text-[#a9bec7]">
                      Offer help in topics you understand well enough
                      to explain clearly to another student.
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  role="alert"
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm font-medium ${
                    isSuccess
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                  }`}
                >
                  <CheckCircle2
                    size={18}
                    className={`mt-0.5 shrink-0 ${
                      isSuccess
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  />

                  <span>{message}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#e3eaed] pt-6 dark:border-[#294352] sm:flex-row sm:items-center sm:justify-end">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-[#607985] transition hover:bg-[#eef3f5] hover:text-[#253c47] dark:text-[#93aeb9] dark:hover:bg-[#172d3c] dark:hover:text-[#e5f0f4]"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={publishing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#075985] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-cyan-700/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-cyan-400 dark:text-[#062b38] dark:hover:bg-cyan-300"
                >
                  {publishing ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Help Offer
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[26px] border border-[#d8e3e8] bg-[#073b4c] p-6 text-white shadow-xl shadow-cyan-950/10 dark:border-[#294352] dark:bg-[#0b3042]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                <Sparkles size={19} />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Make your offer useful
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#b8d0d9]">
                A clear topic, helpful description, and realistic
                availability make it easier for students to know
                whether you're the right person to ask.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Choose a topic you know well",
                  "Explain what you can help with",
                  "Add times you can actually attend",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-[11px] font-bold text-cyan-300">
                      {index + 1}
                    </span>

                    <span className="text-xs font-medium text-[#d2e3e8]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-cyan-100 bg-cyan-50/70 p-6 dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm dark:bg-[#203746] dark:text-cyan-300">
                  <Users size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#253c47] dark:text-[#e5f0f4]">
                    Peer learning
                  </p>

                  <p className="text-xs text-[#607985] dark:text-[#93aeb9]">
                    Share knowledge. Build connections.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#607985] dark:text-[#a9bec7]">
                Your goal isn't to be an expert in everything.
                It's simply to help where you can.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default OfferHelp;