import { useEffect, useMemo, useState } from "react";
import {
ArrowLeft,
CalendarDays,
CheckCircle2,
Clock3,
Edit3,
Loader2,
Plus,
Sparkles,
Trash2,
Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

function MyOffers() {
const [offers, setOffers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [deletingId, setDeletingId] = useState(null);

useEffect(() => {
loadOffers();
}, []);

async function loadOffers() {
  setLoading(true);
  setError("");

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setError("Your session could not be verified.");
      return;
    }

    const user = session.user;

    const { data: offerData, error: offerError } = await supabase
      .from("help_offers")
      .select("id, subject, topic, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (offerError) {
      console.error("My Offers error:", offerError);
      setError(offerError.message);
      return;
    }

    const offerIds = (offerData || []).map((offer) => offer.id);

    let availabilityData = [];

    if (offerIds.length > 0) {
      const {
        data,
        error: availabilityError,
      } = await supabase
        .from("help_availability")
        .select(
          "id, help_offer_id, available_date, start_time, end_time"
        )
        .in("help_offer_id", offerIds);

      if (availabilityError) {
        console.error(
          "My Offers availability error:",
          availabilityError
        );
        setError(availabilityError.message);
        return;
      }

      availabilityData = data || [];
    }

    const combinedOffers = (offerData || []).map((offer) => {
      const availability = availabilityData
        .filter((item) => item.help_offer_id === offer.id)
        .sort((a, b) => {
          const dateComparison =
            a.available_date.localeCompare(b.available_date);

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return a.start_time.localeCompare(b.start_time);
        });

      return {
        ...offer,
        availability,
      };
    });

    setOffers(combinedOffers);
  } catch (err) {
    console.error("Unexpected My Offers error:", err);
    setError(
      err?.message || "Something went wrong while loading your offers."
    );
  } finally {
    setLoading(false);
  }
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

async function deleteOffer(offerId) {
const confirmed = window.confirm(
"Delete this help offer and all of its availability?"
);

```
if (!confirmed) {
  return;
}

setDeletingId(offerId);
setError("");

const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  setError("Your session could not be verified.");
  setDeletingId(null);
  return;
}

const { error: deleteError } = await supabase.rpc(
  "delete_offer_with_notifications",
  {
    p_offer_id: offerId,
  }
);

if (deleteError) {
  console.error("Delete offer error:", deleteError);
  setError(deleteError.message);
  setDeletingId(null);
  return;
}


setOffers((previous) =>
  previous.filter((offer) => offer.id !== offerId)
);

setDeletingId(null);
```

}

const totalAvailability = useMemo(
() =>
offers.reduce(
(total, offer) => total + offer.availability.length,
0
),
[offers]
);

return ( <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 sm:space-y-8">
{/* Back navigation */} <Link
     to="/offer-help"
     className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
   > <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition group-hover:border-indigo-200 group-hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-indigo-500/30 dark:group-hover:bg-indigo-500/10"> <ArrowLeft size={15} /> </span>
Back to Offer Help </Link>

```
  {/* Hero */}
  <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-500/10" />
      <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-slate-100/80 blur-3xl dark:bg-slate-800/50" />
      <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-violet-100/30 blur-3xl dark:bg-violet-500/5" />
    </div>

    <div className="relative p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Sparkles size={14} />
            Your teaching space
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-[2.65rem] dark:text-white">
            My Published Offers
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-[15px] dark:text-slate-400">
            Manage what you teach, keep your availability up to date,
            and make it easier for classmates to find you.
          </p>
        </div>

        <Link
          to="/offer-help"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_25px_rgba(79,70,229,0.28)] sm:w-auto"
        >
          <Plus size={17} />
          Create New Offer
        </Link>
      </div>

      {/* Summary */}
      {!loading && !error && offers.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-700/80 dark:bg-slate-800/40 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
              <Users size={19} />
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {offers.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Published offer{offers.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 dark:border-slate-700/80 dark:bg-slate-800/40 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
              <CalendarDays size={19} />
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalAvailability}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Available time slot{totalAvailability === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </section>

  {/* Error */}
  {error && (
    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 dark:border-red-500/20 dark:bg-red-500/10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <span className="text-sm font-black">!</span>
        </div>

        <div>
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            Something went wrong.
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    </div>
  )}

  {/* Loading */}
  {loading && (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Loader2 size={23} className="animate-spin" />
      </div>

      <h2 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
        Loading your offers
      </h2>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        We’re getting your teaching space ready.
      </p>
    </div>
  )}

  {/* Empty state */}
  {!loading && !error && offers.length === 0 && (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Sparkles size={27} />
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your teaching space is empty
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Create your first help offer and let other students know what
          you can teach.
        </p>

        <Link
          to="/offer-help"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          Create an Offer
          <Plus size={17} />
        </Link>
      </div>
    </div>
  )}

  {/* Offers */}
  {!loading && !error && offers.length > 0 && (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            Your offers
          </p>

          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Published and ready to connect
          </h2>
        </div>

        <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 sm:block dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {offers.length} total
        </span>
      </div>

      {offers.map((offer) => (
        <article
          key={offer.id}
          className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_6px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-700"
        >
          {/* Offer content */}
          <div className="p-6 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {offer.subject}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 size={13} />
                    Published
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold tracking-[-0.02em] text-slate-950 sm:text-2xl dark:text-white">
                  {offer.topic}
                </h3>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {offer.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Link
                  to={`/my-offers/${offer.id}/edit`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:flex-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  <Edit3 size={16} />
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() => deleteOffer(offer.id)}
                  disabled={deletingId === offer.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none dark:border-red-500/20 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {deletingId === offer.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-7 lg:px-8 dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300">
                <CalendarDays size={16} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Available times
                </h4>

                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                  {offer.availability.length} slot
                  {offer.availability.length === 1 ? "" : "s"} added
                </p>
              </div>
            </div>

            {offer.availability.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm italic text-slate-400 dark:text-slate-500">
                  No availability has been added yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {offer.availability.map((slot) => (
                  <div
                    key={slot.id}
                    className="group/slot flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover/slot:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:group-hover/slot:bg-indigo-500/15">
                      <Clock3 size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(slot.available_date)}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  )}
</div>


);
}

export default MyOffers;
