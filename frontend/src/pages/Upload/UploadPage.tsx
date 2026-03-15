import { useMutation } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadCall } from '../../api/calls';
import { Button, Card, Input, Select } from '../../components/ui';
import { validateAudioFile } from '../../utils/format';
import styles from './UploadPage.module.css';

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export const UploadPage: React.FC = () => {
  const navigate  = useNavigate();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [file,       setFile]       = useState<File | null>(null);
  const [fileError,  setFileError]  = useState('');
  const [language,   setLanguage]   = useState('ru');
  const [operator,   setOperator]   = useState('');
  const [dragging,   setDragging]   = useState(false);
  const [progress,   setProgress]   = useState(0);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => uploadCall(file!, language, operator, setProgress),
    onSuccess: (newCall) => {
      navigate('/calls', { state: { newCallId: newCall.id } });
    },
    onError: () => setProgress(0),
  });

  const applyFile = (f: File) => {
    const err = validateAudioFile(f);
    if (err) { setFileError(err); return; }
    setFileError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) applyFile(chosen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setProgress(0);
    mutate();
  };

  return (
    <div className={styles.page}>
      <Card>
        <div className={styles.pageTitle}>Новый звонок</div>
        <form onSubmit={handleSubmit}>

          <div
            className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className={styles.uploadIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 5l3-3 3 3M3 12h10" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            {file ? (
              <>
                <div className={styles.dropTitle}>{file.name}</div>
                <div className={styles.dropSub}>{(file.size / 1024 / 1024).toFixed(1)} МБ</div>
                <button type="button" className={styles.changeBtn} onClick={() => { setFile(null); setProgress(0); }}>
                  Изменить файл
                </button>
              </>
            ) : (
              <>
                <div className={styles.dropTitle}>Перетащите аудиофайл сюда</div>
                <div className={styles.dropSub}>MP3, WAV, M4A — до 200 МБ</div>
                <Button type="button" onClick={() => fileRef.current?.click()}>Выбрать файл</Button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.wav,.m4a"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {fileError && <div className={styles.error}>{fileError}</div>}

          {isPending && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              <span className={styles.progressLabel}>{progress}%</span>
            </div>
          )}

          <hr className={styles.divider} />

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Язык записи</label>
            <Select
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className={styles.fieldSelect}
            />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Имя оператора</label>
            <Input
              placeholder="Введите имя..."
              value={operator}
              onChange={e => setOperator(e.target.value)}
              className={styles.fieldInput}
            />
          </div>

          {isError && <div className={styles.error}>Ошибка загрузки. Попробуйте ещё раз.</div>}

          <hr className={styles.divider} />

          <div className={styles.actions}>
            <Button type="button" onClick={() => navigate('/calls')}>Отмена</Button>
            <Button type="submit" variant="primary" disabled={!file || isPending || !!fileError}>
              {isPending ? `Загрузка ${progress}%...` : 'Запустить анализ'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
