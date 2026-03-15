import React from 'react';
import type { CallStatus } from '../../types';
import styles from './StatusBadge.module.css';

const LABELS: Record<CallStatus, string> = {
  done: 'Готово',
  processing: 'Обработка',
  queued: 'В очереди',
};

interface StatusBadgeProps {
  status: CallStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dot} ${styles[status]}`} />
      <span className={styles.label}>{LABELS[status]}</span>
    </span>
  );
};
