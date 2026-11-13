import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LanClient, type AppMessage, type LanStatus } from './netClient';
import { t } from '../i18n';

export type LanRole = 'host' | 'guest' | null;

interface LanContextValue {
  role: LanRole;
  status: LanStatus;
  room: string | null;
  error: string | null;
  peerConnected: boolean;
  createRoom: () => void;
  joinRoom: (address: string, room: string) => void;
  leave: () => void;
  send: (message: AppMessage) => void;
  client: LanClient;
}

const LanContext = createContext<LanContextValue | null>(null);

const LAN_ERROR_KEYS: Record<string, string> = {
  bad_message: 'lan.error.badMessage',
  room_not_found: 'lan.error.roomNotFound',
  unknown_op: 'lan.error.unknownOp',
};

export function LanProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<LanClient | null>(null);
  if (!clientRef.current) clientRef.current = new LanClient();
  const client = clientRef.current;

  const [role, setRole] = useState<LanRole>(null);
  const [status, setStatus] = useState<LanStatus>('idle');
  const [room, setRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);

  useEffect(() => {
    client.onStatus = setStatus;
    client.onOp = (op) => {
      if (op.op === 'created') {
        setRole('host');
        setRoom(op.room);
        setError(null);
        setPeerConnected(false);
      } else if (op.op === 'joined') {
        setRole('guest');
        setRoom(op.room);
        setError(null);
        setPeerConnected(false);
      } else if (op.op === 'peer') {
        setPeerConnected(op.status === 'joined');
        setStatus(op.status === 'joined' ? 'ready' : 'disconnected');
      } else if (op.op === 'error') {
        const key = op.code ? LAN_ERROR_KEYS[op.code] : null;
        setError(key ? t(key) : op.message);
        setStatus('error');
      }
    };
  }, [client]);

  useEffect(() => {
    if (status === 'error' && !error) setError(t('lan.error.connectionFailed'));
  }, [status, error]);

  const value = useMemo<LanContextValue>(() => ({
    role,
    status,
    room,
    error,
    peerConnected,
    createRoom: () => {
      setError(null);
      client.create();
    },
    joinRoom: (address, roomCode) => {
      setError(null);
      client.join(address, roomCode);
    },
    leave: () => {
      client.close();
      setRole(null);
      setRoom(null);
      setError(null);
      setPeerConnected(false);
      setStatus('idle');
    },
    send: (message) => client.send(message),
    client,
  }), [role, status, room, error, peerConnected, client]);

  return <LanContext.Provider value={value}>{children}</LanContext.Provider>;
}

export function useLan(): LanContextValue {
  const ctx = useContext(LanContext);
  if (!ctx) throw new Error('useLan must be used inside LanProvider');
  return ctx;
}
