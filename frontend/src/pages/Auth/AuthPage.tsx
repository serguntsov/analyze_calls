import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../api/auth';
import { Button, Card, Input } from '../../components/ui';
import { useAuth } from '../../store/authStore';
import styles from './AuthPage.module.css';

type Tab = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [tab,      setTab]      = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login: saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError('');
    setConfirm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' && password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (tab === 'register' && password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      const fn   = tab === 'login' ? login : register;
      const data = await fn(username, password);
      saveAuth(data.token, data.user);
      navigate('/calls');
    } catch {
      setError(tab === 'login' ? 'Неверный логин или пароль' : 'Ошибка регистрации. Попробуйте другой логин.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>Платформа анализа звонков</div>
          <div className={styles.subtitle}>Войдите или создайте аккаунт</div>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Войти
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('register')}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            placeholder="Логин"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            required
            style={{ marginTop: 10 }}
          />
          {tab === 'register' && (
            <Input
              type="password"
              placeholder="Повторите пароль"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              style={{ marginTop: 10 }}
            />
          )}
          {error && <div className={styles.error}>{error}</div>}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 14 }}
          >
            {loading ? 'Загрузка...' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
