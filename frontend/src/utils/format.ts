/** "2025-01-15T10:30:00Z" → "15.01.2025" */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** 272 → "4:32" */
export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** 7 → "0:07" */
export const formatTimestamp = (seconds: number): string => formatDuration(seconds);

const MAX_FILE_MB = 200;
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/m4a'];
const ALLOWED_EXT   = ['.mp3', '.wav', '.m4a'];

export const validateAudioFile = (file: File): string | null => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
    return `Недопустимый формат. Разрешены: ${ALLOWED_EXT.join(', ')}`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `Файл слишком большой. Максимум ${MAX_FILE_MB} МБ`;
  }
  return null;
};
