import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCall } from '../../api/callCard';
import { Button, Card, Skeleton, Tag } from '../../components/ui';
import { formatDate, formatDuration, formatTimestamp } from '../../utils/format';
import { AudioPlayer } from './AudioPlayer';
import styles from './CallCardPage.module.css';

export const CallCardPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [activeTime, setActiveTime] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['call', id],
    queryFn: () => getCall(id!),
    enabled: !!id,
  });

  if (isError) {
    return (
      <Card>
        <div className={styles.state}>
          Не удалось загрузить звонок.{' '}
          <button className={styles.retryLink} onClick={() => navigate('/calls')}>
            Вернуться к списку
          </button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className={styles.header}>
          <div style={{ flex: 1 }}>
            <Skeleton width="40%" height="18px" style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height="13px" />
          </div>
        </div>
        <div className={styles.metrics}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.metric}>
              <Skeleton width="50px" height="22px" style={{ marginBottom: 6 }} />
              <Skeleton width="80px" height="12px" />
            </div>
          ))}
        </div>
        <Skeleton height="48px" style={{ marginBottom: '1rem' }} />
        <div className={styles.body}>
          <div className={styles.leftPanel}>
            <Skeleton width="30%" height="13px" style={{ marginBottom: 10 }} />
            <Skeleton width="90%" height="40px" style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height="80px" />
          </div>
          <div className={styles.rightPanel}>
            <Skeleton width="30%" height="13px" style={{ marginBottom: 10 }} />
            {[1, 2, 3].map(i => <Skeleton key={i} width="70%" height="36px" style={{ marginBottom: 8 }} />)}
          </div>
        </div>
      </Card>
    );
  }

  const visibleReplicas = showAll ? data!.replicas : data!.replicas.slice(0, 3);
  const hiddenCount = data!.replicas.length - 3;

  const pluralize = (n: number) => n === 1 ? 'реплика' : n < 5 ? 'реплики' : 'реплик';

  return (
    <Card>
      <div className={styles.header}>
        <div>
          <div className={styles.filename}>{data!.filename}</div>
          <div className={styles.meta}>
            {formatDate(data!.date)} · {formatDuration(data!.duration)} · Оператор: {data!.operator ?? '—'}
          </div>
        </div>
        <Button onClick={() => navigate('/calls')}>← Назад</Button>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricVal}>{formatDuration(data!.duration)}</div>
          <div className={styles.metricLbl}>Длительность</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricVal}>{data!.topics.length}</div>
          <div className={styles.metricLbl}>Темы</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricVal}>{data!.replicaCount}</div>
          <div className={styles.metricLbl}>Реплики</div>
        </div>
      </div>

      <AudioPlayer
        src={data!.audioUrl}
        durationSec={data!.duration}
        onTimeUpdate={setActiveTime}
      />

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.leftPanel}>
          <div className={styles.sectionTitle}>Темы разговора</div>
          <div className={styles.tags}>
            {data!.topics.map(t => <Tag key={t}>{t}</Tag>)}
          </div>

          <hr className={styles.divider} />

          <div className={styles.sectionTitle}>Саммари</div>
          <p className={styles.summary}>{data!.summary}</p>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.sectionTitle}>Транскрипция</div>
          <div className={styles.transcript}>
            {visibleReplicas.map((r, i) => {
              const isActive = data!.audioUrl
                ? activeTime >= r.timestamp && (i + 1 >= data!.replicas.length || activeTime < data!.replicas[i + 1].timestamp)
                : false;
              return (
                <div key={i} className={`${styles.replicaWrap} ${r.role === 'client' ? styles.replicaRight : ''}`}>
                  <div className={styles.replicaMeta}>
                    {r.role === 'operator' ? 'Оператор' : 'Клиент'} · {formatTimestamp(r.timestamp)}
                  </div>
                  <div className={`${styles.replica} ${r.role === 'client' ? styles.replicaClient : styles.replicaOp} ${isActive ? styles.replicaActive : ''}`}>
                    {r.text}
                  </div>
                </div>
              );
            })}

            {!showAll && hiddenCount > 0 && (
              <div className={styles.showMore}>
                <button className={styles.showMoreBtn} onClick={() => setShowAll(true)}>
                  · · · ещё {hiddenCount} {pluralize(hiddenCount)} · · ·
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
