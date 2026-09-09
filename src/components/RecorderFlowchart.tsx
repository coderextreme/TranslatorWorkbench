/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Recorder Flowchart Component
 * Authentic visual implementation of Figure 1 from Carlson (LLNL 2001)
 * Displays branching columns (is 24 vs not 24), calculator ops,
 * text moves, copies, and loops.
 */

import React from 'react';
import {
  Calculator,
  ArrowRight,
  Repeat,
  CornerDownRight,
  HelpCircle,
  FileText,
  Copy,
  Plus,
  Trash2,
  Bookmark,
  Pencil,
  ChevronUp,
  ChevronDown,
  Users
} from 'lucide-react';
import { MapOperation, Coord4D, ProgrammerPresence } from '../types';

interface RecorderFlowchartProps {
  operations: MapOperation[];
  currentOpIndex: number;
  currentCoord: Coord4D;
  breakpoints: Set<string>;
  otherProgrammers?: ProgrammerPresence[];
  onToggleBreakpoint: (opId: string) => void;
  onSelectOp: (index: number) => void;
  onDeleteOp: (index: number) => void;
  onInsertAfter: (index: number) => void;
  onEditOp?: (op: MapOperation) => void;
  onMoveUpOp?: (index: number) => void;
  onMoveDownOp?: (index: number) => void;
  onFocusOp?: (opId: string | null) => void;
}

export const RecorderFlowchart: React.FC<RecorderFlowchartProps> = ({
  operations,
  currentOpIndex,
  currentCoord,
  breakpoints,
  otherProgrammers = [],
  onToggleBreakpoint,
  onSelectOp,
  onDeleteOp,
  onInsertAfter,
  onEditOp,
  onMoveUpOp,
  onMoveDownOp,
  onFocusOp
}) => {
  // Check if we have Figure 1 style branch structure
  const isFig1 = operations.some((o) => o.id === 'op-4' || o.label.includes('is 24'));

  // Separate pre-branch, branch columns, and post-branch if Figure 1
  const preBranchOps = isFig1 ? operations.filter((o) => ['op-0', 'op-1', 'op-2', 'op-3'].includes(o.id)) : [];
  const branchLookupOp = isFig1 ? operations.find((o) => o.id === 'op-4') : null;
  const loopBranchOps = isFig1 ? operations.filter((o) => ['op-5', 'op-6', 'op-7', 'op-8', 'op-9', 'op-10', 'op-11'].includes(o.id)) : [];

  const renderOpCard = (op: MapOperation, index: number, compact: boolean = false) => {
    const isCurrent = index === currentOpIndex;
    const hasBreakpoint = breakpoints.has(op.id);
    const collaboratorsOnThisOp = otherProgrammers.filter((p) => p.focusedOpId === op.id);

    return (
      <div
        key={op.id}
        onClick={() => onSelectOp(index)}
        onMouseEnter={() => onFocusOp && onFocusOp(op.id)}
        onMouseLeave={() => onFocusOp && onFocusOp(null)}
        style={{
          boxShadow:
            collaboratorsOnThisOp.length > 0
              ? `0 0 0 2px ${collaboratorsOnThisOp[0].color}99`
              : undefined
        }}
        className={`relative group rounded-md border text-left transition cursor-pointer ${
          isCurrent
            ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-900/30 ring-2 ring-amber-400/50'
            : collaboratorsOnThisOp.length > 0
            ? 'bg-neutral-900/95 border-neutral-600'
            : 'bg-neutral-900/90 border-neutral-700/80 hover:border-neutral-500 hover:bg-neutral-800/90'
        } ${compact ? 'p-2' : 'p-3'}`}
      >
        {/* Collaborators Active On This Operation Badge */}
        {collaboratorsOnThisOp.length > 0 && (
          <div className="absolute -top-2.5 right-2 flex items-center gap-1 z-10">
            {collaboratorsOnThisOp.map((prog) => (
              <span
                key={prog.id}
                style={{ backgroundColor: prog.color }}
                className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse"
                title={`${prog.name} (${prog.role || 'Programmer'}) is actively inspecting this node`}
              >
                <span>{prog.avatar || '👨‍💻'}</span>
                <span className="max-w-[70px] truncate">{prog.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Breakpoint Indicator */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBreakpoint(op.id);
          }}
          title={hasBreakpoint ? 'Clear Breakpoint' : 'Set Breakpoint'}
          className={`absolute -left-2.5 top-2.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition ${
            hasBreakpoint
              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
              : 'opacity-0 group-hover:opacity-100 bg-neutral-700 text-neutral-300 hover:bg-rose-500 hover:text-white'
          }`}
        >
          {hasBreakpoint ? '●' : '○'}
        </button>

        {/* Current Execution Marker */}
        {isCurrent && (
          <div className="absolute -left-6 top-3 text-amber-400 animate-pulse flex items-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Op Category Icon */}
            <div
              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                op.type === 'Arithmetic'
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                  : op.type === 'Copy'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  : op.type === 'Lookup'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                  : op.type === 'Loop'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                  : op.type === 'Move Text Location'
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}
            >
              {op.type === 'Arithmetic' ? (
                <Calculator className="w-4 h-4" />
              ) : op.type === 'Copy' ? (
                <Copy className="w-3.5 h-3.5" />
              ) : op.type === 'Lookup' ? (
                <HelpCircle className="w-4 h-4" />
              ) : op.type === 'Loop' ? (
                <Repeat className="w-3.5 h-3.5" />
              ) : op.type === 'Move Text Location' ? (
                <CornerDownRight className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-100 truncate flex items-center gap-1.5">
                <span>{op.label}</span>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 truncate">
                {op.type} · 4D: ({op.coord.x}, {op.coord.y}, {op.coord.z})
              </div>
            </div>
          </div>

          {/* Quick Actions (Edit, Move Up, Move Down, Insert, Cut) */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
            {onMoveUpOp && index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUpOp(index);
                }}
                title="Move operation up"
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
            {onMoveDownOp && index < operations.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDownOp(index);
                }}
                title="Move operation down"
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
            {onEditOp && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditOp(op);
                }}
                title="Edit operation parameters collaboratively"
                className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-700"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInsertAfter(index);
              }}
              title="Insert operation after this step"
              className="p-1 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-700"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOp(index);
              }}
              title="Delete / cut operation"
              className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-700"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Detailed parameters display */}
        {op.params.arithmeticOp && (
          <div className="mt-1.5 pt-1.5 border-t border-neutral-800 flex items-center gap-2 text-[11px] font-mono">
            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-blue-300 font-bold">
              OP: {op.params.arithmeticOp}
            </span>
            {op.params.arithmeticValue !== undefined && (
              <span className="text-neutral-300">VAL: {String(op.params.arithmeticValue)}</span>
            )}
          </div>
        )}
        {op.params.offset && (
          <div className="mt-1.5 pt-1.5 border-t border-neutral-800 text-[11px] font-mono text-cyan-300">
            Cursor Offset: [+{op.params.offset.dLine}, +{op.params.offset.dCol}]
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 border-r border-neutral-800 overflow-hidden select-none">
      {/* Flowchart Header / Legend */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900/70 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>TWB Recorder (Figure 1 Flowchart)</span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Procedural map with guarded branch columns & reversible delta logging
          </p>
        </div>
        <div className="text-[11px] font-mono bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-neutral-300">
          PC: <span className="text-amber-400 font-bold">{currentOpIndex}</span> / {operations.length}
        </div>
      </div>

      {/* Flowchart Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Pre-branch Operations (or full linear listing if not Fig1) */}
        {!isFig1 ? (
          <div className="space-y-2.5">
            {operations.map((op, idx) => (
              <React.Fragment key={op.id}>
                {renderOpCard(op, idx)}
                {idx < operations.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-3 bg-neutral-700" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Setup / Show Operations */}
            {preBranchOps.map((op, idx) => {
              const fullIdx = operations.indexOf(op);
              return (
                <React.Fragment key={op.id}>
                  {renderOpCard(op, fullIdx)}
                  <div className="flex justify-center">
                    <div className="w-0.5 h-3 bg-neutral-700" />
                  </div>
                </React.Fragment>
              );
            })}

            {/* Branch Header Node (Lookup Operation) */}
            {branchLookupOp && (
              <div className="my-2 p-2.5 rounded border border-purple-600/60 bg-purple-950/30 text-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Branch Predicate Evaluator</span>
                </div>
                <div className="text-xs text-neutral-300 font-mono">
                  Test Key: <strong className="text-purple-300">Index</strong>
                </div>
              </div>
            )}

            {/* Carlson's Figure 1 Branch Columns Layout */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Left Column: Index 24 (Terminating / Empty Branch) */}
              <div className="flex flex-col border border-dashed border-neutral-700 rounded-lg p-2.5 bg-neutral-900/40">
                <div className="bg-neutral-800 border border-neutral-700 rounded p-2 text-center mb-2">
                  <div className="text-xs font-bold text-neutral-200 font-mono">Index</div>
                  <div className="text-sm font-black text-rose-400 font-mono">24</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">↓ is 24</div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  <div className="text-xs font-mono text-neutral-400 italic">
                    [ Empty Branch ]
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 max-w-[130px]">
                    Mapping finishes when accumulator reaches 24
                  </div>
                  <div className="w-0.5 h-8 bg-neutral-700 my-2" />
                  <div className="px-2 py-1 bg-emerald-950/60 border border-emerald-700/60 rounded text-[11px] font-mono text-emerald-400">
                    TERMINATE
                  </div>
                </div>
              </div>

              {/* Right Column: Index Anything (not 24) -> Loop Operations */}
              <div className="flex flex-col border border-amber-600/40 rounded-lg p-2.5 bg-neutral-900/60 shadow-inner">
                <div className="bg-neutral-800 border border-neutral-700 rounded p-2 text-center mb-2">
                  <div className="text-xs font-bold text-neutral-200 font-mono">Index</div>
                  <div className="text-sm font-black text-amber-400 font-mono">Anything</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">↓ not 24</div>
                </div>

                <div className="space-y-2">
                  {loopBranchOps.map((op, bIdx) => {
                    const fullIdx = operations.indexOf(op);
                    return (
                      <React.Fragment key={op.id}>
                        {renderOpCard(op, fullIdx, true)}
                        {bIdx < loopBranchOps.length - 1 && (
                          <div className="flex justify-center">
                            <div className="w-0.5 h-2 bg-neutral-700" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
