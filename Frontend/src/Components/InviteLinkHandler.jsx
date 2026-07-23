import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";

const InviteLinkHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser, isCheckingAuth } = useAuthStore();
  const { sendInviteByCode } = useFriendStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isCheckingAuth) return;

    const codeFromUrl = searchParams.get("code") || searchParams.get("invite");
    const codeFromStorage = sessionStorage.getItem("pending_invite_code");

    const inviteCodeToUse = codeFromUrl || codeFromStorage;

    if (!inviteCodeToUse) return;

    if (authUser) {
      // Clear storage and query string
      sessionStorage.removeItem("pending_invite_code");
      if (codeFromUrl) {
        searchParams.delete("code");
        searchParams.delete("invite");
        setSearchParams(searchParams);
      }

      // Automatically send invite connection by code
      toast.promise(
        sendInviteByCode(inviteCodeToUse),
        {
          loading: `Connecting via invite link (${inviteCodeToUse})...`,
          success: "Invite request sent successfully!",
          error: (err) => err?.message || "Could not process invite link",
        }
      );
    } else {
      // User not logged in -> store code and redirect to signup
      if (codeFromUrl) {
        sessionStorage.setItem("pending_invite_code", codeFromUrl);
        toast("🎉 You opened an invite link! Sign up or Log in to connect automatically.", {
          duration: 6000,
          icon: "✨",
        });
        navigate("/signup");
      }
    }
  }, [authUser, isCheckingAuth, searchParams, setSearchParams, sendInviteByCode, navigate]);

  return null;
};

export default InviteLinkHandler;
