/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 4D Visual Language Workbench - Collaboration Server
 * Real-Time Multi-Programmer WebSocket & HTTP Backend
 * Authoritative Server Architecture for Concurrent 4D Visual Programming
 */

import http from 'http';
import express, { Request, Response } from 'express';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { figure1Preset, allPresets } from './src/engine/presets';
import {
  MapOperation,
  ProgrammerPresence,
  ProgrammerChatMessage,
  CollabActivityEvent,
  CollabMessage
} from './src/types';

// Collaborative Room State
interface RoomState {
  operations: MapOperation[];
  selectedBlueprintId: string;
  breakpoints: Set<string>;
  programmers: Map<WebSocket, ProgrammerPresence>;
  executionSync: boolean;
  currentOpIndex: number;
  currentStep: number;
  chatMessages: ProgrammerChatMessage[];
  activities: CollabActivityEvent[];
}

const room: RoomState = {
  operations: JSON.parse(JSON.stringify(figure1Preset.operations)),
  selectedBlueprintId: figure1Preset.id,
  breakpoints: new Set<string>(),
  programmers: new Map<WebSocket, ProgrammerPresence>(),
  executionSync: true,
  currentOpIndex: 0,
  currentStep: 0,
  chatMessages: [
    {
      id: 'welcome-msg-1',
      senderId: 'sys-agent',
      senderName: 'TWB System',
      senderRole: 'Kernel',
      senderColor: '#f59e0b',
      senderAvatar: '⚡',
      text: 'Collaborative 4D Workbench initialized. Multiple programmers can concurrently inspect, code, step, and unstep operations.',
      timestamp: Date.now()
    }
  ],
  activities: [
    {
      id: 'init-act',
      programmerName: 'Kernel',
      programmerColor: '#f59e0b',
      action: 'Initialized 4D Reversible Interpreter Room (Figure 1: Loop Counter)',
      timestamp: Date.now()
    }
  ]
};

function broadcast(msg: CollabMessage | object, excludeWs?: WebSocket) {
  const data = JSON.stringify(msg);
  for (const [clientWs] of room.programmers.entries()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(data);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  }
}

function addActivity(programmerName: string, programmerColor: string, action: string, target?: string) {
  const act: CollabActivityEvent = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    programmerName,
    programmerColor,
    action,
    target,
    timestamp: Date.now()
  };
  room.activities.push(act);
  if (room.activities.length > 80) {
    room.activities.shift();
  }
  return act;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      programmersOnline: room.programmers.size,
      operationsCount: room.operations.length,
      blueprint: room.selectedBlueprintId
    });
  });

  app.get('/api/collab/state', (_req: Request, res: Response) => {
    res.json({
      operations: room.operations,
      selectedBlueprintId: room.selectedBlueprintId,
      breakpoints: Array.from(room.breakpoints),
      programmers: Array.from(room.programmers.values()),
      executionSync: room.executionSync,
      currentOpIndex: room.currentOpIndex,
      currentStep: room.currentStep,
      chatMessages: room.chatMessages,
      activities: room.activities
    });
  });

  app.post('/api/collab/reset', (req: Request, res: Response) => {
    const blueprintId = req.body?.blueprintId || room.selectedBlueprintId;
    const targetPreset = allPresets.find((p) => p.id === blueprintId) || figure1Preset;

    room.selectedBlueprintId = targetPreset.id;
    room.operations = JSON.parse(JSON.stringify(targetPreset.operations));
    room.breakpoints.clear();
    room.currentOpIndex = 0;
    room.currentStep = 0;

    const act = addActivity('System', '#10b981', `Reset workbench to blueprint: ${targetPreset.name}`);

    broadcast({
      type: 'blueprint:select',
      payload: {
        blueprintId: targetPreset.id,
        operations: room.operations,
        programmer: { name: 'System', color: '#10b981' }
      }
    });

    res.json({ success: true, activity: act });
  });

  const server = http.createServer(app);

  // WebSocket Server on path /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    // Generate temporary presence until client announces themselves
    const tempPresence: ProgrammerPresence = {
      id: 'prog-' + Math.random().toString(36).substring(2, 9),
      name: 'Programmer ' + (room.programmers.size + 1),
      role: 'Engineer',
      color: '#38bdf8',
      avatar: '👨‍💻',
      focusedOpId: null,
      lastActive: Date.now()
    };
    room.programmers.set(ws, tempPresence);

    // Send full current room state to newly connected client
    const initPayload: CollabMessage = {
      type: 'room:init',
      payload: {
        operations: room.operations,
        selectedBlueprintId: room.selectedBlueprintId,
        breakpoints: Array.from(room.breakpoints),
        programmers: Array.from(room.programmers.values()),
        executionSync: room.executionSync,
        currentOpIndex: room.currentOpIndex,
        currentStep: room.currentStep,
        chatMessages: room.chatMessages,
        activities: room.activities
      }
    };
    ws.send(JSON.stringify(initPayload));

    // Handle incoming messages from this programmer
    ws.on('message', (rawData: string | Buffer) => {
      try {
        const msg = JSON.parse(rawData.toString());
        const presence = room.programmers.get(ws);
        if (!presence) return;

        switch (msg.type) {
          case 'programmer:join': {
            const joined: ProgrammerPresence = msg.payload;
            presence.id = joined.id;
            presence.name = joined.name;
            presence.role = joined.role || presence.role;
            presence.color = joined.color;
            presence.avatar = joined.avatar;
            presence.lastActive = Date.now();

            addActivity(presence.name, presence.color, 'Joined the collaboration workbench');

            broadcast({
              type: 'programmer:join',
              payload: presence
            }, ws);
            break;
          }

          case 'programmer:update': {
            const updates = msg.payload;
            Object.assign(presence, updates, { lastActive: Date.now() });

            broadcast({
              type: 'programmer:update',
              payload: { ...presence }
            }, ws);
            break;
          }

          case 'op:add': {
            const { operation, atIndex, programmer } = msg.payload;
            // Check existence for idempotency
            const exists = room.operations.some((o) => o.id === operation.id);
            if (!exists) {
              const insertPos = typeof atIndex === 'number' && atIndex >= 0 && atIndex <= room.operations.length
                ? atIndex
                : room.operations.length;
              room.operations.splice(insertPos, 0, operation);
              addActivity(programmer.name, programmer.color, `Inserted operation "${operation.label}"`, `Index ${insertPos}`);

              broadcast({
                type: 'op:add',
                payload: { operation, atIndex: insertPos, programmer }
              }, ws);
            }
            break;
          }

          case 'op:update': {
            const { operation, programmer } = msg.payload;
            const idx = room.operations.findIndex((o) => o.id === operation.id);
            if (idx !== -1) {
              room.operations[idx] = operation;
              addActivity(programmer.name, programmer.color, `Modified operation "${operation.label}"`);

              broadcast({
                type: 'op:update',
                payload: { operation, programmer }
              }, ws);
            }
            break;
          }

          case 'op:delete': {
            const { opId, programmer } = msg.payload;
            const targetOp = room.operations.find((o) => o.id === opId);
            if (targetOp) {
              room.operations = room.operations.filter((o) => o.id !== opId);
              room.breakpoints.delete(opId);
              addActivity(programmer.name, programmer.color, `Cut operation "${targetOp.label}"`);

              broadcast({
                type: 'op:delete',
                payload: { opId, programmer }
              }, ws);
            }
            break;
          }

          case 'op:reorder': {
            const { operations, programmer } = msg.payload;
            if (Array.isArray(operations) && operations.length > 0) {
              room.operations = operations;
              addActivity(programmer.name, programmer.color, 'Reordered program operations');

              broadcast({
                type: 'op:reorder',
                payload: { operations, programmer }
              }, ws);
            }
            break;
          }

          case 'breakpoint:toggle': {
            const { opId, armed, programmer } = msg.payload;
            if (armed) {
              room.breakpoints.add(opId);
            } else {
              room.breakpoints.delete(opId);
            }
            const op = room.operations.find((o) => o.id === opId);
            addActivity(
              programmer.name,
              programmer.color,
              armed ? `Armed breakpoint at ${op?.label || opId}` : `Cleared breakpoint at ${op?.label || opId}`
            );

            broadcast({
              type: 'breakpoint:toggle',
              payload: { opId, armed, programmer }
            }, ws);
            break;
          }

          case 'blueprint:select': {
            const { blueprintId, operations, programmer } = msg.payload;
            room.selectedBlueprintId = blueprintId;
            room.operations = operations;
            room.breakpoints.clear();
            room.currentOpIndex = 0;
            room.currentStep = 0;

            const bp = allPresets.find((p) => p.id === blueprintId);
            addActivity(programmer.name, programmer.color, `Switched blueprint to "${bp?.name || blueprintId}"`);

            broadcast({
              type: 'blueprint:select',
              payload: { blueprintId, operations, programmer }
            }, ws);
            break;
          }

          case 'execution:step': {
            const { currentOpIndex, currentStep, delta, programmer } = msg.payload;
            room.currentOpIndex = currentOpIndex;
            room.currentStep = currentStep;

            if (room.executionSync) {
              broadcast({
                type: 'execution:step',
                payload: { currentOpIndex, currentStep, delta, programmer }
              }, ws);
            }
            break;
          }

          case 'execution:sync_toggle': {
            const { enabled, programmer } = msg.payload;
            room.executionSync = enabled;
            addActivity(programmer.name, programmer.color, enabled ? 'Enabled Synchronized Debugger Playback' : 'Set Independent Debugger Playback');

            broadcast({
              type: 'execution:sync_toggle',
              payload: { enabled, programmer }
            }, ws);
            break;
          }

          case 'chat:message': {
            const chatMsg: ProgrammerChatMessage = msg.payload;
            room.chatMessages.push(chatMsg);
            if (room.chatMessages.length > 100) {
              room.chatMessages.shift();
            }

            broadcast({
              type: 'chat:message',
              payload: chatMsg
            }, ws);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      const presence = room.programmers.get(ws);
      if (presence) {
        room.programmers.delete(ws);
        addActivity(presence.name, presence.color, 'Left the collaboration session');

        broadcast({
          type: 'programmer:leave',
          payload: { id: presence.id }
        });
      }
    });
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TWB-4D Multi-Programmer Workbench Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
