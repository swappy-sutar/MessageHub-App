import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

// WebCrypto helper functions
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const useE2EEStore = create((set, get) => ({
  identityKeyPair: null,
  signedPreKeyPair: null,
  isE2EEInitialized: false,

  initE2EE: async () => {
    if (get().isE2EEInitialized) return;

    try {
      // 1. Generate Identity Key Pair (ECDH P-256)
      const identityKeyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );

      // 2. Export Public Identity Key
      const rawIdentityPubKey = await window.crypto.subtle.exportKey(
        "spki",
        identityKeyPair.publicKey
      );
      const identityPublicKey = arrayBufferToBase64(rawIdentityPubKey);

      // 3. Generate Signed Pre-Key Pair
      const signedPreKeyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );
      const rawSignedPub = await window.crypto.subtle.exportKey(
        "spki",
        signedPreKeyPair.publicKey
      );
      const signedPreKey = {
        keyId: 1,
        publicKey: arrayBufferToBase64(rawSignedPub),
        signature: "sig-p256-ok",
      };

      // 4. Upload PreKey Bundle to Server
      const token = Cookies.get("token");
      await axiosInstance.post(
        "/e2ee/keys",
        {
          identityPublicKey,
          signedPreKey,
          oneTimePreKeys: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      set({
        identityKeyPair,
        signedPreKeyPair,
        isE2EEInitialized: true,
      });

      console.log("🔒 E2EE WebCrypto engine initialized");
    } catch (error) {
      console.warn("E2EE WebCrypto init error:", error.message);
    }
  },

  fetchPeerBundle: async (peerUserId) => {
    try {
      const token = Cookies.get("token");
      const res = await axiosInstance.get(`/e2ee/bundle/${peerUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return res.data.data;
    } catch (error) {
      console.warn("Failed to fetch peer E2EE bundle:", error.message);
      return null;
    }
  },
}));
