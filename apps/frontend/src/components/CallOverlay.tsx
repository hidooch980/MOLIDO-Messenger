import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCall } from "../call/CallContext.js";
import { Avatar } from "./Avatar.js";
import { Icon } from "./Icon.js";

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
          <span className="call-avatar-ring ringing">
            <Avatar name={peer.username} size={72} />
          </span>
          <p>{t(peer.video ? "incoming_video_call" : "incoming_call", { name: peer.username })}</p>
          <div className="call-actions">
            <button type="button" className="icon-button primary round" onClick={acceptCall} title={t("accept")}>
              <Icon name="phone" size={20} />
            </button>
            <button type="button" className="icon-button danger round" onClick={declineCall} title={t("decline")}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      )}

      {state === "outgoing" && peer && (
        <div className="call-card">
          <span className="call-avatar-ring pulsing">
            <Avatar name={peer.username} size={72} />
          </span>
          <p>{t("calling", { name: peer.username })}</p>
          <button type="button" className="icon-button danger round" onClick={endCall} title={t("end_call")}>
            <Icon name="close" size={20} />
          </button>
        </div>
      )}

      {state === "active" && peer && (
        <div className="call-card call-active">
          {!peer.video && <Avatar name={peer.username} size={72} />}
          <p>{peer.username}</p>
          {peer.video && (
            <div className="call-videos">
              <VideoTag stream={remoteStream} muted={false} />
              <VideoTag stream={localStream} muted />
            </div>
          )}
          {!remoteStream && <p className="call-status">{t("connecting")}</p>}
          <button type="button" className="icon-button danger round" onClick={endCall} title={t("end_call")}>
            <Icon name="close" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
