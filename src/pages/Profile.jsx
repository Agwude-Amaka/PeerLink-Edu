import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Save,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { supabase } from "../services/supabase";

const defaultSubjects = [
  "Mathematics",
  "Physics",
  "Computer Science",
];

const defaultInterests = [
  "Peer tutoring",
  "Problem solving",
  "Technology",
];

function Profile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    class_level: "",
    school: "",
    bio: "",
    subjects_help: [],
    interests: [],
  });

  const [newSubject, setNewSubject] = useState("");
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("No logged-in user found.");
        setLoading(false);
        return;
      }

      setEmail(user.email || "");

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Your profile could not be found.");
        setLoading(false);
        return;
      }

      setProfile(data);

      setForm({
        full_name: data.full_name || "",
        class_level: data.class_level || "",
        school:
          data.school ||
          "University Preparatory Secondary School",
        bio: data.bio || "",
        subjects_help: Array.isArray(data.subjects_help)
          ? data.subjects_help.filter(Boolean)
          : [],
        interests: Array.isArray(data.interests)
          ? data.interests.filter(Boolean)
          : [],
      });

      setLoading(false);
    }

    loadProfile();
  }, []);

  function openEditor() {
    setSaveMessage("");
    setNewSubject("");
    setNewInterest("");

    setForm({
      full_name: profile?.full_name || "",
      class_level: profile?.class_level || "",
      school:
        profile?.school ||
        "University Preparatory Secondary School",
      bio: profile?.bio || "",
      subjects_help: Array.isArray(profile?.subjects_help)
        ? profile.subjects_help.filter(Boolean)
        : [],
      interests: Array.isArray(profile?.interests)
        ? profile.interests.filter(Boolean)
        : [],
    });

    setEditing(true);
  }

  function closeEditor() {
    if (saving) return;

    setEditing(false);
    setSaveMessage("");
    setNewSubject("");
    setNewInterest("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function addSubject(subjectValue = newSubject) {
    const cleanedSubject = subjectValue.trim();

    if (!cleanedSubject) {
      setSaveMessage("Please enter a subject.");
      return;
    }

    const exists = form.subjects_help.some(
      (subject) =>
        subject.toLowerCase() === cleanedSubject.toLowerCase()
    );

    if (exists) {
      setSaveMessage("That subject is already in your list.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      subjects_help: [
        ...previous.subjects_help,
        cleanedSubject,
      ],
    }));

    setNewSubject("");
    setSaveMessage("");
  }

  function removeSubject(subjectToRemove) {
    setForm((previous) => ({
      ...previous,
      subjects_help: previous.subjects_help.filter(
        (subject) => subject !== subjectToRemove
      ),
    }));
  }

  function addInterest(interestValue = newInterest) {
    const cleanedInterest = interestValue.trim();

    if (!cleanedInterest) {
      setSaveMessage("Please enter an interest.");
      return;
    }

    const exists = form.interests.some(
      (interest) =>
        interest.toLowerCase() === cleanedInterest.toLowerCase()
    );

    if (exists) {
      setSaveMessage("That interest is already in your list.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      interests: [
        ...previous.interests,
        cleanedInterest,
      ],
    }));

    setNewInterest("");
    setSaveMessage("");
  }

  function removeInterest(interestToRemove) {
    setForm((previous) => ({
      ...previous,
      interests: previous.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      setSaveMessage("Please enter your full name.");
      return;
    }

    if (!form.class_level.trim()) {
      setSaveMessage("Please enter your class.");
      return;
    }

    if (!form.school.trim()) {
      setSaveMessage("Please enter your school.");
      return;
    }

    if (!email.trim()) {
      setSaveMessage("Please enter an email address.");
      return;
    }

    if (form.subjects_help.length === 0) {
      setSaveMessage(
        "Please add at least one subject you can help with."
      );
      return;
    }

    if (form.interests.length === 0) {
      setSaveMessage("Please add at least one interest.");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaveMessage("Your session could not be verified.");
      setSaving(false);
      return;
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        class_level: form.class_level.trim(),
        school: form.school.trim(),
        bio: form.bio.trim(),
        subjects_help: form.subjects_help,
        interests: form.interests,
      })
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Profile update error:", updateError);
      setSaveMessage(updateError.message);
      setSaving(false);
      return;
    }

    if (!data) {
      setSaveMessage(
        "Your profile could not be updated. Check your Supabase permissions."
      );
      setSaving(false);
      return;
    }

    const currentEmail = (user.email || "").trim().toLowerCase();
    const newEmail = email.trim().toLowerCase();

    if (newEmail !== currentEmail) {
      const { error: emailError } =
        await supabase.auth.updateUser({
          email: newEmail,
        });

      if (emailError) {
        console.error("Email update error:", emailError);

        setProfile(data);

        setForm({
          full_name: data.full_name || "",
          class_level: data.class_level || "",
          school:
            data.school ||
            "University Preparatory Secondary School",
          bio: data.bio || "",
          subjects_help: Array.isArray(data.subjects_help)
            ? data.subjects_help
            : [],
          interests: Array.isArray(data.interests)
            ? data.interests
            : [],
        });

        setSaveMessage(
          `Profile updated, but the email could not be changed: ${emailError.message}`
        );

        setSaving(false);
        return;
      }

      setProfile(data);

      setForm({
        full_name: data.full_name || "",
        class_level: data.class_level || "",
        school:
          data.school ||
          "University Preparatory Secondary School",
        bio: data.bio || "",
        subjects_help: Array.isArray(data.subjects_help)
          ? data.subjects_help
          : [],
        interests: Array.isArray(data.interests)
          ? data.interests
          : [],
      });

      setSaveMessage(
        "Profile updated. Check your new email address to confirm the email change."
      );

      setSaving(false);

      setTimeout(() => {
        setEditing(false);
        setSaveMessage("");
      }, 2500);

      return;
    }

    setProfile(data);

    setForm({
      full_name: data.full_name || "",
      class_level: data.class_level || "",
      school:
        data.school ||
        "University Preparatory Secondary School",
      bio: data.bio || "",
      subjects_help: Array.isArray(data.subjects_help)
        ? data.subjects_help
        : [],
      interests: Array.isArray(data.interests)
        ? data.interests
        : [],
    });

    setSaveMessage("Profile updated successfully.");
    setSaving(false);

    setTimeout(() => {
      setEditing(false);
      setSaveMessage("");
    }, 900);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            Loading your profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            We couldn't load your profile.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const fullName =
    profile?.full_name || "PeerLink Student";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S";

  const displayedSubjects =
    Array.isArray(profile?.subjects_help) &&
    profile.subjects_help.length > 0
      ? profile.subjects_help
      : defaultSubjects;

  const displayedInterests =
    Array.isArray(profile?.interests) &&
    profile.interests.length > 0
      ? profile.interests
      : defaultInterests;

  const displayedSchool =
    profile?.school ||
    "University Preparatory Secondary School";

  return (
    <>
<div className="session-hub-shell mx-auto max-w-6xl space-y-8">        {/* Page heading */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              <User size={13} />
              Your account
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Keep your profile updated so other students can
              understand who you are and what you can help with.
            </p>
          </div>

          <button
            type="button"
            onClick={openEditor}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 sm:w-auto"
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </section>

        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative h-32 overflow-hidden bg-slate-950 sm:h-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.5),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(129,140,248,0.3),transparent_35%)]" />

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="px-5 pb-7 sm:px-8">
            <div className="-mt-11 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-white text-2xl font-extrabold text-indigo-700 shadow-lg dark:border-slate-900 dark:bg-slate-800 dark:text-indigo-300">
                    {initials}
                  </div>

                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500 dark:border-slate-900" />
                </div>

                <div className="min-w-0 pb-1">
                  <h2 className="truncate text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                    {fullName}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <span>Student</span>
                    <span className="text-slate-300 dark:text-slate-700">
                      •
                    </span>
                    <span>
                      {profile?.class_level || "Class not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  PeerLink student
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main information */}
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* About */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                <User size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950 dark:text-white">
                  About Me
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Your student information
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div className="flex gap-3">
                <Mail
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-700 dark:text-slate-200">
                    {email || "Email unavailable"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <GraduationCap
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Class
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {profile?.class_level || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    School
                  </p>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                    {displayedSchool}
                  </p>
                </div>
              </div>

              {profile?.bio ? (
                <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    About
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {profile.bio}
                  </p>
                </div>
              ) : (
                <div className="border-t border-dashed border-slate-200 pt-5 dark:border-slate-700">
                  <p className="text-sm text-slate-400">
                    You haven't added a short bio yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subjects and interests */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                <BookOpen size={19} />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-slate-950 dark:text-white">
                  Subjects I Can Help With
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Areas you're comfortable supporting others in
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {displayedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {subject}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={openEditor}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              <Edit3 size={15} />
              Edit subjects
            </button>

            <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Interests
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Things you enjoy or want to explore.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEditor}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {displayedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <Sparkles size={12} />
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Completion CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/30 sm:p-8">
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <CheckCircle2 size={15} />
                Keep your profile current
              </div>

              <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                Help other students know what you can offer.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A clear profile makes it easier for students to
                find someone with the right subjects, interests,
                and learning goals.
              </p>
            </div>

            <button
              type="button"
              onClick={openEditor}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-100 transition hover:bg-indigo-50 dark:bg-slate-900 dark:ring-indigo-900/50 dark:hover:bg-slate-800"
            >
              <Edit3 size={16} />
              Update Profile
            </button>
          </div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex h-full items-center justify-center">
            <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Account settings
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                    Edit Profile
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  aria-label="Close editor"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Modal body */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-7 p-5 sm:p-6">
                  {/* Basic details */}
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-950 dark:text-white">
                        Basic information
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Keep your core student information accurate.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Full name
                        </label>

                        <input
                          type="text"
                          name="full_name"
                          value={form.full_name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Class
                        </label>

                        <input
                          type="text"
                          name="class_level"
                          value={form.class_level}
                          onChange={handleChange}
                          placeholder="e.g. SS1"
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* School */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      School
                    </label>

                    <div className="relative mt-2">
                      <MapPin
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="school"
                        value={form.school}
                        onChange={handleChange}
                        placeholder="Enter your school"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      About you
                    </label>

                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell other students a little about yourself..."
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                    />
                  </div>

                  {/* Subjects */}
                  <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-950 dark:text-white">
                        Subjects I can help with
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Add every subject you're comfortable helping
                        another student with.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.subjects_help.length > 0 ? (
                        form.subjects_help.map((subject) => (
                          <div
                            key={subject}
                            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                          >
                            {subject}

                            <button
                              type="button"
                              onClick={() => removeSubject(subject)}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-indigo-400 transition hover:bg-indigo-100 hover:text-red-600 dark:hover:bg-indigo-900/60"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm italic text-slate-400">
                          No subjects added yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Quick add
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {defaultSubjects.map((subject) => {
                          const alreadyAdded =
                            form.subjects_help.some(
                              (item) =>
                                item.toLowerCase() ===
                                subject.toLowerCase()
                            );

                          return (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => addSubject(subject)}
                              disabled={alreadyAdded}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                            >
                              <Plus size={13} />
                              {subject}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(event) =>
                          setNewSubject(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addSubject();
                          }
                        }}
                        placeholder="Add another subject..."
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() => addSubject()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-slate-950 dark:text-white">
                        Interests
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Add things you enjoy, care about, or want to
                        explore.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.interests.length > 0 ? (
                        form.interests.map((interest) => (
                          <div
                            key={interest}
                            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                          >
                            <Sparkles size={13} />

                            {interest}

                            <button
                              type="button"
                              onClick={() =>
                                removeInterest(interest)
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-full text-indigo-400 transition hover:bg-indigo-100 hover:text-red-600 dark:hover:bg-indigo-900/60"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm italic text-slate-400">
                          No interests added yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Quick add
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {defaultInterests.map((interest) => {
                          const alreadyAdded =
                            form.interests.some(
                              (item) =>
                                item.toLowerCase() ===
                                interest.toLowerCase()
                            );

                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() =>
                                addInterest(interest)
                              }
                              disabled={alreadyAdded}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                            >
                              <Plus size={13} />
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(event) =>
                          setNewInterest(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addInterest();
                          }
                        }}
                        placeholder="Add another interest..."
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() => addInterest()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Email address
                    </label>

                    <div className="relative mt-2">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="Enter your email address"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                      />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      A confirmation email may be sent when you
                      change your email address.
                    </p>
                  </div>

                  {/* Feedback */}
                  {saveMessage && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        saveMessage.includes("successfully") ||
                        saveMessage.includes("Check your new email")
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      }`}
                    >
                      {saveMessage}
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400"
                    />

                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Your profile information is visible to other
                      authenticated PeerLink students so they can
                      find the right person to learn with.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
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
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;