import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "../socket/SocketContext.js";

/** Yahoo Messenger's window-shake-on-buzz, reimagined as a self-dismissing toast. */
export function NudgeToast() {
  const { t } = useTranslation("friends");
  const { lastNudge, dismissNudge } = useSocket();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!lastNudge) return;
    setShake(true);
    const shakeTimer = setTimeout(() => setShake(false), 600);
    const dismissTimer = setTimeout(dismissNudge, 4000);
    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(dismissTimer);
    };
  }, [lastNudge, dismissNudge]);

  if (!lastNudge) return null;

  return (
    <div className={`nudge-toast${shake ? " shake" : ""}`} role="alert">
      {t("nudge_received", { name: lastNudge.fromUsername })}
    </div>
  );
}
