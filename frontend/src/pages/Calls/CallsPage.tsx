import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCalls } from '../../api/calls';
import { Button, Card, Input, Select, Skeleton, StatusBadge, Tag } from '../../components/ui';
import { formatDate, formatDuration } from '../../utils/format';
import styles from './CallsPage.module.css';

const TOPIC_OPTIONS = [
  { value: 'Возврат',      label: 'Возврат' },
  { value: 'Жалоба',       label: 'Жалоба' },
  { value: 'Консультация', label: 'Консультация' },
  { value: 'Техподдержка', label: 'Техподдержка' },
];

export const CallsPage: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const newCallId = (location.state as { newCallId?: string } | null)?.newCallId;

  const [search,   setSearch]   = useState('');
  const [topic,    setTopic]    = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['calls', search, topic, dateFrom, dateTo],
    queryFn: () => getCalls({ search, topic, dateFrom, dateTo }),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some(c => c.status === 'processing' || c.status === 'queued') ? 5000 : false;
    },
  });

  return (
    <div>
      <Card>
        <div className={styles.toolbar}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Мои звонки</h1>
            <Button variant="primary" onClick={() => navigate('/calls/new')}>+ Загрузить</Button>
          </div>
          <div className={styles.filters}>
            <Input
              placeholder="Поиск по имени файла..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <Select
              options={TOPIC_OPTIONS}
              placeholder="Все темы"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className={styles.filterSelect}
            />
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="Дата от"
            />
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="Дата до"
            />
          </div>
        </div>

        <div className={styles.tableHead}>
          <span>Файл</span>
          <span>Дата</span>
          <span>Длительность</span>
          <span>Тема</span>
          <span>Статус</span>
        </div>

        {isLoading && (
          <div className={styles.skeletons}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width="60%" />
                <Skeleton width="80px" />
                <Skeleton width="50px" />
                <Skeleton width="70px" />
                <Skeleton width="80px" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className={styles.empty}>Звонки не найдены</div>
        )}

        {data?.items.map(call => (
          <div
            key={call.id}
            className={`${styles.tableRow} ${call.id === newCallId ? styles.highlight : ''}`}
            onClick={() => navigate(`/calls/${call.id}`)}
          >
            <span className={styles.filename}>{call.filename}</span>
            <span className={styles.secondary}>{formatDate(call.date)}</span>
            <span className={styles.secondary}>{formatDuration(call.duration)}</span>
            <span className={styles.tags}>
              {call.topics.map(t => <Tag key={t}>{t}</Tag>)}
            </span>
            <StatusBadge status={call.status} />
          </div>
        ))}
      </Card>
    </div>
  );
};
