import React, { useEffect, useRef, useState } from 'react';
import { formatTimestamp } from '../../utils/format';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  src?: string;
  durationSec?: number;
  onTimeUpdate?: (sec: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, durationSec = 0, onTimeUpdate }) => {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing,  setPlaying]  = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(durationSec);

  // Sync duration from props when no real audio
  useEffect(() => { setDuration(durationSec); }, [durationSec]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
    setPlaying(p => !p);
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;
    setCurrent(el.currentTime);
    onTimeUpdate?.(el.currentTime);
  };

  const handleLoadedMetadata = () => {
    const el = audioRef.current;
    if (el && el.duration && isFinite(el.duration)) setDuration(el.duration);
  };

  const handleEnded = () => setPlaying(false);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el   = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    setCurrent(newTime);
    if (el) el.currentTime = newTime;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={styles.player}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      <button
        className={styles.playBtn}
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
        title={!src ? 'Аудио недоступно' : undefined}
      >
        {playing ? (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--color-text-primary)">
            <rect x="1" y="1" width="3" height="10" rx="1"/>
            <rect x="6" y="1" width="3" height="10" rx="1"/>
          </svg>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--color-text-primary)">
            <path d="M1 1l8 5-8 5V1z"/>
          </svg>
        )}
      </button>

      <div className={styles.progress} onClick={handleProgressClick}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <span className={styles.timeLabel}>
        {formatTimestamp(Math.floor(current))} / {formatTimestamp(Math.floor(duration))}
      </span>
    </div>
  );
};
