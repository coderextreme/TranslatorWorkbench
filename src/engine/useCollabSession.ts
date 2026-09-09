/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Collaborative Session Hook
 * Manages WebSocket connection, presence, real-time sync of operations,
 * breakpoints, chat messages, and activity events.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapOperation,
  ProgrammerPresence,
  ProgrammerChatMessage,
  CollabActivityEvent,
  CollabMessage,
  ExecutionDelta
} from '../types';
import { figure1Preset, allPresets } from './presets';

const PRESET_PROGRAMMERS = [
  { name: 'Ada Lovelace', role: 'Algorithm Pioneer', avatar: '👩‍💻', color: '#10b981' },
  { name: 'Alan Turing', role: 'Computation Theorist', avatar: '👨‍🔬', color: '#6366f1' },
  { name: 'Grace Hopper', role: 'Compiler Architect', avatar: '⚡', color: '#f59e0b' },
  { name: 'Claude Shannon', role: 'Information Architect', avatar: '📡', color: '#06b6d4' },
  { name: 'Margaret Hamilton', role: 'Systems Engineer', avatar: '🚀', color: '#ec4899' },
  { name: 'Donald Knuth', role: 'Algorithm Specialist', avatar: '📚', color: '#8b5cf6' }
];

function getOrCreateProfile(): ProgrammerPresence {
  const stored = localStorage.getItem('twb_programmer_profile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const randomChoice = PRESET_PROGRAMMERS[Math.floor(Math.random() * PRESET_PROGRAMMERS.length)];
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const profile: ProgrammerPresence = {
    id: 'prog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    name: `${randomChoice.name} #${randomSuffix}`,
    role: randomChoice.role,
    avatar: randomChoice.avatar,
    color: randomChoice.color,
    focusedOpId: null,
    lastActive: Date.now()
  };

  localStorage.setItem('twb_programmer_profile', JSON.stringify(profile));
  return profile;
}

export function useCollabSession(initialBlueprintId: string = figure1Preset.id) {
  const [myProfile, setMyProfile] = useState<ProgrammerPresence>(getOrCreateProfile);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [operations, setOperations] = useState<MapOperation[]>(() =>
    JSON.parse(JSON.stringify(figure1Preset.operations))
  );
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(initialBlueprintId);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [otherProgrammers, setOtherProgrammers] = useState<ProgrammerPresence[]>([]);
  const [chatMessages, setChatMessages] = useState<ProgrammerChatMessage[]>([]);
  const [activities, setActivities] = useState<CollabActivityEvent[]>([]);
  const [executionSync, setExecutionSync] = useState<boolean>(true);

  // External step notification for synchronized execution
  const [remoteStepEvent, setRemoteStepEvent] = useState<{
    currentOpIndex: number;
    currentStep: number;
    delta?: ExecutionDelta;
    programmer: { name: string; color: string };
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const myProfileRef = useRef(myProfile);
  myProfileRef.current = myProfile;

  // Send message helper
  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (unmounted) {
            socket.close();
            return;
          }
          setIsConnected(true);
          // Announce presence
          socket.send(
            JSON.stringify({
              type: 'programmer:join',
              payload: myProfileRef.current
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
          } catch (err) {
            console.error('Error parsing incoming WS message:', err);
          }
        };

        socket.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          // Attempt reconnection after 2 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        };

        socket.onerror = (err) => {
          console.warn('WebSocket connection issue:', err);
          socket.close();
        };
      } catch (err) {
        console.error('WebSocket creation failed:', err);
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Message Handler
  const handleIncomingMessage = useCallback(
    (msg: CollabMessage | any) => {
      switch (msg.type) {
        case 'room:init': {
          const { payload } = msg;
          setOperations(payload.operations);
          setSelectedBlueprintId(payload.selectedBlueprintId);
          setBreakpoints(new Set(payload.breakpoints));
          setOtherProgrammers(
            payload.programmers.filter((p: ProgrammerPresence) => p.id !== myProfileRef.current.id)
          );
          setExecutionSync(payload.executionSync);
          setChatMessages(payload.chatMessages || []);
          setActivities(payload.activities || []);
          break;
        }

        case 'programmer:join': {
          const newProg: ProgrammerPresence = msg.payload;
          if (newProg.id !== myProfileRef.current.id) {
            setOtherProgrammers((prev) => {
              const filtered = prev.filter((p) => p.id !== newProg.id);
              return [...filtered, newProg];
            });
            setActivities((prev) => [
              ...prev.slice(-70),
              {
                id: 'act-' + Date.now(),
                programmerName: newProg.name,
                programmerColor: newProg.color,
                action: 'Joined the collaborative workbench',
                timestamp: Date.now()
              }
            ]);
          }
          break;
        }

        case 'programmer:update': {
          const updated: ProgrammerPresence = msg.payload;
          if (updated.id !== myProfileRef.current.id) {
            setOtherProgrammers((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
          }
          break;
        }

        case 'programmer:leave': {
          const { id } = msg.payload;
          setOtherProgrammers((prev) => prev.filter((p) => p.id !== id));
          break;
        }

        case 'op:add': {
          const { operation, atIndex, programmer } = msg.payload;
          setOperations((prev) => {
            // Guard against duplicate
            if (prev.some((o) => o.id === operation.id)) return prev;
            const next = [...prev];
            const insertIdx = atIndex >= 0 && atIndex <= next.length ? atIndex : next.length;
            next.splice(insertIdx, 0, operation);
            return next;
          });
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: `Added operation "${operation.label}"`,
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'op:update': {
          const { operation, programmer } = msg.payload;
          setOperations((prev) =>
            prev.map((o) => (o.id === operation.id ? operation : o))
          );
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: `Modified operation "${operation.label}"`,
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'op:delete': {
          const { opId, programmer } = msg.payload;
          setOperations((prev) => prev.filter((o) => o.id !== opId));
          setBreakpoints((prev) => {
            const next = new Set(prev);
            next.delete(opId);
            return next;
          });
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: `Cut operation ${opId}`,
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'op:reorder': {
          const { operations: newOps, programmer } = msg.payload;
          setOperations(newOps);
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: 'Reordered operations',
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'breakpoint:toggle': {
          const { opId, armed, programmer } = msg.payload;
          setBreakpoints((prev) => {
            const next = new Set(prev);
            if (armed) next.add(opId);
            else next.delete(opId);
            return next;
          });
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: armed ? `Armed breakpoint on ${opId}` : `Cleared breakpoint on ${opId}`,
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'blueprint:select': {
          const { blueprintId, operations: newOps, programmer } = msg.payload;
          setSelectedBlueprintId(blueprintId);
          setOperations(newOps);
          setBreakpoints(new Set());
          const bp = allPresets.find((p) => p.id === blueprintId);
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: `Switched map blueprint to "${bp?.name || blueprintId}"`,
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'execution:step': {
          setRemoteStepEvent(msg.payload);
          break;
        }

        case 'execution:sync_toggle': {
          const { enabled, programmer } = msg.payload;
          setExecutionSync(enabled);
          setActivities((prev) => [
            ...prev.slice(-70),
            {
              id: 'act-' + Date.now(),
              programmerName: programmer.name,
              programmerColor: programmer.color,
              action: enabled ? 'Enabled shared playback' : 'Decoupled playback',
              timestamp: Date.now()
            }
          ]);
          break;
        }

        case 'chat:message': {
          const chatMsg: ProgrammerChatMessage = msg.payload;
          setChatMessages((prev) => [...prev.slice(-90), chatMsg]);
          break;
        }

        default:
          break;
      }
    },
    []
  );

  // Actions invoked by the local programmer
  const addOperation = useCallback(
    (newOp: MapOperation, atIndex: number) => {
      // Optimistic local update
      setOperations((prev) => {
        const next = [...prev];
        next.splice(atIndex + 1, 0, newOp);
        return next;
      });

      sendMessage({
        type: 'op:add',
        payload: {
          operation: newOp,
          atIndex: atIndex + 1,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const updateOperation = useCallback(
    (updatedOp: MapOperation) => {
      // Optimistic local update
      setOperations((prev) =>
        prev.map((o) => (o.id === updatedOp.id ? updatedOp : o))
      );

      sendMessage({
        type: 'op:update',
        payload: {
          operation: updatedOp,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const deleteOperation = useCallback(
    (opId: string) => {
      // Optimistic local update
      setOperations((prev) => prev.filter((o) => o.id !== opId));
      setBreakpoints((prev) => {
        const next = new Set(prev);
        next.delete(opId);
        return next;
      });

      sendMessage({
        type: 'op:delete',
        payload: {
          opId,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const reorderOperations = useCallback(
    (newOps: MapOperation[]) => {
      setOperations(newOps);
      sendMessage({
        type: 'op:reorder',
        payload: {
          operations: newOps,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const toggleBreakpoint = useCallback(
    (opId: string) => {
      const willArm = !breakpoints.has(opId);
      setBreakpoints((prev) => {
        const next = new Set(prev);
        if (willArm) next.add(opId);
        else next.delete(opId);
        return next;
      });

      sendMessage({
        type: 'breakpoint:toggle',
        payload: {
          opId,
          armed: willArm,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [breakpoints, myProfile, sendMessage]
  );

  const selectBlueprint = useCallback(
    (blueprintId: string) => {
      const bp = allPresets.find((p) => p.id === blueprintId);
      if (!bp) return;
      const newOps = JSON.parse(JSON.stringify(bp.operations));
      setSelectedBlueprintId(bp.id);
      setOperations(newOps);
      setBreakpoints(new Set());

      sendMessage({
        type: 'blueprint:select',
        payload: {
          blueprintId: bp.id,
          operations: newOps,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const setFocusedOp = useCallback(
    (opId: string | null) => {
      setMyProfile((prev) => ({ ...prev, focusedOpId: opId }));
      sendMessage({
        type: 'programmer:update',
        payload: { id: myProfile.id, focusedOpId: opId }
      });
    },
    [myProfile.id, sendMessage]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const msg: ProgrammerChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        senderId: myProfile.id,
        senderName: myProfile.name,
        senderRole: myProfile.role,
        senderColor: myProfile.color,
        senderAvatar: myProfile.avatar,
        text: text.trim(),
        timestamp: Date.now()
      };

      setChatMessages((prev) => [...prev.slice(-90), msg]);

      sendMessage({
        type: 'chat:message',
        payload: msg
      });
    },
    [myProfile, sendMessage]
  );

  const updateMyProfile = useCallback(
    (updates: Partial<ProgrammerPresence>) => {
      setMyProfile((prev) => {
        const next = { ...prev, ...updates };
        localStorage.setItem('twb_programmer_profile', JSON.stringify(next));
        sendMessage({
          type: 'programmer:update',
          payload: { id: next.id, ...updates }
        });
        return next;
      });
    },
    [sendMessage]
  );

  const toggleExecutionSync = useCallback(
    (enabled: boolean) => {
      setExecutionSync(enabled);
      sendMessage({
        type: 'execution:sync_toggle',
        payload: {
          enabled,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [myProfile, sendMessage]
  );

  const broadcastStep = useCallback(
    (currentOpIndex: number, currentStep: number, delta?: ExecutionDelta) => {
      if (!executionSync) return;
      sendMessage({
        type: 'execution:step',
        payload: {
          currentOpIndex,
          currentStep,
          delta,
          programmer: { name: myProfile.name, color: myProfile.color }
        }
      });
    },
    [executionSync, myProfile, sendMessage]
  );

  return {
    isConnected,
    myProfile,
    otherProgrammers,
    operations,
    selectedBlueprintId,
    breakpoints,
    chatMessages,
    activities,
    executionSync,
    remoteStepEvent,
    addOperation,
    updateOperation,
    deleteOperation,
    reorderOperations,
    toggleBreakpoint,
    selectBlueprint,
    setFocusedOp,
    sendChatMessage,
    updateMyProfile,
    toggleExecutionSync,
    broadcastStep,
    setOperations
  };
}
