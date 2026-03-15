import type { Call, CallsResponse } from '../types';
import { apiClient } from './client';

export interface CallsParams {
  search?: string;
  topic?: string;
  dateFrom?: string;  // ISO date "2025-01-01"
  dateTo?: string;    // ISO date "2025-01-31"
  page?: number;
  limit?: number;
}

export const getCalls = (params: CallsParams = {}) =>
  apiClient.get<CallsResponse>('/calls', { params }).then(r => r.data);

export const uploadCall = (
  file: File,
  language: string,
  operator: string,
  onProgress?: (pct: number) => void,
) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('language', language);
  fd.append('operator', operator);
  return apiClient.post<Call>('/calls/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  }).then(r => r.data);
};
