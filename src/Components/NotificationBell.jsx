import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Sparkles,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

function NotificationBell() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

useEffect(() => {
  if (!user?.id) {
    setNotifications([]);
    setLoading(false);
    return;
  }

  let channel;

  async function setupNotifications() {
    await loadNotifications();

    channel = supabase
      .channel(`notifications-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 New notification received:", payload.new);

          setNotifications((current) => {
            const alreadyExists = current.some(
              (notification) => notification.id === payload.new.id
            );

            if (alreadyExists) {
              return current;
            }

            return [payload.new, ...current];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 Notification updated:", payload.new);

          setNotifications((current) =>
            current.map((notification) =>
              notification.id === payload.new.id
                ? payload.new
                : notification
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 Notification deleted:", payload.old);

          setNotifications((current) =>
            current.filter(
              (notification) =>
                notification.id !== payload.old.id
            )
          );
        }
      )
      .subscribe((status, error) => {
        console.log("🔔 Notification Realtime status:", status);

        if (status === "SUBSCRIBED") {
          console.log("✅ Notification Realtime is connected!");
        }

        if (status === "CHANNEL_ERROR") {
          console.error(
            "❌ Notification Realtime channel error:",
            error
          );
        }

        if (status === "TIMED_OUT") {
          console.error(
            "❌ Notification Realtime connection timed out."
          );
        }
      });
  }

  setupNotifications();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function loadNotifications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error) {
      setNotifications(data || []);
    } else {
      console.error("Failed to load notifications:", error);
    }

    setLoading(false);
  }

  async function markAsRead(id) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  async function deleteNotification(id) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete notification:", error);
      return;
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  function formatTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();

    const difference = now.getTime() - date.getTime();

    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(difference / 3600000);
    const days = Math.floor(difference / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Notification button */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
          open
            ? "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        <Bell
          size={18}
          strokeWidth={open ? 2.2 : 2}
        />

        {unreadCount > 0 && (
          <>
            <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-indigo-600 dark:bg-indigo-400" />

            <span className="absolute -right-1.5 -top-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:bg-indigo-500 dark:ring-slate-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* Header */}
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Bell size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount === 1 ? "" : "s"
                        }`
                      : "You're all caught up"}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
                </div>

                <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Sparkles size={22} />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                  You're all caught up
                </p>

                <p className="mx-auto mt-1.5 max-w-[245px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                  When something important happens in PeerLink, you'll see it
                  here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 dark:border-slate-800 ${
                    notification.read
                      ? "bg-white dark:bg-slate-900"
                      : "bg-indigo-50/50 dark:bg-indigo-500/[0.055]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p
                      className={`min-w-0 flex-1 text-[13px] leading-5 ${
                        notification.read
                          ? "font-semibold text-slate-700 dark:text-slate-300"
                          : "font-bold text-slate-900 dark:text-white"
                      }`}
                    >
                      {notification.title}
                    </p>

                    {!notification.read && (
                      <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm dark:bg-indigo-500">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {/* Notification icon */}
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        notification.read
                          ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                      }`}
                    >
                      <Bell size={15} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pr-5">
                      {notification.message && (
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {formatTime(notification.created_at)}
                        </span>

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 transition hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      aria-label="Delete notification"
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Showing your latest 30 notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;