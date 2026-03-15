import type { CallDetail } from '../types';
import { apiClient } from './client';

export const getCall = (id: string) =>
  apiClient.get<CallDetail>(`/calls/${id}`).then(r => r.data);
