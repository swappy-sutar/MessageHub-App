import React from "react";
import { LogOut, AlertCircle, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ExitAppModal = () => {
  const { isExitModalOpen, setExitModalOpen } = useChatStore();

  if (!isExitModalOpen) return null;

  const handleConfirmExit = () => {
    // 1. Mark app state as exiting so useMobileBackHandler allows back navigation
    useChatStore.getState().setExiting(true);
    setExitModalOpen(false);
    
    // 2. Native Cordova / Capacitor Mobile App exit
    try {
      if (window.navigator?.app?.exitApp) {
        window.navigator.app.exitApp();
        return;
      }
    } catch (err) {}

    // 3. Standard Window Close (for PWAs, WebViews, popups, standalone tabs)
    try {
      window.close();
    } catch (err) {}

    // 4. Browser History Exit: Step out of the app's history stack to return to home/blank
    try {
      window.history.go(-10);
    } catch (err) {
      try {
        window.history.back();
      } catch (e) {}
    }
  };

  return (
    <div
      onClick={() => setExitModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 border border-base-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 font-sans text-base-content transition-colors duration-300 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 size-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setExitModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/40 hover:text-base-content hover:bg-base-200 transition-colors"
          title="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-error/15 text-error flex items-center justify-center flex-shrink-0 ring-4 ring-error/10">
            <LogOut className="size-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-base-content leading-tight">
              Exit MessageHub?
            </h3>
            <p className="text-xs text-base-content/60 font-medium mt-0.5">
              Confirm closing application
            </p>
          </div>
        </div>

        {/* Description Body */}
        <div className="p-3.5 rounded-2xl bg-base-200/60 border border-base-300/50 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-base-content/50 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-base-content/80 leading-relaxed font-normal">
            Do you want to close this app? You will return to your home screen or browser.
          </p>
        </div>

        {/* Options / Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setExitModalOpen(false)}
            className="flex-1 btn btn-md btn-ghost border border-base-300 rounded-2xl text-xs font-semibold hover:bg-base-200 transition-all"
          >
            No (Cancel)
          </button>
          <button
            type="button"
            onClick={handleConfirmExit}
            className="flex-1 btn btn-md btn-error text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            Yes (Exit)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitAppModal;
