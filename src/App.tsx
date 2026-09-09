/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 4D Visual Language Workbench (TWB-4D)
 * Interactive Reversible Programming Environment based on J.W. Carlson
 * "A Visual Language for Data Mapping" (Lawrence Livermore National Laboratory / OOPSLA 2001)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  figure1Preset,
  edi820Preset,
  xmlTraversalPreset,
  allPresets
} from './engine/presets';
import {
  createInitialState,
  executeOperationForward,
  cloneState
} from './engine/TwbInterpreter';
import {
  DesktopObjectsState,
  ExecutionDelta,
  MapOperation,
  ProgramBlueprint,
  Coord4D
} from './types';
import { useCollabSession } from './engine/useCollabSession';
import { TransportBar } from './components/TransportBar';
import { RecorderFlowchart } from './components/RecorderFlowchart';
import { HyperSpatialCanvas } from './components/HyperSpatialCanvas';
import { DesktopObjects } from './components/DesktopObjects';
import { LanguageSpecModal } from './components/LanguageSpecModal';
import { AddOperationModal } from './components/AddOperationModal';
import { EditOperationModal } from './components/EditOperationModal';
import { ProgrammersDrawer } from './components/ProgrammersDrawer';
import {
  Layers,
  BookOpen,
  Code2,
  SlidersHorizontal,
  Activity,
  History,
  Info,
  CheckCircle2,
  Terminal,
  Users,
  MessageSquare,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function App() {
  // Real-time Collaborative Session Hook
  const {
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
    broadcastStep
  } = useCollabSession();

  const currentBlueprint =
    allPresets.find((p) => p.id === selectedBlueprintId) || figure1Preset;

  // Machine Execution State
  const [desktopState, setDesktopState] = useState<DesktopObjectsState>(() =>
    createInitialState(figure1Preset)
  );
  const [currentOpIndex, setCurrentOpIndex] = useState<number>(0);
  const [currentStepNumber, setCurrentStepNumber] = useState<number>(0);
  const [executionHistory, setExecutionHistory] = useState<ExecutionDelta[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReversePlaying, setIsReversePlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // View modes & Drawers
  const [workspaceLayout, setWorkspaceLayout] = useState<'SPLIT' | 'CANVAS' | 'RECORDER'>('SPLIT');
  const [showDesktopPanel, setShowDesktopPanel] = useState<boolean>(true);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingOp, setEditingOp] = useState<MapOperation | null>(null);
  const [isProgrammersDrawerOpen, setIsProgrammersDrawerOpen] = useState<boolean>(false);
  const [insertTargetIndex, setInsertTargetIndex] = useState<number>(0);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string>(
    'Multi-Programmer Collaborative Workbench initialized at t=0.'
  );

  // Synchronize when a remote programmer changes blueprint
  useEffect(() => {
    const bp = allPresets.find((p) => p.id === selectedBlueprintId);
    if (bp) {
      setDesktopState(createInitialState(bp));
      setCurrentOpIndex(0);
      setCurrentStepNumber(0);
      setExecutionHistory([]);
    }
  }, [selectedBlueprintId]);

  // Synchronize remote execution step if collaborative debugger is enabled
  useEffect(() => {
    if (!executionSync || !remoteStepEvent) return;
    setCurrentOpIndex(remoteStepEvent.opIndex);
    setCurrentStepNumber(remoteStepEvent.step);
    if (remoteStepEvent.delta) {
      setDesktopState(remoteStepEvent.delta.stateAfter);
      setExecutionHistory((prev) => [...prev, remoteStepEvent.delta!]);
    }
  }, [remoteStepEvent, executionSync]);

  // Current 4D coordinate
  const currentCoord: Coord4D = {
    x: operations[currentOpIndex]?.coord?.x ?? 0,
    y: operations[currentOpIndex]?.coord?.y ?? currentOpIndex,
    z: operations[currentOpIndex]?.coord?.z ?? 0,
    t: currentStepNumber
  };

  // Reset interpreter when switching blueprint
  const handleSelectBlueprint = (blueprintId: string) => {
    const bp = allPresets.find((p) => p.id === blueprintId);
    if (!bp) return;
    setIsPlaying(false);
    setIsReversePlaying(false);
    selectBlueprint(bp.id);
    setDesktopState(createInitialState(bp));
    setCurrentOpIndex(0);
    setCurrentStepNumber(0);
    setExecutionHistory([]);
    setStatusMessage(`Loaded collaborative blueprint: ${bp.name}`);
  };

  // Single forward step
  const handleStepForward = useCallback(() => {
    if (operations.length === 0) return;

    if (currentOpIndex >= operations.length) {
      setIsPlaying(false);
      setStatusMessage('Program completed. End of operations.');
      return;
    }

    const currentOp = operations[currentOpIndex];
    const result = executeOperationForward(
      currentOp,
      currentOpIndex,
      desktopState,
      operations,
      currentStepNumber + 1
    );

    setDesktopState(result.delta.stateAfter);
    setCurrentOpIndex(result.nextIndex);
    const nextStep = currentStepNumber + 1;
    setCurrentStepNumber(nextStep);
    setExecutionHistory((prev) => [...prev, result.delta]);
    setStatusMessage(result.message);

    // Broadcast step to connected programmers if debugger sync is enabled
    if (executionSync) {
      broadcastStep(result.nextIndex, nextStep, result.delta);
    }

    if (result.halted) {
      setIsPlaying(false);
    }
  }, [operations, currentOpIndex, desktopState, currentStepNumber, executionSync, broadcastStep]);

  // Single backward step (UNSTEP / UNDO)
  const handleStepBackward = useCallback(() => {
    if (executionHistory.length === 0 || currentStepNumber <= 0) {
      setIsReversePlaying(false);
      setStatusMessage('At origin (t=0). Cannot unstep further.');
      return;
    }

    const lastDelta = executionHistory[executionHistory.length - 1];
    setDesktopState(cloneState(lastDelta.stateBefore));
    setExecutionHistory((prev) => prev.slice(0, -1));
    const nextStep = currentStepNumber - 1;
    setCurrentStepNumber(nextStep);

    // Find operation index that produced this step
    const opIdx = operations.findIndex((o) => o.id === lastDelta.opId);
    const nextOpIdx = opIdx !== -1 ? opIdx : Math.max(0, currentOpIndex - 1);
    setCurrentOpIndex(nextOpIdx);
    setStatusMessage(`[UNSTEP] Reverted: ${lastDelta.opType} (${lastDelta.description})`);

    if (executionSync) {
      broadcastStep(nextOpIdx, nextStep);
    }
  }, [executionHistory, currentStepNumber, operations, currentOpIndex, executionSync, broadcastStep]);

  // Stop playback
  const handleStop = () => {
    setIsPlaying(false);
    setIsReversePlaying(false);
    setStatusMessage('Playback paused.');
  };

  // Reset interpreter to step 0
  const handleReset = () => {
    setIsPlaying(false);
    setIsReversePlaying(false);
    setDesktopState(createInitialState(currentBlueprint));
    setCurrentOpIndex(0);
    setCurrentStepNumber(0);
    setExecutionHistory([]);
    setStatusMessage('Interpreter reset to origin state (t=0).');
    if (executionSync) {
      broadcastStep(0, 0);
    }
  };

  // Time scrubbing to arbitrary timestamp t
  const handleScrubTime = (targetStep: number) => {
    handleStop();
    if (targetStep === currentStepNumber) return;

    if (targetStep < currentStepNumber) {
      // Revert back in time using recorded history
      const targetDelta = executionHistory[targetStep];
      if (targetDelta) {
        setDesktopState(cloneState(targetDelta.stateBefore));
        setExecutionHistory((prev) => prev.slice(0, targetStep));
        setCurrentStepNumber(targetStep);
        const opIdx = operations.findIndex((o) => o.id === targetDelta.opId);
        const nextIdx = opIdx !== -1 ? opIdx : 0;
        setCurrentOpIndex(nextIdx);
        setStatusMessage(`Scrubbed time back to t=${targetStep}`);
        if (executionSync) {
          broadcastStep(nextIdx, targetStep);
        }
      } else if (targetStep === 0) {
        handleReset();
      }
    } else {
      // Step forward until reaching targetStep or finish
      let state = cloneState(desktopState);
      let idx = currentOpIndex;
      let step = currentStepNumber;
      const newDeltas: ExecutionDelta[] = [...executionHistory];

      while (step < targetStep && idx < operations.length) {
        const op = operations[idx];
        const res = executeOperationForward(op, idx, state, operations, step + 1);
        state = res.delta.stateAfter;
        newDeltas.push(res.delta);
        idx = res.nextIndex;
        step++;
        if (res.halted) break;
      }

      setDesktopState(state);
      setExecutionHistory(newDeltas);
      setCurrentStepNumber(step);
      setCurrentOpIndex(idx);
      setStatusMessage(`Scrubbed time forward to t=${step}`);
      if (executionSync) {
        broadcastStep(idx, step);
      }
    }
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(100, Math.floor(600 / playbackSpeed));
    const timer = setInterval(() => {
      // Check for breakpoint at current operation
      const currentOp = operations[currentOpIndex];
      if (currentOp && breakpoints.has(currentOp.id) && currentStepNumber > 0) {
        setIsPlaying(false);
        setStatusMessage(`Breakpoint encountered at op: ${currentOp.label}`);
        return;
      }
      handleStepForward();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentOpIndex, operations, breakpoints, currentStepNumber, handleStepForward]);

  // Reverse playback timer loop
  useEffect(() => {
    if (!isReversePlaying) return;

    const intervalTime = Math.max(100, Math.floor(600 / playbackSpeed));
    const timer = setInterval(() => {
      if (executionHistory.length === 0 || currentStepNumber <= 0) {
        setIsReversePlaying(false);
        return;
      }
      handleStepBackward();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isReversePlaying, playbackSpeed, executionHistory, currentStepNumber, handleStepBackward]);

  // Cut operation
  const handleCutOp = (index: number) => {
    if (operations.length <= 1) return;
    const removed = operations[index];
    deleteOperation(removed.id, index);
    if (currentOpIndex >= index && currentOpIndex > 0) {
      setCurrentOpIndex((prev) => prev - 1);
    }
    setStatusMessage(`[CUT] Removed operation: ${removed.label} (Broadcasted)`);
  };

  // Live operation injection (Carlson Page 4)
  const handleInsertOp = (newOp: MapOperation, atIndex: number) => {
    addOperation(newOp, atIndex);
    setStatusMessage(`[INSERT] Added operation "${newOp.label}" at step ${atIndex + 1} (Broadcasted)`);
  };

  // Move operation up/down in sequence
  const handleMoveUpOp = (index: number) => {
    if (index <= 0) return;
    const newOps = [...operations];
    const temp = newOps[index - 1];
    newOps[index - 1] = newOps[index];
    newOps[index] = temp;
    reorderOperations(newOps);
  };

  const handleMoveDownOp = (index: number) => {
    if (index >= operations.length - 1) return;
    const newOps = [...operations];
    const temp = newOps[index + 1];
    newOps[index + 1] = newOps[index];
    newOps[index] = temp;
    reorderOperations(newOps);
  };

  // Edit operation
  const handleOpenEditModal = (op: MapOperation) => {
    setEditingOp(op);
    setIsEditModalOpen(true);
  };

  const totalProgrammers = 1 + otherProgrammers.length;

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-neutral-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wide uppercase text-neutral-100">
                  4D Visual Language Workbench
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                  TWB-4D
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Multi-Programmer Reversible Data Mapping Language & Virtual Machine (Carlson, LLNL / OOPSLA 2001)
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Collaboration Bar & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Blueprint selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
            <span className="text-xs text-neutral-400 font-mono">Map:</span>
            <select
              id="blueprint-select"
              value={selectedBlueprintId}
              onChange={(e) => handleSelectBlueprint(e.target.value)}
              className="bg-transparent text-xs font-semibold text-amber-400 focus:outline-none cursor-pointer"
            >
              {allPresets.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Programmers Stack & Drawer Trigger */}
          <button
            onClick={() => setIsProgrammersDrawerOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs transition"
            title="Open Collaborative Team Panel & Chat"
          >
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              <div
                style={{ backgroundColor: myProfile.color }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-1 ring-neutral-950 font-bold"
                title={`You: ${myProfile.name} (${myProfile.role})`}
              >
                {myProfile.avatar}
              </div>
              {otherProgrammers.slice(0, 3).map((prog) => (
                <div
                  key={prog.id}
                  style={{ backgroundColor: prog.color }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-1 ring-neutral-950 font-bold"
                  title={`${prog.name} (${prog.role})`}
                >
                  {prog.avatar}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-200">
                {totalProgrammers} {totalProgrammers === 1 ? 'Programmer' : 'Programmers'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
            </div>

            {chatMessages.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-1 rounded-full">
                {chatMessages.length}
              </span>
            )}
          </button>

          {/* New Collaborator Window button for quick testing */}
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-sky-400 hover:text-sky-300 text-xs transition"
            title="Open another programmer window to test real-time collaboration side-by-side"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Workspace Layout Toggle */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setWorkspaceLayout('SPLIT')}
              className={`px-2 py-1 rounded font-medium transition ${
                workspaceLayout === 'SPLIT' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setWorkspaceLayout('CANVAS')}
              className={`px-2 py-1 rounded font-medium transition ${
                workspaceLayout === 'CANVAS' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              4D Spacetime
            </button>
            <button
              onClick={() => setWorkspaceLayout('RECORDER')}
              className={`px-2 py-1 rounded font-medium transition ${
                workspaceLayout === 'RECORDER' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Flowchart
            </button>
          </div>

          {/* Desktop Objects Panel Toggle */}
          <button
            id="toggle-desktop-panel-btn"
            onClick={() => setShowDesktopPanel((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              showDesktopPanel
                ? 'bg-neutral-800 border-neutral-700 text-sky-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle Desktop Objects Panel (RPN calc, documents, outline)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop Objects</span>
          </button>

          {/* Language Spec & C++ CodeGen Modal Trigger */}
          <button
            id="open-spec-modal-btn"
            onClick={() => setIsSpecModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm"
            title="View 4D Language Specification and C++ CodeGen (Page 9)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>4D Spec & C++</span>
          </button>
        </div>
      </header>

      {/* VCR Reversible Transport Bar (UNSTEP, UNPLAY, STOP, PLAY, STEP, UNDO, CUT, Time Scrubber) */}
      <TransportBar
        isPlaying={isPlaying}
        isReversePlaying={isReversePlaying}
        currentStep={currentStepNumber}
        maxRecordedSteps={Math.max(executionHistory.length, currentStepNumber)}
        currentCoord={currentCoord}
        playbackSpeed={playbackSpeed}
        onPlay={() => {
          setIsReversePlaying(false);
          setIsPlaying(true);
        }}
        onReversePlay={() => {
          setIsPlaying(false);
          setIsReversePlaying(true);
        }}
        onStop={handleStop}
        onStep={handleStepForward}
        onUnstep={handleStepBackward}
        onUndo={handleStepBackward}
        onCut={() => handleCutOp(currentOpIndex)}
        onReset={handleReset}
        onScrubTime={handleScrubTime}
        onSetSpeed={setPlaybackSpeed}
        onOpenAddModal={() => {
          setInsertTargetIndex(currentOpIndex);
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Workspace Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left / Center Visual Execution Space */}
        <section className="flex-1 flex overflow-hidden">
          {/* Recorder Flowchart Column */}
          {(workspaceLayout === 'SPLIT' || workspaceLayout === 'RECORDER') && (
            <div
              className={`${
                workspaceLayout === 'SPLIT' ? 'w-1/2 min-w-[340px] max-w-[480px]' : 'w-full'
              } h-full overflow-hidden border-r border-neutral-800`}
            >
              <RecorderFlowchart
                operations={operations}
                currentOpIndex={currentOpIndex}
                currentCoord={currentCoord}
                breakpoints={breakpoints}
                otherProgrammers={otherProgrammers}
                onToggleBreakpoint={toggleBreakpoint}
                onSelectOp={(idx) => {
                  setCurrentOpIndex(idx);
                  if (operations[idx]) setFocusedOp(operations[idx].id);
                }}
                onDeleteOp={handleCutOp}
                onInsertAfter={(idx) => {
                  setInsertTargetIndex(idx);
                  setIsAddModalOpen(true);
                }}
                onEditOp={handleOpenEditModal}
                onMoveUpOp={handleMoveUpOp}
                onMoveDownOp={handleMoveDownOp}
                onFocusOp={setFocusedOp}
              />
            </div>
          )}

          {/* 4D Hyper-Spatial Canvas */}
          {(workspaceLayout === 'SPLIT' || workspaceLayout === 'CANVAS') && (
            <div className="flex-1 h-full overflow-hidden">
              <HyperSpatialCanvas
                operations={operations}
                currentOpIndex={currentOpIndex}
                currentCoord={currentCoord}
                executionHistory={executionHistory}
                otherProgrammers={otherProgrammers}
                onSelectOp={(idx) => {
                  setCurrentOpIndex(idx);
                  if (operations[idx]) setFocusedOp(operations[idx].id);
                }}
              />
            </div>
          )}
        </section>

        {/* Right Desktop Objects Panel */}
        {showDesktopPanel && (
          <aside className="w-[420px] max-w-[45vw] h-full overflow-hidden border-l border-neutral-800">
            <DesktopObjects state={desktopState} onUpdateState={setDesktopState} />
          </aside>
        )}
      </main>

      {/* Bottom Status Ticker & Operational Delta Log */}
      <footer className="bg-neutral-950 border-t border-neutral-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-neutral-400 select-none">
        <div className="flex items-center gap-2 truncate">
          <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-neutral-500">[LOG]</span>
          <span className="text-neutral-200 truncate">{statusMessage}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-neutral-500">
          <div>
            Undo Stack: <span className="text-sky-400 font-bold">{executionHistory.length}</span>
          </div>
          <div>
            Breakpoints: <span className="text-rose-400 font-bold">{breakpoints.size}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Collab Server: {isConnected ? 'Synchronized' : 'Reconnecting'}</span>
          </div>
        </div>
      </footer>

      {/* Programmers Drawer: Team Roster, Profile, Realtime Chat, Audit Trail */}
      <ProgrammersDrawer
        isOpen={isProgrammersDrawerOpen}
        onClose={() => setIsProgrammersDrawerOpen(false)}
        myProfile={myProfile}
        otherProgrammers={otherProgrammers}
        isConnected={isConnected}
        chatMessages={chatMessages}
        activities={activities}
        executionSync={executionSync}
        onToggleExecutionSync={toggleExecutionSync}
        onSendMessage={sendChatMessage}
        onUpdateMyProfile={updateMyProfile}
        onFocusOp={(opId) => {
          const idx = operations.findIndex((o) => o.id === opId);
          if (idx !== -1) setCurrentOpIndex(idx);
        }}
      />

      {/* Language Spec & C++ CodeGen Modal */}
      <LanguageSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        operations={operations}
        activeBlueprintName={currentBlueprint.name}
      />

      {/* Live Add Operation Modal */}
      <AddOperationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        insertIndex={insertTargetIndex}
        onInsertOp={handleInsertOp}
      />

      {/* Collaborative Edit Operation Modal */}
      <EditOperationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOp(null);
        }}
        operation={editingOp}
        onSave={(updatedOp) => {
          updateOperation(updatedOp);
          setStatusMessage(`[EDIT] Broadcasted update for ${updatedOp.label}`);
        }}
      />
    </div>
  );
}
