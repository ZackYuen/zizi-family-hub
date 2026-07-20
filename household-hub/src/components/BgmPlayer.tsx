"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const BGM_SRC = "/audio/bgm.mp3";
const VOLUME = 0.12;

const ui = {
  musicOn: { en: "Music on", fil: "Musika on", zh: "音樂開" },
  musicOff: { en: "Music off", fil: "Musika off", zh: "音樂關" },
  tapForMusic: {
    en: "Tap to start music",
    fil: "I-tap para sa musika",
    zh: "點一下開始音樂",
  },
};

export function BgmPlayer() {
  const { lang } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(true);
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  enabledRef.current = enabled;

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabledRef.current) return;
    audio.loop = true;
    audio.volume = VOLUME;
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      setPlaying(true);
      setNeedsTap(false);
    } catch {
      setPlaying(false);
      setNeedsTap(true);
    }
  }, []);

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
    const audio = audioRef.current;
    if (!audio) return;

    const resumeIfNeeded = () => {
      if (enabledRef.current && (audio.paused || audio.ended)) {
        tryPlay();
      }
    };

    audio.addEventListener("ended", resumeIfNeeded);
    const watchdog = window.setInterval(resumeIfNeeded, 3000);

    return () => {
      audio.removeEventListener("ended", resumeIfNeeded);
      window.clearInterval(watchdog);
    };
  }, [tryPlay]);

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
      enabledRef.current = next;
      if (next) queueMicrotask(() => tryPlay());
      else audioRef.current?.pause();
      return next;
    });
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={BGM_SRC}
        loop
        preload="auto"
        playsInline
      />
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
