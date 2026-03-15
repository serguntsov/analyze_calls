export type CallStatus = 'done' | 'processing' | 'queued';

export interface Call {
  id: string;
  filename: string;
  date: string;       // ISO 8601: "2025-01-15T10:30:00Z"
  duration: number;   // seconds
  topics: string[];
  status: CallStatus;
  operator?: string;
}

export interface Replica {
  role: 'operator' | 'client';
  text: string;
  timestamp: number;  // seconds from start
}

export interface CallDetail extends Call {
  summary: string;
  replicaCount: number;
  replicas: Replica[];
  audioUrl?: string;  // presigned URL or relative path
}

export interface CallsResponse {
  items: Call[];
  total: number;
}

export interface User {
  id: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
