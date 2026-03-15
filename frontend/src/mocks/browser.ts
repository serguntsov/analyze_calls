import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { callsHandlers } from './handlers/calls';

export const worker = setupWorker(...authHandlers, ...callsHandlers);
