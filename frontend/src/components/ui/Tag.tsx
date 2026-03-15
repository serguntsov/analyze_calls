import React from 'react';
import styles from './Tag.module.css';

interface TagProps {
  children: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({ children }) => {
  return <span className={styles.tag}>{children}</span>;
};
