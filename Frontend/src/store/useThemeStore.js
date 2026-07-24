import { create } from "zustand";

const initialTheme = localStorage.getItem("chat-theme") || "coffee";
const initialWallpaper = localStorage.getItem("chat-wallpaper") || "default";
const initialShowDoodles = localStorage.getItem("chat-doodles") !== "false";

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", initialTheme);
}

export const WALLPAPER_COLORS = [
  { id: "default", name: "App Theme", color: "default" },
  { id: "soft-cream", name: "Soft cream", color: "#f7f4eb" },
  { id: "light-sage", name: "Light sage", color: "#e8f0ec" },
  { id: "pastel-sky", name: "Pastel sky", color: "#e6f0fa" },
  { id: "rose-tint", name: "Rose tint", color: "#faecef" },
  { id: "lavender", name: "Lavender", color: "#f0ebfa" },
  { id: "dark-teal", name: "Dark teal", color: "#0d2026" },
  { id: "forest-green", name: "Forest green", color: "#0d261e" },
  { id: "deep-navy", name: "Deep navy", color: "#0b172a" },
  { id: "burgundy", name: "Burgundy", color: "#260d15" },
  { id: "chocolate", name: "Chocolate", color: "#1f140e" },
  { id: "slate", name: "Slate", color: "#1e222a" },
  { id: "midnight", name: "Midnight", color: "#14142b" },
  { id: "espresso", name: "Espresso", color: "#181210" },
  { id: "eggplant", name: "Eggplant", color: "#1a0d26" },
  { id: "black-russian", name: "Black russian", color: "#0f0f11" },
];

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  wallpaper: initialWallpaper,
  showDoodles: initialShowDoodles,

  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    set({ theme });
  },

  setWallpaper: (wallpaper) => {
    localStorage.setItem("chat-wallpaper", wallpaper);
    set({ wallpaper });
  },

  setShowDoodles: (showDoodles) => {
    localStorage.setItem("chat-doodles", String(showDoodles));
    set({ showDoodles });
  },
}));

export default useThemeStore;