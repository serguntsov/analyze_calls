import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>Анализ звонков</span>
        {user && (
          <div className={styles.userArea}>
            <span className={styles.userName}>{user.name}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
          </div>
        )}
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
