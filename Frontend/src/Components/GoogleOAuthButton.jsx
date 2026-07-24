import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const GoogleOAuthButton = () => {
  const { googleLogin } = useAuthStore();
  const [isGsiRendered, setIsGsiRendered] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response) => {
    if (response?.credential) {
      await googleLogin({ credential: response.credential });
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = "";
            window.google.accounts.id.renderButton(btnContainer, {
              type: "standard",
              theme: "filled_blue",
              size: "large",
              text: "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 320,
            });
            setIsGsiRendered(true);
          }
        } catch (err) {
          console.warn("Google GSI initialization notice:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleGSI();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const handleManualGoogleClick = () => {
    if (!googleClientId) {
      toast.error("VITE_GOOGLE_CLIENT_ID is missing in your .env file.");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.prompt();
    } else {
      toast.error("Google Sign-In library is loading. Please try again in a moment.");
    }
  };

  return (
    <div className="w-full flex justify-center items-center min-h-[44px]">
      {/* Official Google Native Render Container */}
      <div
        id="google-signin-btn-container"
        className={`w-full flex justify-center items-center min-h-[44px] rounded-2xl overflow-hidden bg-transparent ${
          isGsiRendered ? "flex" : "hidden"
        }`}
      />

      {/* Styled Fallback Google OAuth Button */}
      {!isGsiRendered && (
        <button
          type="button"
          onClick={handleManualGoogleClick}
          className="w-full py-3 px-6 rounded-2xl bg-base-200 hover:bg-base-300 text-base-content border border-base-300/80 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 font-semibold text-sm cursor-pointer select-none group active:scale-[0.98]"
        >
          {/* Official Google 4-Color "G" SVG Icon */}
          <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-semibold tracking-wide">
            Sign in with Google
          </span>
        </button>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
