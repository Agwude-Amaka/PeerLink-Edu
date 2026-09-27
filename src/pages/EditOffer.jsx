import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../services/supabase";

const subjects = [
  "Mathematics",
  "Chemistry",
  "Physics",
  "Biology",
  "English",
  "Computer Science",
];

function EditOffer() {
  const { offerId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const [availability, setAvailability] = useState([]);

  const [availableDate, setAvailableDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAvailabilityId, setDeletingAvailabilityId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  async function loadOffer() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be verified.");
      setLoading(false);
      return;
    }

    const { data: offer, error: offerError } = await supabase
      .from("help_offers")
      .select("id, subject, topic, description, user_id")
      .eq("id", offerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (offerError) {
      console.error("Load offer error:", offerError);
      setError(offerError.message);
      setLoading(false);
      return;
    }

    if (!offer) {
      setError(
        "This offer could not be found or you do not have permission to edit it."
      );
      setLoading(false);
      return;
    }

    const {
      data: availabilityData,
      error: availabilityError,
    } = await supabase
      .from("help_availability")
      .select(
        "id, help_offer_id, available_date, start_time, end_time"
      )
      .eq("help_offer_id", offerId);

    if (availabilityError) {
      console.error(
        "Load availability error:",
        availabilityError
      );
      setError(availabilityError.message);
      setLoading(false);
      return;
    }

    const sortedAvailability = (availabilityData || []).sort(
      (a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      }
    );

    setSubject(offer.subject || "");
    setTopic(offer.topic || "");
    setDescription(offer.description || "");
    setAvailability(sortedAvailability);

    setLoading(false);
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

  function addAvailability() {
    setError("");
    setMessage("");

    if (!availableDate || !startTime || !endTime) {
      setError("Please choose a date, start time, and end time.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be later than start time.");
      return;
    }

    const duplicate = availability.some(
      (slot) =>
        slot.available_date === availableDate &&
        slot.start_time === startTime &&
        slot.end_time === endTime
    );

    if (duplicate) {
      setError("This availability time has already been added.");
      return;
    }

    setAvailability((previous) =>
      [
        ...previous,
        {
          id: `new-${Date.now()}`,
          available_date: availableDate,
          start_time: startTime,
          end_time: endTime,
          isNew: true,
        },
      ].sort((a, b) => {
        const dateComparison =
          a.available_date.localeCompare(b.available_date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return a.start_time.localeCompare(b.start_time);
      })
    );

    setAvailableDate("");
    setStartTime("");
    setEndTime("");
  }

  function removeNewAvailability(id) {
    setAvailability((previous) =>
      previous.filter((slot) => slot.id !== id)
    );
  }

  async function deleteExistingAvailability(id) {
    const confirmed = window.confirm(
      "Remove this availability time?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingAvailabilityId(id);
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("help_availability")
      .delete()
      .eq("id", id)
      .eq("help_offer_id", offerId);

    if (deleteError) {
      console.error(
        "Delete availability error:",
        deleteError
      );
      setError(deleteError.message);
      setDeletingAvailabilityId(null);
      return;
    }

    setAvailability((previous) =>
      previous.filter((slot) => slot.id !== id)
    );

    setDeletingAvailabilityId(null);
    setMessage("Availability removed.");
  }

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (availability.length === 0) {
      setError("Please keep at least one availability time.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session could not be verified."
        );
      }

      /*
       * Update the existing help offer.
       */
      const { error: offerError } = await supabase
        .from("help_offers")
        .update({
          subject,
          topic: topic.trim(),
          description: description.trim(),
        })
        .eq("id", offerId)
        .eq("user_id", user.id);

      if (offerError) {
  throw new Error(offerError.message);
}


      /*
       * Only insert availability entries that
       * were newly added on this page.
       */
      const newAvailability = availability.filter(
        (slot) => slot.isNew
      );

      if (newAvailability.length > 0) {
        const rowsToInsert = newAvailability.map((slot) => ({
          help_offer_id: offerId,
          available_date: slot.available_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));

        const {
          error: availabilityError,
        } = await supabase
          .from("help_availability")
          .insert(rowsToInsert);

        if (availabilityError) {
          throw new Error(availabilityError.message);
        }
      }

      /*
       * Remove temporary IDs from newly added slots
       * by reloading the offer from Supabase.
       */
      const { error: notificationError } = await supabase.rpc(
  "create_offer_change_notifications",
  {
    p_offer_id: offerId,
    p_event: "offer_updated",
  }
);

if (notificationError) {
  console.error(
    "Offer update notification error:",
    notificationError
  );
}

await loadOffer();
setMessage("Help offer updated successfully.");
      await loadOffer();

      setMessage("Help offer updated successfully.");
    } catch (saveError) {
      console.error("Update offer error:", saveError);
      setError(
        saveError.message ||
          "Something went wrong while updating the offer."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 size={19} className="animate-spin" />
            Loading offer...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <section>
        <Link
          to="/my-offers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to My Offers
        </Link>

        <p className="mt-6 text-sm font-semibold text-indigo-600">
          Manage Your Offer
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Edit Help Offer
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Update what you can help with and manage the times when
          you're available.
        </p>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-7">
          {/* Subject */}
          <div>
            <label
              htmlFor="edit-subject"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Subject
            </label>

            <div className="relative">
              <BookOpen
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="edit-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-11 py-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Select a subject</option>

                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label
              htmlFor="edit-topic"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Topic
            </label>

            <input
              id="edit-topic"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Trigonometry"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              What can you help with?
            </label>

            <textarea
              id="edit-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={5}
              placeholder="Describe what you can help another student with."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* Existing availability */}
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Current availability
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Remove times you no longer want to offer.
              </p>
            </div>

            <div className="space-y-3">
              {availability.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                    slot.isNew
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                      <CalendarDays size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {formatDate(slot.available_date)}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </p>
                    </div>
                  </div>

                  {slot.isNew ? (
                    <button
                      type="button"
                      onClick={() =>
                        removeNewAvailability(slot.id)
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove new availability"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        deleteExistingAvailability(slot.id)
                      }
                      disabled={
                        deletingAvailabilityId === slot.id
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete availability"
                    >
                      {deletingAvailabilityId === slot.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              ))}

              {availability.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                  <p className="text-sm text-slate-500">
                    No availability times yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add availability */}
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Add another availability
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add a new date and time without replacing your
                existing schedule.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Date */}
                <div>
                  <label
                    htmlFor="edit-date"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Date
                  </label>

                  <input
                    id="edit-date"
                    type="date"
                    value={availableDate}
                    min={new Date()
                      .toISOString()
                      .split("T")[0]}
                    onChange={(event) =>
                      setAvailableDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* Start */}
                <div>
                  <label
                    htmlFor="edit-start-time"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Start time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="edit-start-time"
                      type="time"
                      value={startTime}
                      onChange={(event) =>
                        setStartTime(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* End */}
                <div>
                  <label
                    htmlFor="edit-end-time"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    End time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="edit-end-time"
                      type="time"
                      value={endTime}
                      onChange={(event) =>
                        setEndTime(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={addAvailability}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                <Plus size={17} />
                Add availability
              </button>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/my-offers"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Helpful note */}
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <div className="flex gap-3">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-indigo-600"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Editing your offer
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Changes apply to the existing offer. Adding a new
              availability creates a new time slot, while removing
              an existing slot removes it from your published schedule.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EditOffer;

