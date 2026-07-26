import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";

export function useMobileBackHandler() {
  const {
    selectedUser,
    setSelectedUser,
    isSettingsOpen,
    setSettingsOpen,
    isContactInfoOpen,
    setContactInfoOpen,
    isSearchOpen,
    setSearchOpen,
    isExitModalOpen,
    setExitModalOpen,
    activeTab,
    setActiveTab,
  } = useChatStore();

  const isInternalPushRef = useRef(false);

  // Initialize root history state & guard entry on initial mount
  useEffect(() => {
    try {
      if (!window.history.state || window.history.state.mhView !== "root_guard") {
        window.history.replaceState({ mhView: "root" }, "");
        window.history.pushState({ mhView: "root_guard" }, "");
      }
    } catch (e) {
      console.warn("History API init warning:", e);
    }
  }, []);

  // Sync selectedUser (Chat open) state with history
  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      if (window.history.state?.mhView !== "chat") {
        isInternalPushRef.current = true;
        window.history.pushState({ mhView: "chat", id: selectedUser._id }, "");
      }
    }
  }, [selectedUser?._id]);

  // Sync Settings Drawer state with history
  useEffect(() => {
    if (isSettingsOpen) {
      if (window.history.state?.mhView !== "settings") {
        isInternalPushRef.current = true;
        window.history.pushState({ mhView: "settings" }, "");
      }
    }
  }, [isSettingsOpen]);

  // Sync Contact Info Drawer state with history
  useEffect(() => {
    if (isContactInfoOpen) {
      if (window.history.state?.mhView !== "contactInfo") {
        isInternalPushRef.current = true;
        window.history.pushState({ mhView: "contactInfo" }, "");
      }
    }
  }, [isContactInfoOpen]);

  // Sync Search Panel state with history
  useEffect(() => {
    if (isSearchOpen) {
      if (window.history.state?.mhView !== "search") {
        isInternalPushRef.current = true;
        window.history.pushState({ mhView: "search" }, "");
      }
    }
  }, [isSearchOpen]);

  // Handle popstate (Physical Mobile Back Button / Gesture / Browser Back)
  useEffect(() => {
    const handlePopState = (event) => {
      const state = useChatStore.getState();

      // 0. If user explicitly clicked "Yes (Exit)", allow history back navigation to exit cleanly!
      if (state.isExiting) {
        return;
      }

      // 1. If Exit Modal is currently open, pressing Back closes the Exit Modal
      if (state.isExitModalOpen) {
        state.setExitModalOpen(false);
        window.history.pushState({ mhView: "root_guard" }, "");
        return;
      }

      // 2. Priority Level 1: Close top drawer / overlay panels
      if (state.isContactInfoOpen) {
        state.setContactInfoOpen(false);
        return;
      }

      if (state.isSearchOpen) {
        state.setSearchOpen(false);
        return;
      }

      if (state.isSettingsOpen) {
        state.setSettingsOpen(false);
        return;
      }

      // 3. Priority Level 2: Close Active Chat & Return to Contacts List
      if (state.selectedUser) {
        state.setSelectedUser(null);
        return;
      }

      // 4. Priority Level 3: Non-chat Tabs ("calls" or "updates") -> Return to "chats" tab
      if (state.activeTab !== "chats") {
        state.setActiveTab("chats");
        window.history.pushState({ mhView: "root_guard" }, "");
        return;
      }

      // 5. Priority Level 4: At Home Screen Root (Chat List, no active chat/modal)
      // Open Exit App Confirmation Dialog!
      state.setExitModalOpen(true);
      
      // Re-push root guard history state so the browser tab does not abruptly exit
      window.history.pushState({ mhView: "root_guard" }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
