import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
  Users,
  Play,
  Square,
  Radio,
  X,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  MessageSquare,
  MonitorUp,
  SwitchCamera,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
} from "livekit-client";
import { supabase } from "../services/supabase";

const meetingMethods = [
  {
    value: "PeerLink",
    label: "PeerLink",
    description: "Meet inside PeerLink.",
  },
  {
    value: "Google Meet",
    label: "Google Meet",
    description: "Use a Google Meet link.",
  },
  {
    value: "Zoom",
    label: "Zoom",
    description: "Use a Zoom meeting link.",
  },
  {
    value: "In person",
    label: "In person",
    description: "Meet physically at an agreed location.",
  },
];

const allowedFileTypes = [
  {
    extension: "pdf",
    label: "PDF",
    mimeTypes: ["application/pdf"],
  },
  {
    extension: "doc",
    label: "DOC",
    mimeTypes: ["application/msword"],
  },
  {
    extension: "docx",
    label: "DOCX",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    extension: "ppt",
    label: "PPT",
    mimeTypes: ["application/vnd.ms-powerpoint"],
  },
  {
    extension: "pptx",
    label: "PPTX",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  {
    extension: "jpg",
    label: "JPG",
    mimeTypes: ["image/jpeg"],
  },
  {
    extension: "jpeg",
    label: "JPEG",
    mimeTypes: ["image/jpeg"],
  },
  {
    extension: "png",
    label: "PNG",
    mimeTypes: ["image/png"],
  },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function LiveVideoTile({ participant, isLocal = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const cameraTrack = participant?.getTrackPublication(
    Track.Source.Camera
  )?.track;

  const microphoneTrack = participant?.getTrackPublication(
    Track.Source.Microphone
  )?.track;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !cameraTrack) return;

    cameraTrack.attach(element);

    return () => {
      cameraTrack.detach(element);
    };
  }, [cameraTrack]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element || !microphoneTrack || isLocal) return;

    microphoneTrack.attach(element);

    return () => {
      microphoneTrack.detach(element);
    };
  }, [microphoneTrack, isLocal]);

  const displayName = isLocal
    ? "You"
    : participant?.name || participant?.identity || "Peer";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-lg">
      {cameraTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full min-h-[260px] w-full object-cover"
        />
      ) : (
        <div className="flex min-h-[260px] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500 text-2xl font-bold text-white shadow-xl">
              {initials}
            </div>
            <p className="mt-4 text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Camera is off
            </p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
        <span className="rounded-lg bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          {displayName}
        </span>
        <span className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm">
          {microphoneTrack ? <Mic size={14} /> : <MicOff size={14} />}
        </span>
      </div>

      <audio ref={audioRef} autoPlay />
    </div>
  );
}

function ScreenShareTile({ participant }) {
  const videoRef = useRef(null);

  const screenTrack = participant?.getTrackPublication(
    Track.Source.ScreenShare
  )?.track;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !screenTrack) return;

    screenTrack.attach(element);

    return () => {
      screenTrack.detach(element);
    };
  }, [screenTrack]);

  if (!screenTrack) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-h-[65vh] w-full object-contain"
      />
      <span className="absolute left-4 top-4 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
        Screen share
      </span>
    </div>
  );
}

function SessionHub() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
const [liveRoom, setLiveRoom] = useState(null);
const [liveParticipants, setLiveParticipants] = useState([]);
const [isLiveClassOpen, setIsLiveClassOpen] = useState(false);
const [isConnectingLiveClass, setIsConnectingLiveClass] =
  useState(false);
const [liveClassError, setLiveClassError] = useState("");
const [isMicEnabled, setIsMicEnabled] = useState(true);
const [isCameraEnabled, setIsCameraEnabled] = useState(true);
const [isFrontCamera, setIsFrontCamera] = useState(true);
const [isFlippingCamera, setIsFlippingCamera] = useState(false);
const [isScreenSharing, setIsScreenSharing] = useState(false);

const liveRoomRef = useRef(null);
const localVideoRef = useRef(null);

  const [session, setSession] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Meeting setup
  const [meetingMethod, setMeetingMethod] = useState("PeerLink");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Live Class
  const [liveClass, setLiveClass] = useState(null);
  const [liveClassLoading, setLiveClassLoading] = useState(true);
  const [liveClassActionLoading, setLiveClassActionLoading] =
    useState(false);
  const [liveClassMessage, setLiveClassMessage] = useState("");
  const [classroomOpen, setClassroomOpen] = useState(false);

  // Presence
  const [onlineParticipants, setOnlineParticipants] = useState([]);
  const [presenceChannel, setPresenceChannel] = useState(null);

  // Notes
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Resources
  const [resources, setResources] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [viewingResource, setViewingResource] = useState(null);
  const [viewingResourceUrl, setViewingResourceUrl] = useState("");
  const [loadingResourceViewer, setLoadingResourceViewer] = useState(false);

  // Loading
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Invite / join flow
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joiningSession, setJoiningSession] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // In-call side panel (chat + materials)
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessageText, setChatMessageText] = useState("");
  const [loadingChatMessages, setLoadingChatMessages] =
    useState(false);
  const [sendingChatMessage, setSendingChatMessage] =
    useState(false);
  const [chatMessageError, setChatMessageError] = useState("");
  const chatMessagesEndRef = useRef(null);
  const chatChannelRef = useRef(null);

  // Actions
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingResourceId, setDownloadingResourceId] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  // Messages
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [resourceMessage, setResourceMessage] = useState("");

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function connectToLiveClass() {
    if (!session || !currentUserId) {
      return false;
    }

    if (liveRoomRef.current) {
      setIsLiveClassOpen(true);
      setClassroomOpen(true);
      return true;
    }

    setIsConnectingLiveClass(true);
    setLiveClassError("");

    try {
      const roomName = `peerlink-session-${session.id}`;
      const participantName = "PeerLink Student";
      const participantIdentity = currentUserId;

      const { data: tokenData, error: tokenError } =
        await supabase.functions.invoke("livekit-token", {
          body: {
            roomName,
            participantName,
            participantIdentity,
          },
        });

      if (tokenError) throw tokenError;

      if (!tokenData?.token) {
        throw new Error(
          tokenData?.error ||
            "Live classroom token could not be created."
        );
      }

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

      if (!livekitUrl) {
        throw new Error("VITE_LIVEKIT_URL is not configured.");
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      const updateParticipants = () => {
        setLiveParticipants([
          room.localParticipant,
          ...Array.from(room.remoteParticipants.values()),
        ]);
      };

      room.on(RoomEvent.ParticipantConnected, updateParticipants);
      room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      room.on(RoomEvent.TrackSubscribed, updateParticipants);
      room.on(RoomEvent.TrackUnsubscribed, updateParticipants);
      room.on(RoomEvent.LocalTrackPublished, updateParticipants);
      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        updateParticipants();

        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(false);
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        liveRoomRef.current = null;
        setLiveRoom(null);
        setLiveParticipants([]);
        setIsLiveClassOpen(false);
      });

      await room.connect(livekitUrl, tokenData.token);

      const tracks = await createLocalTracks({
        audio: true,
        video: true,
      });

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
      }

      liveRoomRef.current = room;
      setLiveRoom(room);
      setIsLiveClassOpen(true);
      setClassroomOpen(true);
      updateParticipants();

      return true;
    } catch (connectionError) {
      console.error("Connect Live Class error:", connectionError);
      setLiveClassError(
        connectionError?.message ||
          "Unable to join the live classroom."
      );
      return false;
    } finally {
      setIsConnectingLiveClass(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SESSION LOADING
   * ---------------------------------------------------------
   */

  async function loadSession() {
    setLoading(true);
    setError("");
    setSaveMessage("");

    if (!sessionId) {
      setError("This session link is missing its session ID.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be verified.");
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

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
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error("Session Hub session error:", sessionError);
      setError(sessionError.message);
      setLoading(false);
      return;
    }

    if (!sessionData) {
      setError(
        "This scheduled session could not be found or you do not have access to it."
      );
      setLoading(false);
      return;
    }

    const {
      data: request,
      error: requestError,
    } = await supabase
      .from("help_requests")
      .select(`
        id,
        requester_id,
        helper_id,
        subject,
        message,
        status,
        help_offer_id
      `)
      .eq("id", sessionData.help_request_id)
      .maybeSingle();

    if (requestError) {
      console.error("Session Hub request error:", requestError);
    }

    let isOriginalParticipant = false;

    if (request) {
      isOriginalParticipant =
        request.requester_id === user.id ||
        request.helper_id === user.id;
    }

    let alreadyJoined = isOriginalParticipant;

    if (!isOriginalParticipant) {
      const {
        data: participantRow,
        error: participantError,
      } = await supabase
        .from("session_participants")
        .select("id")
        .eq("session_id", sessionData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (participantError) {
        console.error(
          "Participant check error:",
          participantError
        );
      }

      alreadyJoined = Boolean(participantRow);
    }

    if (!alreadyJoined) {
      setNeedsToJoin(true);
      setIsParticipant(false);
      setLoading(false);
      return;
    }

    setIsParticipant(true);
    setNeedsToJoin(false);

    if (!request) {
      setError(
        "You're a participant in this session, but its details could not be loaded. Double-check the help_requests table permissions."
      );
      setLoading(false);
      return;
    }

    let offer = null;

    if (request.help_offer_id) {
      const {
        data: offerData,
        error: offerError,
      } = await supabase
        .from("help_offers")
        .select(`
          id,
          user_id,
          subject,
          topic,
          description
        `)
        .eq("id", request.help_offer_id)
        .maybeSingle();

      if (offerError) {
        console.error("Session Hub offer error:", offerError);
      } else {
        offer = offerData;
      }
    }

    const otherStudentId =
      request.requester_id === user.id
        ? request.helper_id
        : request.requester_id;

    let otherStudent = null;

    if (otherStudentId) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          class_level,
          school,
          bio
        `)
        .eq("id", otherStudentId)
        .maybeSingle();

      if (profileError) {
        console.error("Session Hub profile error:", profileError);
      } else {
        otherStudent = profileData;
      }
    }

    const fullSession = {
      ...sessionData,
      request,
      offer,
      availability: sessionData.help_availability,
      otherStudent,
    };

    setSession(fullSession);

    setMeetingMethod(sessionData.meeting_method || "PeerLink");
    setMeetingLink(sessionData.meeting_link || "");
    setMeetingNotes(sessionData.meeting_notes || "");

    await Promise.all([
      loadNotes(sessionData.id),
      loadResources(sessionData.id),
      loadLiveClass(sessionData.id),
    ]);

    setLoading(false);
  }

  /*
   * ---------------------------------------------------------
   * LIVE CLASS
   * ---------------------------------------------------------
   */

  async function loadLiveClass(currentSessionId) {
    setLiveClassLoading(true);
    setLiveClassMessage("");

    const {
      data,
      error: liveError,
    } = await supabase
      .from("session_live_classes")
      .select(`
        id,
        session_id,
        is_live,
        started_at,
        ended_at,
        created_at
      `)
      .eq("session_id", currentSessionId)
      .maybeSingle();

    if (liveError) {
      console.error("Load live class error:", liveError);

      setLiveClass(null);
      setLiveClassMessage(
        "Live Class is not available yet. Check the session_live_classes table and its permissions."
      );

      setLiveClassLoading(false);
      return;
    }

    setLiveClass(data || null);
    setLiveClassLoading(false);
  }

  async function createOrUpdateLiveClass(nextIsLive) {
    if (!session || !currentUserId) {
      return;
    }

    setLiveClassActionLoading(true);
    setLiveClassMessage("");

    try {
      const now = new Date().toISOString();

      if (liveClass?.id) {
        const updatePayload = nextIsLive
          ? {
              is_live: true,
              started_at:now,
              ended_at: null,
            }
          : {
              is_live: false,
              ended_at: now,
            };

        const {
          data,
          error: updateError,
        } = await supabase
          .from("session_live_classes")
          .update(updatePayload)
          .eq("id", liveClass.id)
          .select(`
            id,
            session_id,
            is_live,
            started_at,
            ended_at,
            created_at
          `)
          .single();

        if (updateError) {
          throw updateError;
        }

        setLiveClass(data);

        if (nextIsLive) {
          setClassroomOpen(true);
          setLiveClassMessage("Your Live Class is now open.");
        } else {
          setClassroomOpen(false);
          setLiveClassMessage("The Live Class has ended.");
        }
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("session_live_classes")
          .insert({
            session_id: session.id,
            is_live: nextIsLive,
            started_at: nextIsLive ? now : null,
            ended_at: nextIsLive ? null : now,
          })
          .select(`
            id,
            session_id,
            is_live,
            started_at,
            ended_at,
            created_at
          `)
          .single();

        if (insertError) {
          throw insertError;
        }

        setLiveClass(data);

        if (nextIsLive) {
          setClassroomOpen(true);
          setLiveClassMessage("Your Live Class is now open.");
        }
      }
    } catch (liveError) {
      console.error("Live class update error:", liveError);

      setLiveClassMessage(
        liveError.message ||
          "The Live Class could not be updated."
      );
    } finally {
      setLiveClassActionLoading(false);
    }
  }

  async function startLiveClass() {
    await createOrUpdateLiveClass(true);
    await connectToLiveClass();
  }

  async function endLiveClass() {
    const confirmed = window.confirm(
      "End this Live Class? Your shared notes and resources will remain available."
    );

    if (!confirmed) {
      return;
    }

    await createOrUpdateLiveClass(false);
  }

  async function enterClassroom() {
    setLiveClassMessage("");
    await connectToLiveClass();
  }

  function leaveClassroomView() {
    setClassroomOpen(false);
  }

  async function leaveLiveCall() {
    const room = liveRoomRef.current;

    if (room) {
      try {
        room.disconnect();
      } catch (disconnectError) {
        console.error("Leave Live Call error:", disconnectError);
      }
    }

    liveRoomRef.current = null;
    setLiveRoom(null);
    setLiveParticipants([]);
    setIsLiveClassOpen(false);
    setClassroomOpen(false);
  }

  async function toggleMicrophone() {
    const room = liveRoomRef.current;
    if (!room) return;

    const nextEnabled = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(nextEnabled);
    setIsMicEnabled(nextEnabled);
    setLiveParticipants([
      room.localParticipant,
      ...Array.from(room.remoteParticipants.values()),
    ]);
  }

  async function toggleCamera() {
    const room = liveRoomRef.current;
    if (!room) return;

    const nextEnabled = !isCameraEnabled;
    await room.localParticipant.setCameraEnabled(nextEnabled);
    setIsCameraEnabled(nextEnabled);
    setLiveParticipants([
      room.localParticipant,
      ...Array.from(room.remoteParticipants.values()),
    ]);
  }

  async function flipCamera() {
    const room = liveRoomRef.current;
    if (!room || isFlippingCamera) return;

    setIsFlippingCamera(true);
    setLiveClassError("");

    try {
      const nextFacingMode = isFrontCamera ? "environment" : "user";

      const existingPublication =
        room.localParticipant.getTrackPublication(
          Track.Source.Camera
        );

      if (existingPublication?.track) {
        await room.localParticipant.unpublishTrack(
          existingPublication.track
        );
        existingPublication.track.stop();
      }

      const [newTrack] = await createLocalTracks({
        video: { facingMode: nextFacingMode },
        audio: false,
      });

      await room.localParticipant.publishTrack(newTrack);

      setIsFrontCamera(!isFrontCamera);
      setLiveParticipants([
        room.localParticipant,
        ...Array.from(room.remoteParticipants.values()),
      ]);
    } catch (flipError) {
      console.error("Flip camera error:", flipError);
      setLiveClassError(
        "Could not switch cameras. Your device may not have a back camera, or camera access was blocked."
      );
    } finally {
      setIsFlippingCamera(false);
    }
  }

  async function toggleScreenShare() {
    const room = liveRoomRef.current;
    if (!room) return;

    setLiveClassError("");

    try {
      const nextEnabled = !isScreenSharing;

      await room.localParticipant.setScreenShareEnabled(
        nextEnabled,
        { audio: false }
      );

      setIsScreenSharing(nextEnabled);
      setLiveParticipants([
        room.localParticipant,
        ...Array.from(room.remoteParticipants.values()),
      ]);
    } catch (shareError) {
      console.error("Screen share error:", shareError);
      setLiveClassError(
        "Could not start screen sharing. Make sure you select a screen, window, or tab to share."
      );
    }
  }


  /*
   * ---------------------------------------------------------
   * LIVE CLASS REALTIME
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!sessionId || !currentUserId) {
      return;
    }

    const channel = supabase.channel(
      `peerlink-live-class-${sessionId}`,
      {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      }
    );

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_live_classes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setLiveClass(null);
            setClassroomOpen(false);
            return;
          }

          if (payload.new) {
            setLiveClass(payload.new);

            if (payload.new.is_live) {
              setClassroomOpen(true);
            }
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        const participants = Object.entries(state).map(
          ([key, entries]) => ({
            key,
            ...entries?.[0],
          })
        );

        setOnlineParticipants(participants);
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState();

        const participants = Object.entries(state).map(
          ([key, entries]) => ({
            key,
            ...entries?.[0],
          })
        );

        setOnlineParticipants(participants);
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState();

        const participants = Object.entries(state).map(
          ([key, entries]) => ({
            key,
            ...entries?.[0],
          })
        );

        setOnlineParticipants(participants);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            full_name:
              session?.otherStudent?.full_name ||
              "PeerLink Student",
            joined_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setPresenceChannel(null);
      setOnlineParticipants([]);
    };
  }, [sessionId, currentUserId, session?.otherStudent?.full_name]);

  useEffect(() => {
    if (
      classroomOpen &&
      sidePanelOpen &&
      sidePanelTab === "chat" &&
      session
    ) {
      loadChatMessages();
      subscribeToChatMessages();
    }

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
    };
  }, [classroomOpen, sidePanelOpen, sidePanelTab, session?.id]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      const room = liveRoomRef.current;
      if (room) {
        try {
          room.disconnect();
        } catch (disconnectError) {
          console.error("Live room cleanup error:", disconnectError);
        }
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * NOTES
   * ---------------------------------------------------------
   */

  async function loadNotes(currentSessionId) {
    setLoadingNotes(true);

    const {
      data,
      error: notesError,
    } = await supabase
      .from("session_notes")
      .select(`
        id,
        session_id,
        author_id,
        title,
        content,
        created_at,
        updated_at
      `)
      .eq("session_id", currentSessionId)
      .order("updated_at", {
        ascending: false,
      });

    if (notesError) {
      console.error("Load session notes error:", notesError);
      setNoteMessage(notesError.message);
      setNotes([]);
      setLoadingNotes(false);
      return;
    }

    setNotes(data || []);
    setLoadingNotes(false);
  }

  async function createNote() {
    if (!session || !currentUserId) {
      return;
    }

    if (!newNoteTitle.trim()) {
      setNoteMessage("Please enter a note title.");
      return;
    }

    if (!newNoteContent.trim()) {
      setNoteMessage("Please enter some note content.");
      return;
    }

    setSavingNote(true);
    setNoteMessage("");

    const {
      data,
      error: noteError,
    } = await supabase
      .from("session_notes")
      .insert({
        session_id: session.id,
        author_id: currentUserId,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
      })
      .select()
      .single();

    if (noteError) {
      console.error("Create note error:", noteError);
      setNoteMessage(noteError.message);
      setSavingNote(false);
      return;
    }

    setNotes((previous) => [data, ...previous]);

    setNewNoteTitle("");
    setNewNoteContent("");
    setSavingNote(false);

    setNoteMessage("Note created successfully.");
  }

  function beginEditNote(note) {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
    setNoteMessage("");
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setEditingNoteTitle("");
    setEditingNoteContent("");
  }

  async function saveEditedNote(noteId) {
    if (!editingNoteTitle.trim()) {
      setNoteMessage("Please enter a note title.");
      return;
    }

    if (!editingNoteContent.trim()) {
      setNoteMessage("Please enter some note content.");
      return;
    }

    setSavingNote(true);
    setNoteMessage("");

    const {
      data,
      error: noteError,
    } = await supabase
      .from("session_notes")
      .update({
        title: editingNoteTitle.trim(),
        content: editingNoteContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("author_id", currentUserId)
      .select()
      .single();

    if (noteError) {
      console.error("Update note error:", noteError);
      setNoteMessage(noteError.message);
      setSavingNote(false);
      return;
    }

    setNotes((previous) =>
      previous.map((note) =>
        note.id === noteId ? data : note
      )
    );

    cancelEditNote();
    setSavingNote(false);

    setNoteMessage("Note updated successfully.");
  }

  async function deleteNote(noteId) {
    const confirmed = window.confirm(
      "Delete this session note?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingNoteId(noteId);
    setNoteMessage("");

    const {
      error: deleteError,
    } = await supabase
      .from("session_notes")
      .delete()
      .eq("id", noteId)
      .eq("author_id", currentUserId);

    if (deleteError) {
      console.error("Delete note error:", deleteError);

      setNoteMessage(deleteError.message);
      setDeletingNoteId(null);
      return;
    }

    setNotes((previous) =>
      previous.filter((note) => note.id !== noteId)
    );

    setDeletingNoteId(null);
  }

  /*
   * ---------------------------------------------------------
   * RESOURCES
   * ---------------------------------------------------------
   */

  async function loadResources(currentSessionId) {
    setLoadingResources(true);

    const {
      data,
      error: resourcesError,
    } = await supabase
      .from("session_resources")
      .select(`
        id,
        session_id,
        uploader_id,
        file_name,
        file_path,
        file_type,
        file_size,
        created_at
      `)
      .eq("session_id", currentSessionId)
      .order("created_at", {
        ascending: false,
      });

    if (resourcesError) {
      console.error(
        "Load session resources error:",
        resourcesError
      );

      setResourceMessage(resourcesError.message);
      setResources([]);
      setLoadingResources(false);
      return;
    }

    setResources(data || []);
    setLoadingResources(false);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setResourceMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const matchingType = allowedFileTypes.find(
      (type) => type.mimeTypes.includes(file.type)
    );

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const extensionAllowed = allowedFileTypes.some(
      (type) => type.extension === extension
    );

    if (!matchingType && !extensionAllowed) {
      setResourceMessage(
        "This file type isn't supported. Use PDF, DOC, DOCX, PPT, PPTX, JPG, JPEG, or PNG."
      );

      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setResourceMessage(
        "Files must be 50 MB or smaller."
      );

      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function uploadResource() {
    if (!session || !currentUserId || !selectedFile) {
      setResourceMessage("Please choose a file first.");
      return;
    }

    setUploadingFile(true);
    setResourceMessage("");

    const safeFileName = selectedFile.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    const uniqueName =
      `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    const filePath =
      `${session.id}/${currentUserId}/${uniqueName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("session-resources")
      .upload(filePath, selectedFile, {
        contentType:
          selectedFile.type ||
          "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Resource upload error:",
        uploadError
      );

      setResourceMessage(uploadError.message);
      setUploadingFile(false);
      return;
    }

    const {
      data: resource,
      error: metadataError,
    } = await supabase
      .from("session_resources")
      .insert({
        session_id: session.id,
        uploader_id: currentUserId,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type || null,
        file_size: selectedFile.size,
      })
      .select()
      .single();

    if (metadataError) {
      console.error(
        "Resource metadata error:",
        metadataError
      );

      await supabase.storage
        .from("session-resources")
        .remove([filePath]);

      setResourceMessage(metadataError.message);
      setUploadingFile(false);
      return;
    }

    setResources((previous) => [
      resource,
      ...previous,
    ]);

    setSelectedFile(null);

    const input = document.getElementById(
      "session-resource-upload"
    );

    if (input) {
      input.value = "";
    }

    setResourceMessage(
      "Resource uploaded successfully."
    );

    setUploadingFile(false);
  }

  async function getResourceUrl(resource) {
    const {
      data,
      error: signedUrlError,
    } = await supabase.storage
      .from("session-resources")
      .createSignedUrl(
        resource.file_path,
        60 * 10
      );

    if (signedUrlError) {
      console.error(
        "Signed URL error:",
        signedUrlError
      );

      throw signedUrlError;
    }

    if (!data?.signedUrl) {
      throw new Error(
        "The resource URL could not be created."
      );
    }

    return data.signedUrl;
  }

  async function openResource(resource) {
    setResourceMessage("");
    setViewingResource(resource);
    setViewingResourceUrl("");
    setLoadingResourceViewer(true);

    try {
      const signedUrl =
        await getResourceUrl(resource);

      setViewingResourceUrl(signedUrl);
    } catch (viewerError) {
      setResourceMessage(
        viewerError.message ||
          "The file could not be opened."
      );

      setViewingResource(null);
    } finally {
      setLoadingResourceViewer(false);
    }
  }

  async function downloadResource(resource) {
    if (!resource?.file_path) {
      setResourceMessage(
        "The file could not be downloaded."
      );
      return;
    }

    setDownloadingResourceId(resource.id);
    setResourceMessage("");

    try {
      const {
        data,
        error: downloadError,
      } = await supabase.storage
        .from("session-resources")
        .download(resource.file_path);

      if (downloadError) {
        throw downloadError;
      }

      if (!data) {
        throw new Error(
          "The file could not be downloaded."
        );
      }

      const blobUrl =
        URL.createObjectURL(data);

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = resource.file_name;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      setResourceMessage(
        "Download started successfully."
      );
    } catch (downloadError) {
      console.error(
        "Download resource error:",
        downloadError
      );

      setResourceMessage(
        downloadError.message ||
          "The file could not be downloaded."
      );
    } finally {
      setDownloadingResourceId(null);
    }
  }

  function closeResourceViewer() {
    setViewingResource(null);
    setViewingResourceUrl("");
    setLoadingResourceViewer(false);
  }

  async function deleteResource(resource) {
    const confirmed = window.confirm(
      `Delete "${resource.file_name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingResourceId(resource.id);
    setResourceMessage("");

    const {
      error: storageError,
    } = await supabase.storage
      .from("session-resources")
      .remove([resource.file_path]);

    if (storageError) {
      console.error(
        "Delete storage file error:",
        storageError
      );

      setResourceMessage(storageError.message);
      setDeletingResourceId(null);
      return;
    }

    const {
      error: metadataError,
    } = await supabase
      .from("session_resources")
      .delete()
      .eq("id", resource.id)
      .eq("uploader_id", currentUserId);

    if (metadataError) {
      console.error(
        "Delete resource metadata error:",
        metadataError
      );

      setResourceMessage(metadataError.message);
      setDeletingResourceId(null);
      return;
    }

    setResources((previous) =>
      previous.filter(
        (item) => item.id !== resource.id
      )
    );

    if (
      viewingResource?.id === resource.id
    ) {
      closeResourceViewer();
    }

    setDeletingResourceId(null);
  }

  /*
   * ---------------------------------------------------------
   * MEETING SETUP
   * ---------------------------------------------------------
   */

  async function saveMeetingDetails() {
    if (!session) {
      return;
    }

    if (
      meetingMethod !== "PeerLink" &&
      meetingMethod !== "In person" &&
      !meetingLink.trim()
    ) {
      setSaveMessage(
        `Please add the ${meetingMethod} meeting link.`
      );
      return;
    }

    setSavingMeeting(true);
    setSaveMessage("");
    setError("");

    const {
      error: updateError,
    } = await supabase
      .from("help_request_sessions")
      .update({
        meeting_method: meetingMethod,
        meeting_link:
          meetingLink.trim() || null,
        meeting_notes:
          meetingNotes.trim() || null,
      })
      .eq("id", session.id);

    if (updateError) {
      console.error(
        "Session update error:",
        updateError
      );

      setSaveMessage(updateError.message);
      setSavingMeeting(false);
      return;
    }

    setSession((previous) => ({
      ...previous,
      meeting_method: meetingMethod,
      meeting_link:
        meetingLink.trim() || null,
      meeting_notes:
        meetingNotes.trim() || null,
    }));

    setSaveMessage(
      "Session details saved successfully."
    );

    setSavingMeeting(false);
  }

  function openChat() {
    navigate("/connections");
  }

  async function joinSession() {
    if (!sessionId || !currentUserId) return;

    setJoiningSession(true);
    setJoinError("");

    const { error: joinInsertError } = await supabase
      .from("session_participants")
      .insert({
        session_id: sessionId,
        user_id: currentUserId,
      });

    if (joinInsertError) {
      console.error("Join session error:", joinInsertError);
      setJoinError(
        joinInsertError.message ||
          "Could not join this session. Ask the session owner for a valid invite link."
      );
      setJoiningSession(false);
      return;
    }

    setJoiningSession(false);
    await loadSession();
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (copyError) {
      console.error("Copy invite link error:", copyError);
    }
  }

  /*
   * ---------------------------------------------------------
   * IN-CALL CHAT
   * ---------------------------------------------------------
   */

  async function loadChatMessages() {
    if (!session || !currentUserId) return;

    const peerId = session.otherStudent?.id;
    const requestId = session.request?.id;

    if (!peerId || !requestId) return;

    setLoadingChatMessages(true);
    setChatMessageError("");

    const { data, error: messagesError } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, message, created_at, help_request_id"
      )
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
      )
      .eq("help_request_id", requestId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Load chat messages error:", messagesError);
      setChatMessageError(messagesError.message);
      setChatMessages([]);
      setLoadingChatMessages(false);
      return;
    }

    setChatMessages(data || []);
    setLoadingChatMessages(false);
  }

  function subscribeToChatMessages() {
    if (!session || !currentUserId) return;

    const peerId = session.otherStudent?.id;
    const requestId = session.request?.id;

    if (!peerId || !requestId) return;

    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current);
    }

    const channel = supabase
      .channel(
        `session-chat-${currentUserId}-${peerId}-${requestId}`
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

          if (!belongsToConversation) return;

          setChatMessages((previous) => {
            if (previous.some((m) => m.id === newMessage.id)) {
              return previous;
            }
            return [...previous, newMessage];
          });
        }
      )
      .subscribe();

    chatChannelRef.current = channel;
  }

  async function sendChatMessage() {
    const cleaned = chatMessageText.trim();

    if (!cleaned || !session || !currentUserId) return;

    const peerId = session.otherStudent?.id;
    const requestId = session.request?.id;

    if (!peerId || !requestId) return;

    setSendingChatMessage(true);
    setChatMessageError("");

    const {
      data: insertedMessage,
      error: insertError,
    } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: peerId,
        help_request_id: requestId,
        message: cleaned,
      })
      .select(
        "id, sender_id, receiver_id, message, created_at, help_request_id"
      )
      .single();

    if (insertError) {
      console.error("Send chat message error:", insertError);
      setChatMessageError(insertError.message);
      setSendingChatMessage(false);
      return;
    }

    setChatMessages((previous) => {
      if (previous.some((m) => m.id === insertedMessage.id)) {
        return previous;
      }
      return [...previous, insertedMessage];
    });

    setChatMessageText("");
    setSendingChatMessage(false);
  }

  function openSidePanel(tab) {
    setSidePanelTab(tab);
    setSidePanelOpen(true);
  }

  function closeSidePanel() {
    setSidePanelOpen(false);
  }

  function formatChatTime(dateString) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function formatDate(dateString) {
    if (!dateString) {
      return "Date unavailable";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
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

  function formatFileSize(bytes) {
    if (!bytes) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(
      1
    )} MB`;
  }

  function getFileExtension(fileName) {
    const parts = fileName.split(".");

    return parts.length > 1
      ? parts[parts.length - 1].toUpperCase()
      : "FILE";
  }

  function getResourceIcon(fileType) {
    if (
      fileType?.startsWith("image/")
    ) {
      return <ImageIcon size={18} />;
    }

    return <FileText size={18} />;
  }

  function isPreviewableResource(resource) {
    return (
      resource?.file_type ===
        "application/pdf" ||
      resource?.file_type?.startsWith(
        "image/"
      )
    );
  }

  function formatLiveStartTime() {
    if (!liveClass?.started_at) {
      return null;
    }

    return new Date(
      liveClass.started_at
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  /*
   * ---------------------------------------------------------
   * LOADING / ERROR STATES
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2
              size={19}
              className="animate-spin"
            />
            Loading your session...
          </div>
        </div>
      </div>
    );
  }

  if (needsToJoin) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Users size={28} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            You've been invited to a PeerLink session
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Join to see the shared notes, resources, and live
            classroom for this session.
          </p>

          {joinError && (
            <div className="mx-auto mt-4 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {joinError}
            </div>
          )}

          <button
            type="button"
            onClick={joinSession}
            disabled={joiningSession}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joiningSession ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Joining...
              </>
            ) : (
              "Join This Session"
            )}
          </button>

          <div className="mt-6">
            <Link
              to="/connections"
              className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              Back to Connections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-700">
            We couldn't open this session.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-600">
            {error ||
              "The requested session is unavailable."}
          </p>

          <Link
            to="/connections"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-100"
          >
            <ArrowLeft size={16} />
            Back to Connections
          </Link>
        </div>
      </div>
    );
  }

  const request = session.request;
  const offer = session.offer;
  const availability = session.availability;
  const otherStudent = session.otherStudent;

  const isRequester =
    request.requester_id === currentUserId;

  const initials =
    otherStudent?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S";

  const isLive = liveClass?.is_live === true;

  /*
   * ---------------------------------------------------------
   * MAIN UI
   * ---------------------------------------------------------
   */

  return (
<div className="session-hub-page mx-auto max-w-6xl space-y-8">      {/* Back */}
      <Link
        to="/connections"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Connections
      </Link>

      {/* Header */}
      <section>
        <p className="text-sm font-semibold text-indigo-600">
          PeerLink Session
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Session Hub
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Your shared workspace for this peer-learning
          session.
        </p>
      </section>

      {/* =====================================================
          LIVE CLASS HERO
          ===================================================== */}

      <section
        className={`overflow-hidden rounded-3xl border shadow-sm ${
          isLive
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  isLive
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                {isLive ? (
                  <Radio size={25} />
                ) : (
                  <Video size={25} />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-500">
                    PeerLink Classroom
                  </p>

                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      LIVE NOW
                    </span>
                  )}
                </div>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {isLive
                    ? "Your classroom is live"
                    : "Ready for your live class?"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {isLive
                    ? "You and your peer can now work together inside PeerLink. Your shared notes and learning resources are available below."
                    : "Start a live classroom inside PeerLink when you are ready to begin learning together."}
                </p>

                {isLive &&
                  liveClass?.started_at && (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Started at{" "}
                      {formatLiveStartTime()}
                    </p>
                  )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              {liveClassLoading ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Checking classroom...
                </div>
              ) : isLive ? (
                <>
                  <button
                    type="button"
                    onClick={enterClassroom}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Play size={17} />
                    Enter Classroom
                  </button>

                  <button
                    type="button"
                    onClick={endLiveClass}
                    disabled={
                      liveClassActionLoading
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {liveClassActionLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Square size={15} />
                    )}
                    End Class
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startLiveClass}
                  disabled={
                    liveClassActionLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {liveClassActionLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play size={17} />
                      Start Live Class
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {liveClassMessage && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                liveClassMessage.includes(
                  "successfully"
                ) ||
                liveClassMessage.includes(
                  "now open"
                ) ||
                liveClassMessage.includes(
                  "ended"
                )
                  ? "bg-white text-emerald-700 ring-1 ring-emerald-100"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {liveClassMessage}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          LIVE CLASSROOM
          ===================================================== */}

      {classroomOpen && (
        <section className="session-hub-classroom fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#0b0f19] text-white">
          {/* Meeting top bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#111827] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold">
                P
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {offer?.topic || request.subject || "PeerLink Live"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live
                  </span>
                  <span>•</span>
                  <span>{liveParticipants.length || 1} participant{(liveParticipants.length || 1) !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={leaveClassroomView}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Minimize meeting"
            >
              <X size={18} />
            </button>
          </div>

          {/* Meeting stage */}
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
            {liveClassError && (
              <div className="mx-auto mb-3 max-w-5xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {liveClassError}
              </div>
            )}

            {isConnectingLiveClass ? (
              <div className="flex h-full min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <Loader2 size={34} className="mx-auto animate-spin text-indigo-400" />
                  <p className="mt-4 text-sm font-semibold">Joining PeerLink Live...</p>
                  <p className="mt-1 text-xs text-slate-400">Connecting your camera and microphone.</p>
                </div>
              </div>
            ) : liveParticipants.length === 0 ? (
              <div className="flex h-full min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <Video size={34} className="mx-auto text-slate-500" />
                  <p className="mt-4 text-sm font-semibold">Camera preview is loading...</p>
                </div>
              </div>
            ) : (
              (() => {
                const screenSharer = liveParticipants.find(
                  (participant) =>
                    participant?.getTrackPublication(
                      Track.Source.ScreenShare
                    )?.track
                );

                if (screenSharer) {
                  return (
                    <div className="mx-auto max-w-7xl space-y-3 sm:space-y-4">
                      <ScreenShareTile participant={screenSharer} />

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {liveParticipants.map((participant, index) => (
                          <LiveVideoTile
                            key={participant.identity || index}
                            participant={participant}
                            isLocal={
                              participant === liveRoom?.localParticipant
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    className={`mx-auto grid h-full max-w-7xl gap-3 sm:gap-4 ${
                      liveParticipants.length === 1
                        ? "grid-cols-1"
                        : liveParticipants.length === 2
                          ? "grid-cols-1 lg:grid-cols-2"
                          : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    }`}
                  >
                    {liveParticipants.map((participant, index) => (
                      <LiveVideoTile
                        key={participant.identity || index}
                        participant={participant}
                        isLocal={participant === liveRoom?.localParticipant}
                      />
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* Meeting controls */}
          <div className="shrink-0 border-t border-white/10 bg-[#111827] px-3 py-4 sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleMicrophone}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  isMicEnabled
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
                aria-label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  isCameraEnabled
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
                aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
              >
                {isCameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>

              <button
                type="button"
                onClick={flipCamera}
                disabled={isFlippingCamera || !isCameraEnabled}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
                aria-label={
                  isFrontCamera
                    ? "Switch to back camera"
                    : "Switch to front camera"
                }
                title={
                  isFrontCamera
                    ? "Show your surroundings (back camera)"
                    : "Switch back to front camera"
                }
              >
                {isFlippingCamera ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <SwitchCamera size={20} />
                )}
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                className={`hidden h-12 w-12 items-center justify-center rounded-full transition sm:flex sm:h-14 sm:w-14 ${
                  isScreenSharing
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-label={
                  isScreenSharing ? "Stop screen sharing" : "Share screen"
                }
                title={
                  isScreenSharing
                    ? "Stop sharing your screen"
                    : "Share your screen (great for notes and documents)"
                }
              >
                <MonitorUp size={20} />
              </button>

              <button
                type="button"
                onClick={() => openSidePanel("materials")}
                className={`hidden h-12 w-12 items-center justify-center rounded-full transition sm:flex sm:h-14 sm:w-14 ${
                  sidePanelOpen && sidePanelTab === "materials"
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-label="Open materials"
                title="View shared notes and resources"
              >
                <BookOpen size={20} />
              </button>

              <button
                type="button"
                onClick={() => openSidePanel("chat")}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  sidePanelOpen && sidePanelTab === "chat"
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-label="Open chat"
              >
                <MessageSquare size={20} />
              </button>

              <button
                type="button"
                onClick={leaveLiveCall}
                className="ml-1 flex h-12 min-w-14 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700 sm:h-14 sm:min-w-28"
              >
                <PhoneOff size={20} />
                <span className="hidden text-sm font-semibold sm:inline">Leave</span>
              </button>
            </div>
          </div>

          {sidePanelOpen && (
            <div className="fixed inset-x-0 bottom-0 z-[70] flex h-[78vh] flex-col border-t border-white/10 bg-[#111827] shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:h-auto sm:w-96 sm:border-l sm:border-t-0">
              {/* Panel header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setSidePanelTab("chat")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      sidePanelTab === "chat"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Chat
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidePanelTab("materials")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      sidePanelTab === "materials"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Materials
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeSidePanel}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat tab */}
              {sidePanelTab === "chat" && (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    {loadingChatMessages ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        <Loader2
                          size={17}
                          className="mr-2 animate-spin"
                        />
                        Loading chat...
                      </div>
                    ) : chatMessageError ? (
                      <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {chatMessageError}
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                        Say hi to get the conversation started.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((message) => {
                          const isMine =
                            message.sender_id === currentUserId;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isMine
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                                  isMine
                                    ? "rounded-br-sm bg-indigo-600 text-white"
                                    : "rounded-bl-sm bg-white/10 text-slate-100"
                                }`}
                              >
                                <p className="whitespace-pre-wrap leading-5">
                                  {message.message}
                                </p>
                                <p
                                  className={`mt-1 text-[10px] ${
                                    isMine
                                      ? "text-indigo-100"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {formatChatTime(
                                    message.created_at
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatMessagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-white/10 p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={chatMessageText}
                        onChange={(event) =>
                          setChatMessageText(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        rows={1}
                        placeholder="Message..."
                        className="min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                      />

                      <button
                        type="button"
                        onClick={sendChatMessage}
                        disabled={
                          sendingChatMessage ||
                          !chatMessageText.trim()
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Send"
                      >
                        {sendingChatMessage ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Materials tab */}
              {sidePanelTab === "materials" && (
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {loadingResources ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      <Loader2
                        size={17}
                        className="mr-2 animate-spin"
                      />
                      Loading materials...
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                      No resources uploaded for this session yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
                              {getResourceIcon(
                                resource.file_type
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {resource.file_name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {getFileExtension(
                                  resource.file_name
                                )}{" "}
                                ·{" "}
                                {formatFileSize(
                                  resource.file_size
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openResource(resource)
                              }
                              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                downloadResource(resource)
                              }
                              disabled={
                                downloadingResourceId ===
                                resource.id
                              }
                              className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                            >
                              {downloadingResourceId ===
                              resource.id
                                ? "..."
                                : "Download"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          OVERVIEW + MEETING
          ===================================================== */}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Overview */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-700">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isRequester
                  ? "Learning with"
                  : "Helping"}
              </p>

              <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                {otherStudent?.full_name ||
                  "PeerLink Student"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {otherStudent?.class_level ||
                  "Student"}
              </p>

              {otherStudent?.school && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {otherStudent.school}
                </p>
              )}
            </div>

            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700">
              <CheckCircle2 size={14} />
              {request.status}
            </span>
          </div>

          <div className="mt-7 rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <BookOpen
                size={18}
                className="text-indigo-600"
              />

              <span className="text-sm font-bold text-indigo-700">
                {offer?.subject ||
                  request.subject}
              </span>
            </div>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {offer?.topic ||
                "Peer Learning Session"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {offer?.description ||
                request.message}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <CalendarDays size={15} />
                Date
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {formatDate(
                  availability?.available_date
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Clock3 size={15} />
                Time
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {formatTime(
                  availability?.start_time
                )}{" "}
                –{" "}
                {formatTime(
                  availability?.end_time
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Learning request
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {request.message ||
                "No additional message."}
            </p>
          </div>

          <button
            type="button"
            onClick={openChat}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <MessageCircle size={17} />
            Open Conversation
          </button>

          <button
            type="button"
            onClick={copyInviteLink}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            {inviteCopied ? (
              <>
                <CheckCircle2 size={17} />
                Link Copied!
              </>
            ) : (
              <>
                <Users size={17} />
                Invite a Participant
              </>
            )}
          </button>
        </div>

        {/* Meeting Setup */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Video size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Meeting Setup
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Choose how you and your peer will meet.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {meetingMethods.map(
              (method) => {
                const selected =
                  meetingMethod ===
                  method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setMeetingMethod(
                        method.value
                      )
                    }
                    className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {selected ? (
                          <CheckCircle2
                            size={17}
                          />
                        ) : (
                          <Video size={17} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {method.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {meetingMethod !==
            "PeerLink" &&
            meetingMethod !==
              "In person" && (
              <div className="mt-5">
                <label className="text-sm font-semibold text-slate-700">
                  Meeting link
                </label>

                <input
                  type="url"
                  value={meetingLink}
                  onChange={(event) =>
                    setMeetingLink(
                      event.target.value
                    )
                  }
                  placeholder="https://meet.google.com/..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700">
              Session notes
            </label>

            <textarea
              value={meetingNotes}
              onChange={(event) =>
                setMeetingNotes(
                  event.target.value
                )
              }
              rows={5}
              placeholder="Add anything you both should remember about this session..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {saveMessage && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                saveMessage.includes(
                  "successfully"
                )
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {saveMessage}
            </div>
          )}

          <button
            type="button"
            onClick={saveMeetingDetails}
            disabled={savingMeeting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingMeeting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Meeting Details
              </>
            )}
          </button>
        </div>
      </section>

      {/* =====================================================
          SHARED NOTES
          ===================================================== */}

      <section
        id="shared-notes"
        className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Collaboration
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Shared Notes
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Keep useful explanations, reminders, and study
              notes together for this session.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={20} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-sm font-bold text-slate-800">
            Add a note
          </p>

          <input
            type="text"
            value={newNoteTitle}
            onChange={(event) =>
              setNewNoteTitle(
                event.target.value
              )
            }
            placeholder="Note title"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <textarea
            value={newNoteContent}
            onChange={(event) =>
              setNewNoteContent(
                event.target.value
              )
            }
            rows={4}
            placeholder="Write something useful about this session..."
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={createNote}
              disabled={savingNote}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingNote ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Note
                </>
              )}
            </button>
          </div>
        </div>

        {noteMessage && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              noteMessage.includes(
                "successfully"
              )
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {noteMessage}
          </div>
        )}

        <div className="mt-6">
          {loadingNotes ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2
                size={18}
                className="mr-3 animate-spin"
              />
              Loading shared notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-10 text-center">
              <FileText
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No shared notes yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Your first session note will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const isEditing =
                  editingNoteId ===
                  note.id;

                const isAuthor =
                  note.author_id ===
                  currentUserId;

                return (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={
                            editingNoteTitle
                          }
                          onChange={(event) =>
                            setEditingNoteTitle(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        />

                        <textarea
                          value={
                            editingNoteContent
                          }
                          onChange={(event) =>
                            setEditingNoteContent(
                              event.target
                                .value
                            )
                          }
                          rows={5}
                          className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={
                              cancelEditNote
                            }
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveEditedNote(
                                note.id
                              )
                            }
                            disabled={
                              savingNote
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {savingNote ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={15} />
                            )}
                            Save
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-900">
                              {note.title}
                            </h3>

                            <p className="mt-1 text-[11px] text-slate-400">
                              Updated{" "}
                              {new Date(
                                note.updated_at
                              ).toLocaleString()}
                            </p>
                          </div>

                          {isAuthor && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  beginEditNote(
                                    note
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Edit note"
                              >
                                <Pencil
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteNote(
                                    note.id
                                  )
                                }
                                disabled={
                                  deletingNoteId ===
                                  note.id
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                aria-label="Delete note"
                              >
                                {deletingNoteId ===
                                note.id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={15}
                                  />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {note.content}
                        </p>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          RESOURCES
          ===================================================== */}

      <section
        id="session-resources"
        className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Shared Learning Materials
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Session Resources
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Upload notes, textbooks, worksheets, presentations,
              or images that you want to use during the session.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Upload size={20} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">
          <label
            htmlFor="session-resource-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-white px-6 py-8 text-center transition hover:bg-indigo-50/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Upload size={22} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-800">
              Choose a study resource
            </p>

            <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
              PDF, DOC, DOCX, PPT, PPTX, JPG, JPEG, or PNG.
              Maximum 50 MB.
            </p>

            <span className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white">
              Browse Files
            </span>

            <input
              id="session-resource-upload"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
                  {getResourceIcon(
                    selectedFile.type
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedFile.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {getFileExtension(
                      selectedFile.name
                    )}{" "}
                    ·{" "}
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFile(null)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label="Remove selected file"
                >
                  <X size={17} />
                </button>
              </div>

              <button
                type="button"
                onClick={uploadResource}
                disabled={uploadingFile}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingFile ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload Resource
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {resourceMessage && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              resourceMessage.includes(
                "successfully"
              )
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {resourceMessage}
          </div>
        )}

        <div className="mt-6">
          {loadingResources ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2
                size={18}
                className="mr-3 animate-spin"
              />
              Loading session resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-10 text-center">
              <Upload
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No resources uploaded yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Upload your first study material for this session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(
                (resource) => {
                  const isUploader =
                    resource.uploader_id ===
                    currentUserId;

                  const isDownloading =
                    downloadingResourceId ===
                    resource.id;

                  return (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            {getResourceIcon(
                              resource.file_type
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {resource.file_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {getFileExtension(
                                resource.file_name
                              )}{" "}
                              ·{" "}
                              {formatFileSize(
                                resource.file_size
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openResource(
                                resource
                              )
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <ExternalLink
                              size={14}
                            />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              downloadResource(
                                resource
                              )
                            }
                            disabled={
                              isDownloading
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDownloading ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Download
                                size={14}
                              />
                            )}

                            {isDownloading
                              ? "Downloading..."
                              : "Download"}
                          </button>

                          {isUploader && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteResource(
                                  resource
                                )
                              }
                              disabled={
                                deletingResourceId ===
                                resource.id
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              aria-label="Delete resource"
                            >
                              {deletingResourceId ===
                              resource.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={15}
                                />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Download
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <p className="text-xs leading-5 text-slate-500">
            Session resources are private. Only the students
            participating in this session can open and download them.
          </p>
        </div>
      </section>

      {/* =====================================================
          RESOURCE VIEWER
          ===================================================== */}

      {viewingResource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Viewer Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {getResourceIcon(
                    viewingResource.file_type
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {viewingResource.file_name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {getFileExtension(
                      viewingResource.file_name
                    )}{" "}
                    ·{" "}
                    {formatFileSize(
                      viewingResource.file_size
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeResourceViewer
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close resource viewer"
              >
                <X size={19} />
              </button>
            </div>

            {/* Viewer Body */}
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
              {loadingResourceViewer ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Opening resource...
                  </div>
                </div>
              ) : isPreviewableResource(
                  viewingResource
                ) ? (
                <div className="flex h-full min-h-[500px] items-center justify-center">
                  {viewingResource.file_type ===
                  "application/pdf" ? (
                    <iframe
                      src={
                        viewingResourceUrl
                      }
                      title={
                        viewingResource.file_name
                      }
                      className="h-full min-h-[70vh] w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <img
                        src={
                          viewingResourceUrl
                        }
                        alt={
                          viewingResource.file_name
                        }
                        className="max-h-full max-w-full rounded-xl object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-full items-center justify-center">
                  <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <FileText size={28} />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900">
                      {viewingResource.file_name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      This file type cannot be previewed directly
                      inside the browser yet. You can download it
                      and open it with Microsoft Word or PowerPoint.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        downloadResource(
                          viewingResource
                        )
                      }
                      disabled={
                        downloadingResourceId ===
                        viewingResource.id
                      }
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingResourceId ===
                      viewingResource.id ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Download size={17} />
                      )}

                      {downloadingResourceId ===
                      viewingResource.id
                        ? "Downloading..."
                        : "Download File"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-400">
                Private session resource
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadResource(
                      viewingResource
                    )
                  }
                  disabled={
                    downloadingResourceId ===
                    viewingResource.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingResourceId ===
                  viewingResource.id ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Download size={15} />
                  )}

                  {downloadingResourceId ===
                  viewingResource.id
                    ? "Downloading..."
                    : "Download"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeResourceViewer
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionHub;