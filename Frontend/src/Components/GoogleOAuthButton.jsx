import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const GoogleOAuthButton = () => {
  const { googleLogin } = useAuthStore();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response) => {
    if (response?.credential) {
      await googleLogin({ credential: response.credential });
    }
  };

  useEffect(() => {
    if (!googleClientId || googleClientId.includes("your_google_client_id")) {
      return;
    }

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });

          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = "";
            window.google.accounts.id.renderButton(btnContainer, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              shape: "pill",
              width: "100%",
            });
          }
        } catch (err) {
          console.warn("Google GSI initialization notice:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      window.addEventListener("load", initGoogleGSI);
      return () => window.removeEventListener("load", initGoogleGSI);
    }
  }, [googleClientId]);

  const handleManualGoogleClick = () => {
    if (window.google?.accounts?.id && googleClientId && !googleClientId.includes("your_google_client_id")) {
      window.google.accounts.id.prompt();
    } else {
      // Automatic dev fallback payload when client ID is placeholder
      const devGoogleMockUser = {
        googleId: `google_${Date.now()}`,
        email: "google.user@gmail.com",
        firstName: "Google",
        lastName: "User",
        profilePic: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      };
      googleLogin(devGoogleMockUser);
    }
  };

  return (
    <div className="w-full">
      {/* Official Google GSI Render Container */}
      <div id="google-signin-btn-container" className="w-full min-h-[42px] hidden" />

      {/* Styled Google OAuth Button matching exact screenshot */}
      <button
        type="button"
        onClick={handleManualGoogleClick}
        className="w-full py-2.5 px-6 rounded-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/90 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 font-medium text-sm cursor-pointer select-none group active:scale-[0.99]"
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
        <span className="text-gray-700 font-semibold tracking-wide">
          Sign in with Google
        </span>
      </button>
    </div>
  );
};

export default GoogleOAuthButton;
