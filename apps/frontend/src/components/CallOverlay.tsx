import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCall } from "../call/CallContext.js";

function VideoTag({ stream, muted }: { stream: MediaStream | null; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className="call-video" />;
}

export function CallOverlay() {
  const { t } = useTranslation(["calls", "common"]);
  const { state, peer, localStream, remoteStream, error, lastPeerUsername, acceptCall, declineCall, endCall } = useCall();

  if (state === "idle") {
    return error ? (
      <div className="call-toast">
        {t(error === "declined" ? "declined" : "unsupported", { name: lastPeerUsername })}
      </div>
    ) : null;
  }

  return (
    <div className="call-overlay">
      {state === "incoming" && peer && (
        <div className="call-card">
          <p>{t(peer.video ? "incoming_video_call" : "incoming_call", { name: peer.username })}</p>
          <div className="call-actions">
            <button type="button" className="primary" onClick={acceptCall}>
              {t("accept")}
            </button>
            <button type="button" className="secondary" onClick={declineCall}>
              {t("decline")}
            </button>
          </div>
        </div>
      )}

      {state === "outgoing" && peer && (
        <div className="call-card">
          <p>{t("calling", { name: peer.username })}</p>
          <button type="button" className="secondary" onClick={endCall}>
            {t("end_call")}
          </button>
        </div>
      )}

      {state === "active" && peer && (
        <div className="call-card call-active">
          <p>{peer.username}</p>
          {peer.video && (
            <div className="call-videos">
              <VideoTag stream={remoteStream} muted={false} />
              <VideoTag stream={localStream} muted />
            </div>
          )}
          {!remoteStream && <p className="call-status">{t("connecting")}</p>}
          <button type="button" className="secondary" onClick={endCall}>
            {t("end_call")}
          </button>
        </div>
      )}
    </div>
  );
}
