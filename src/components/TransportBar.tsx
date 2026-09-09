/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Transport Bar Component
 * Reversible VCR controls (UNSTEP, UNPLAY, STOP, PLAY, STEP, UNDO, CUT)
 * and interactive Time Scrubber based on Carlson (2001).
 */

import React from 'react';
import {
  SkipBack,
  Play,
  Square,
  SkipForward,
  RotateCcw,
  Scissors,
  Plus,
  Clock,
  Rewind,
  FastForward,
  Compass
} from 'lucide-react';
import { Coord4D } from '../types';

interface TransportBarProps {
  isPlaying: boolean;
  isReversePlaying: boolean;
  currentStep: number;
  maxRecordedSteps: number;
  currentCoord: Coord4D;
  playbackSpeed: number;
  onPlay: () => void;
  onReversePlay: () => void;
  onStop: () => void;
  onStep: () => void;
  onUnstep: () => void;
  onUndo: () => void;
  onCut: () => void;
  onReset: () => void;
  onScrubTime: (step: number) => void;
  onSetSpeed: (speed: number) => void;
  onOpenAddModal: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isReversePlaying,
  currentStep,
  maxRecordedSteps,
  currentCoord,
  playbackSpeed,
  onPlay,
  onReversePlay,
  onStop,
  onStep,
  onUnstep,
  onUndo,
  onCut,
  onReset,
  onScrubTime,
  onSetSpeed,
  onOpenAddModal
}) => {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-100 p-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* VCR Tape Transport Controls */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800 shadow-inner">
          {/* UNSTEP (backward 1 step) */}
          <button
            id="transport-unstep-btn"
            onClick={onUnstep}
            disabled={currentStep <= 0}
            title="UNSTEP: Reverse step execution by 1 operation (CarIson 2001)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 disabled:hover:bg-neutral-800 transition"
          >
            <SkipBack className="w-3.5 h-3.5 text-amber-400" />
            <span>Unstep</span>
          </button>

          {/* UNPLAY (continuous reverse) */}
          <button
            id="transport-unplay-btn"
            onClick={isReversePlaying ? onStop : onReversePlay}
            disabled={currentStep <= 0}
            title="UNPLAY: Reverse playback across timeline"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              isReversePlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 text-amber-300'
            }`}
          >
            <Rewind className="w-3.5 h-3.5" />
            <span>{isReversePlaying ? 'Unplaying' : 'Unplay'}</span>
          </button>

          {/* STOP */}
          <button
            id="transport-stop-btn"
            onClick={onStop}
            title="STOP: Halt interpreter"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-neutral-800 hover:bg-red-950 hover:text-red-400 transition"
          >
            <Square className="w-3.5 h-3.5 text-red-400 fill-current" />
            <span>Stop</span>
          </button>

          {/* PLAY */}
          <button
            id="transport-play-btn"
            onClick={isPlaying ? onStop : onPlay}
            title="PLAY: Forward execution run"
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              isPlaying
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlaying ? 'Running' : 'Play'}</span>
          </button>

          {/* STEP */}
          <button
            id="transport-step-btn"
            onClick={onStep}
            title="STEP: Execute next operation"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition"
          >
            <span>Step</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-neutral-700 mx-1" />

          {/* UNDO */}
          <button
            id="transport-undo-btn"
            onClick={onUndo}
            disabled={currentStep <= 0}
            title="UNDO: Pop from interpreter undo stack"
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 text-neutral-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Undo</span>
          </button>

          {/* CUT */}
          <button
            id="transport-cut-btn"
            onClick={onCut}
            title="CUT: Remove current operation from mapping"
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
          >
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span>Cut</span>
          </button>

          {/* INSERT OP (Live injection) */}
          <button
            id="transport-add-op-btn"
            onClick={onOpenAddModal}
            title="Add new operation at current spacetime position (Carlson Page 4)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800/80 border border-indigo-700/50 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-300" />
            <span>Insert Op</span>
          </button>

          {/* RESET */}
          <button
            id="transport-reset-btn"
            onClick={onReset}
            title="Reset interpreter to initial step (t=0)"
            className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4D Coordinates & Time Scrubber */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {/* Time Scrubber */}
          <div className="flex-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono text-neutral-400 shrink-0">
              T: <strong className="text-amber-300">{currentStep}</strong> / {maxRecordedSteps}
            </span>
            <input
              id="transport-time-scrubber"
              type="range"
              min={0}
              max={Math.max(maxRecordedSteps, currentStep, 10)}
              value={currentStep}
              onChange={(e) => onScrubTime(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-mono">Speed:</span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                  playbackSpeed === spd
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* 4D Coordinate Display Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 font-mono text-xs text-neutral-300">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-neutral-500">4D:</span>
            <span>
              X:<span className="text-sky-400 font-semibold">{currentCoord.x}</span>
            </span>
            <span>
              Y:<span className="text-emerald-400 font-semibold">{currentCoord.y}</span>
            </span>
            <span>
              Z:<span className="text-purple-400 font-semibold">{currentCoord.z}</span>
            </span>
            <span>
              T:<span className="text-amber-400 font-semibold">{currentCoord.t}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
