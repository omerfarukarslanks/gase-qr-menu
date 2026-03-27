"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current.on("connect", () => {
      console.log("[Socket] Connected:", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinStore = useCallback((storeId: string) => {
    socketRef.current?.emit("joinStore", { storeId });
  }, []);

  const joinTable = useCallback((tableId: string, sessionId: string) => {
    socketRef.current?.emit("joinTable", { tableId, sessionId });
  }, []);

  const callWaiter = useCallback(
    (storeId: string, tableId: string, tableName: string) => {
      socketRef.current?.emit("callWaiter", { storeId, tableId, tableName });
    },
    []
  );

  const requestBill = useCallback(
    (storeId: string, tableId: string, tableName: string) => {
      socketRef.current?.emit("requestBill", { storeId, tableId, tableName });
    },
    []
  );

  const onEvent = useCallback(
    (event: string, callback: (data: any) => void) => {
      socketRef.current?.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    []
  );

  return {
    socket: socketRef,
    joinStore,
    joinTable,
    callWaiter,
    requestBill,
    onEvent,
  };
}
