import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
};

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'http://localhost:4000';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }

  return socket;
}

export function useStoreRealtime(storeId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!storeId) {
      return;
    }

    const client = getSocket();
    client.emit('joinStore', { storeId });
    client.emit('joinKitchen', { storeId });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff-tables'] });
      queryClient.invalidateQueries({ queryKey: ['staff-kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    };

    client.on('newOrder', invalidate);
    client.on('orderStatusUpdate', invalidate);
    client.on('paymentCompleted', invalidate);
    client.on('tableSessionOpened', invalidate);
    client.on('tableSessionClosed', invalidate);
    client.on('waiterCall', invalidate);
    client.on('notification', invalidate);
    client.on('stockLow', invalidate);

    return () => {
      client.off('newOrder', invalidate);
      client.off('orderStatusUpdate', invalidate);
      client.off('paymentCompleted', invalidate);
      client.off('tableSessionOpened', invalidate);
      client.off('tableSessionClosed', invalidate);
      client.off('waiterCall', invalidate);
      client.off('notification', invalidate);
      client.off('stockLow', invalidate);
    };
  }, [queryClient, storeId]);
}
