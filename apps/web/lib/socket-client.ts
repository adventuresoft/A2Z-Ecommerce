'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api-client';

let socket: Socket | null = null;

function getSocketHost(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:3001';
  }
}

export function getMessagingSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAccessToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  if (socket && !socket.connected) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  const host = getSocketHost();
  socket = io(`${host}/messaging`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectMessagingSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

