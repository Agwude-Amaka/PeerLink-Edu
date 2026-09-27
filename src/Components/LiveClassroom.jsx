import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

function LiveClassroom({
  token,
  serverUrl,
  onLeave,
}) {
  if (!token || !serverUrl) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">
            Live classroom isn't ready
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We couldn't connect to the live classroom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={onLeave}
        className="min-h-[650px]"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

export default LiveClassroom;