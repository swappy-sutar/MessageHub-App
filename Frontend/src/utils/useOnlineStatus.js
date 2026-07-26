// src/hooks/useOnlineStatus.js
import { useState, useEffect } from "react";
import toast from "./toast.js";

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online 🚀");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("No internet connection 😢");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
