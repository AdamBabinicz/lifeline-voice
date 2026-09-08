"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const toggleVisibility = () => {
      // Przycisk pojawia się po przewinięciu o 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const handleScroll = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleScroll}
      aria-label={t.btn_scroll_top}
      className={cn(
        // POZYCJONOWANIE
        "fixed bottom-6 left-6 z-50",
        "flex items-center justify-center",
        "w-14 h-14 cursor-pointer",

        // SWISS-BRUTALIST BASE
        "rounded-none border-4 transition-all duration-150",
        "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",

        // DYNAMIKA MOTYWU (Tailwind v4)
        resolvedTheme === "dark"
          ? "bg-zinc-950 text-white border-white shadow-[6px_6px_0px_0px_#ffffff] hover:bg-zinc-900"
          : "bg-white text-black border-black shadow-[6px_6px_0px_0px_#000000] hover:bg-zinc-100",
      )}
    >
      <ChevronUp className="w-8 h-8 stroke-[4px]" />
    </button>
  );
}
