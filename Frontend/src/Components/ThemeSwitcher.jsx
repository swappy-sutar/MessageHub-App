import React, { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { Palette, Check } from "lucide-react";
import { THEMES } from "../constants/index";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-sm btn-ghost gap-2 border border-base-300 bg-base-100 hover:bg-base-200 text-base-content rounded-xl shadow-sm transition-all"
        title="Change App Theme"
      >
        <Palette className="size-4 text-primary" />
        <span className="text-xs font-semibold capitalize hidden sm:inline">
          {theme}
        </span>
      </button>

      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-base-100 border border-base-300 rounded-2xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto animate-fade-in-up space-y-1">
          <div className="p-2 border-b border-base-300 text-xs font-bold text-base-content flex items-center gap-2">
            <Palette className="size-3.5 text-primary" />
            Select Theme
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {THEMES.map((t) => {
              const isSelected = theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTheme(t);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-content font-bold shadow-sm"
                      : "hover:bg-base-200 text-base-content/80"
                  }`}
                  data-theme={t}
                >
                  <span className="capitalize truncate">
                    {t}
                  </span>
                  {isSelected && <Check className="size-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
