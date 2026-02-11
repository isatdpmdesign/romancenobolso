import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

const TIMEUPDATE_THROTTLE_MS = 250;

export default function AudioPlayer({ audioUrl, chapterTitle, onAudioEnded, hasNextChapter }) {
  const audioRef = useRef(null);
  const throttleRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const shouldAutoplay = urlParams.get('autoplay') === 'true';

  useEffect(() => {
    if (shouldAutoplay && audioRef.current) {
      setIsExpanded(true);
      const playWhenReady = () => {
        audioRef.current?.play().catch(() => {});
      };
      if (audioRef.current.readyState >= 2) {
        playWhenReady();
      } else {
        audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
      }
    }
  }, [shouldAutoplay, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const updateDuration = () => setDuration(audio.duration);

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - throttleRef.current >= TIMEUPDATE_THROTTLE_MS) {
        throttleRef.current = now;
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (autoPlay && hasNextChapter && typeof onAudioEnded === 'function') {
        onAudioEnded();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);

    if (!isNaN(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay, hasNextChapter, onAudioEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleVolumeInput = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skip = (seconds) => {
    if (audioRef.current && duration > 0) {
      const next = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="mb-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {!isExpanded ? (
        <Card
          className="bg-gradient-to-r from-[#3065DF]/10 to-[#FF0864]/10 dark:from-[#3065DF]/20 dark:to-[#FF0864]/20 border-[#3065DF]/20 p-4 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3065DF] to-[#FF0864] rounded-full flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white">🎧 Prefere ouvir?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Este capítulo está disponível em áudio</p>
            </div>
            <Button className="bg-[#3065DF] hover:bg-[#1E4BB8] text-white shrink-0">
              <Play className="w-4 h-4 mr-2" />
              Ouvir
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-[#3065DF] to-[#FF0864] text-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/80">Audiobook</p>
                <p className="font-semibold truncate">{chapterTitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (audioRef.current && isPlaying) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
                setIsExpanded(false);
              }}
              className="text-white hover:bg-white/20 shrink-0"
            >
              Minimizar
            </Button>
          </div>

          <div className="mb-4">
            <div
              className="relative w-full h-2 bg-white/30 rounded-full overflow-hidden cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-[width] duration-150"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-[left] duration-150"
                style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 8px)` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button variant="ghost" size="icon" onClick={() => skip(-15)} className="text-white hover:bg-white/20">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white text-[#3065DF] hover:bg-white/90 shrink-0"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(15)} className="text-white hover:bg-white/20">
              <SkipForward className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeInput}
                className="w-20 h-2 accent-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="w-4 h-4 rounded accent-white"
              />
              <span className="text-sm text-white/90">
                Reprodução contínua {hasNextChapter ? '(próximo capítulo ao terminar)' : ''}
              </span>
            </label>
          </div>
        </Card>
      )}
    </div>
  );
}
