"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const BGM_SRC = "/audio/bgm.mp3";
const VOLUME = 0.25;

const ui = {
  musicOn: { en: "Music on", fil: "Musika on" },
  musicOff: { en: "Music off", fil: "Musika off" },
  tapForMusic: {
    en: "Tap to start music",
    fil: "I-tap para sa musika",
  },
};

export function BgmPlayer() {
  const { lang } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    audio.volume = VOLUME;
    try {
      await audio.play();
      setPlaying(true);
      setNeedsTap(false);
    } catch {
      setPlaying(false);
      setNeedsTap(true);
    }
  }, [enabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      audio.pause();
      setPlaying(false);
      return;
    }

    tryPlay();
  }, [enabled, tryPlay]);

  useEffect(() => {
    if (!needsTap || !enabled) return;

    const startOnInteraction = () => {
      tryPlay();
    };

    window.addEventListener("pointerdown", startOnInteraction, { once: true });
    window.addEventListener("keydown", startOnInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startOnInteraction);
      window.removeEventListener("keydown", startOnInteraction);
    };
  }, [needsTap, enabled, tryPlay]);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) queueMicrotask(() => tryPlay());
      return next;
    });
  };

  return (
    <>
      <audio ref={audioRef} src={BGM_SRC} loop preload="auto" playsInline />
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
          enabled && playing
            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
            : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
        }`}
        aria-pressed={enabled}
        title={enabled ? ui.musicOn[lang] : ui.musicOff[lang]}
      >
        <span aria-hidden>{enabled && playing ? "🎵" : "🔇"}</span>
        <span className="hidden sm:inline">
          {needsTap && enabled ? ui.tapForMusic[lang] : enabled ? ui.musicOn[lang] : ui.musicOff[lang]}
        </span>
      </button>
    </>
  );
}
