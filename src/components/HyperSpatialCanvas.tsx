/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Hyper-Spatial Canvas Component
 * Interactive 4D/3D projection engine visualizing the 4 dimensions of Carlson's
 * visual mapping language: Domain (X), Tape (Y), Hierarchy (Z), and Reversible Time (T).
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Rotate3d,
  Maximize2,
  Minimize2,
  Eye,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { MapOperation, ExecutionDelta, Coord4D, ProgrammerPresence } from '../types';

interface HyperSpatialCanvasProps {
  operations: MapOperation[];
  currentOpIndex: number;
  currentCoord: Coord4D;
  executionHistory: ExecutionDelta[];
  otherProgrammers?: ProgrammerPresence[];
  onSelectOp: (index: number) => void;
}

type ProjectionViewMode = '4D_ISOMETRIC' | 'XY_FLOWCHART' | 'XZ_DOMAIN_MATRIX' | 'ZT_STRUCTURAL_TRACE';

export const HyperSpatialCanvas: React.FC<HyperSpatialCanvasProps> = ({
  operations,
  currentOpIndex,
  currentCoord,
  executionHistory,
  otherProgrammers = [],
  onSelectOp
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<ProjectionViewMode>('4D_ISOMETRIC');
  const [rotX, setRotX] = useState<number>(0.45);
  const [rotY, setRotY] = useState<number>(-0.6);
  const [zoom, setZoom] = useState<number>(1.1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ id: string; label: string; index: number } | null>(null);

  // Set rotation based on view mode presets
  const handleSetViewMode = (mode: ProjectionViewMode) => {
    setViewMode(mode);
    if (mode === '4D_ISOMETRIC') {
      setRotX(0.45);
      setRotY(-0.6);
    } else if (mode === 'XY_FLOWCHART') {
      setRotX(0);
      setRotY(0);
    } else if (mode === 'XZ_DOMAIN_MATRIX') {
      setRotX(1.57); // 90 degrees pitch
      setRotY(0);
    } else if (mode === 'ZT_STRUCTURAL_TRACE') {
      setRotX(0);
      setRotY(1.57); // 90 degrees yaw
    }
  };

  // Node positions in 3D mapped from 4D coordinates
  const nodes3D = useMemo(() => {
    const spacingY = 32;
    const startY = -((operations.length - 1) * spacingY) / 2;

    return operations.map((op, idx) => {
      // X: Domain / Branch: -2 (Input Doc), -1 (Form), 0 (Branch), +1 (Calc), +2 (Output Doc)
      const posX = op.coord.x * 75;
      // Y: Tape progression
      const posY = startY + idx * spacingY;
      // Z: Hierarchy / Depth
      const posZ = op.coord.z * 60;

      return {
        id: op.id,
        index: idx,
        label: op.label,
        type: op.type,
        coord4D: op.coord,
        x: posX,
        y: posY,
        z: posZ
      };
    });
  }, [operations]);

  // Handle canvas mouse drag for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY((prev) => prev + dx * 0.008);
    setRotX((prev) => Math.max(-1.5, Math.min(1.5, prev + dy * 0.008)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 3D Projection math
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const project = (x: number, y: number, z: number) => {
        // Rotate around Y axis
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        // Rotate around X axis
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const cameraDist = 650;
        const perspective = cameraDist / (cameraDist + z2);
        const screenX = centerX + x1 * perspective * zoom;
        const screenY = centerY + y2 * perspective * zoom;

        return { x: screenX, y: screenY, z: z2, scale: perspective * zoom };
      };

      // 1. Draw 4D Hyper-Spatial Domain Planes (Grid Planes for each Domain X)
      const domains = [
        { x: -2, label: 'Input Doc (X=-2)', color: 'rgba(56, 189, 248, 0.08)' },
        { x: -1, label: 'Form / Outline (X=-1)', color: 'rgba(168, 85, 247, 0.08)' },
        { x: 0, label: 'Branch Dispatcher (X=0)', color: 'rgba(234, 179, 8, 0.12)' },
        { x: 1, label: 'Calculators (X=1)', color: 'rgba(59, 130, 246, 0.08)' },
        { x: 2, label: 'Output Doc (X=2)', color: 'rgba(16, 185, 129, 0.08)' }
      ];

      domains.forEach((dom) => {
        const domX = dom.x * 75;
        const p1 = project(domX, -220, -100);
        const p2 = project(domX, 220, -100);
        const p3 = project(domX, 220, 100);
        const p4 = project(domX, -220, 100);

        ctx.fillStyle = dom.color;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Domain label at top
        const labelP = project(domX, -230, 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dom.label, labelP.x, labelP.y);
      });

      // 2. Draw 4D Spacetime Worldline (Temporal Execution Trajectory)
      if (executionHistory.length > 0) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'; // Glowing amber timeline
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();

        executionHistory.forEach((delta, hIdx) => {
          const targetNode = nodes3D.find((n) => n.id === delta.opId);
          if (targetNode) {
            // Add temporal offset along Z or visual pulse
            const proj = project(targetNode.x, targetNode.y, targetNode.z);
            if (hIdx === 0) {
              ctx.moveTo(proj.x, proj.y);
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Draw Static Instruction Wireflow (Y progression connections)
      for (let i = 0; i < nodes3D.length - 1; i++) {
        const curr = nodes3D[i];
        const next = nodes3D[i + 1];
        const pCurr = project(curr.x, curr.y, curr.z);
        const pNext = project(next.x, next.y, next.z);

        ctx.strokeStyle = 'rgba(115, 115, 115, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pCurr.x, pCurr.y);
        ctx.lineTo(pNext.x, pNext.y);
        ctx.stroke();
      }

      // 4. Draw Loop Recursive Back-Edge
      const loopNode = nodes3D.find((n) => n.type === 'Loop');
      const lookupNode = nodes3D.find((n) => n.type === 'Lookup');
      if (loopNode && lookupNode) {
        const pLoop = project(loopNode.x, loopNode.y, loopNode.z);
        const pLookup = project(lookupNode.x, lookupNode.y, lookupNode.z);
        const pControl = project(loopNode.x - 90, (loopNode.y + lookupNode.y) / 2, 80);

        ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pLoop.x, pLoop.y);
        ctx.quadraticCurveTo(pControl.x, pControl.y, pLookup.x, pLookup.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Draw Program Nodes (Sorted by Z for correct depth buffering)
      const projectedNodes = nodes3D.map((n) => ({
        ...n,
        proj: project(n.x, n.y, n.z)
      }));
      projectedNodes.sort((a, b) => b.proj.z - a.proj.z);

      projectedNodes.forEach((node) => {
        const isCurrent = node.index === currentOpIndex;
        const radius = (isCurrent ? 9 : 6) * node.proj.scale;

        // Current step glowing aura
        if (isCurrent) {
          ctx.beginPath();
          ctx.arc(node.proj.x, node.proj.y, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.proj.x, node.proj.y, radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.fill();
        }

        // Node circle color-coded by operation type
        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, radius, 0, Math.PI * 2);

        if (isCurrent) {
          ctx.fillStyle = '#f59e0b'; // Amber
        } else if (node.type === 'Arithmetic') {
          ctx.fillStyle = '#3b82f6'; // Blue
        } else if (node.type === 'Copy') {
          ctx.fillStyle = '#10b981'; // Green
        } else if (node.type === 'Lookup') {
          ctx.fillStyle = '#a855f7'; // Purple
        } else if (node.type === 'Loop') {
          ctx.fillStyle = '#eab308'; // Yellow
        } else {
          ctx.fillStyle = '#64748b'; // Slate
        }
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.stroke();

        // Node label
        ctx.fillStyle = isCurrent ? '#fef08a' : '#d1d5db';
        ctx.font = `${Math.max(9, Math.floor(11 * node.proj.scale))}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(
          `${node.index}. ${node.label.slice(0, 24)}`,
          node.proj.x + radius + 4,
          node.proj.y + 4
        );

        // Remote Programmer Presence Indicator
        const progsOnThisNode = otherProgrammers.filter((p) => p.focusedOpId === node.id);
        if (progsOnThisNode.length > 0) {
          progsOnThisNode.forEach((prog, pIdx) => {
            const badgeY = node.proj.y - radius - 14 - pIdx * 14;
            ctx.fillStyle = prog.color;
            ctx.beginPath();
            ctx.roundRect(node.proj.x - 20, badgeY, 60, 12, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${prog.avatar || ''} ${prog.name.slice(0, 8)}`, node.proj.x + 10, badgeY + 9);
          });
        }
      });

      // 6. Draw 4D Axes Indicator (bottom left corner)
      const originX = 60;
      const originY = height - 60;
      const axisLen = 35;

      const projAxis = (ax: number, ay: number, az: number) => {
        const x1 = ax * cosY + az * sinY;
        const z1 = -ax * sinY + az * cosY;
        const y2 = ay * cosX - z1 * sinX;
        return { x: originX + x1 * axisLen, y: originY + y2 * axisLen };
      };

      const axX = projAxis(1, 0, 0);
      const axY = projAxis(0, 1, 0);
      const axZ = projAxis(0, 0, 1);

      // X Axis (Red/Cyan - Domain)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(axX.x, axX.y);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('X (Domain)', axX.x + 3, axX.y);

      // Y Axis (Green - Instruction Tape)
      ctx.strokeStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(axY.x, axY.y);
      ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.fillText('Y (Tape)', axY.x + 3, axY.y);

      // Z Axis (Purple - Hierarchy Depth)
      ctx.strokeStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(axZ.x, axZ.y);
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.fillText('Z (Depth)', axZ.x + 3, axZ.y);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes3D, currentOpIndex, executionHistory, rotX, rotY, zoom, otherProgrammers]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-neutral-950 overflow-hidden flex flex-col select-none"
    >
      {/* 4D Canvas Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View Mode Presets */}
        <div className="pointer-events-auto flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-1 rounded-lg border border-neutral-800 shadow-md">
          <button
            onClick={() => handleSetViewMode('4D_ISOMETRIC')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              viewMode === '4D_ISOMETRIC'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            4D Spacetime View
          </button>
          <button
            onClick={() => handleSetViewMode('XY_FLOWCHART')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'XY_FLOWCHART'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            XY Flowchart
          </button>
          <button
            onClick={() => handleSetViewMode('XZ_DOMAIN_MATRIX')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'XZ_DOMAIN_MATRIX'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            XZ Domain Matrix
          </button>
          <button
            onClick={() => handleSetViewMode('ZT_STRUCTURAL_TRACE')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'ZT_STRUCTURAL_TRACE'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ZT Hierarchy Trace
          </button>
        </div>

        {/* Zoom & Orbit Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-1 rounded-lg border border-neutral-800 shadow-md text-xs">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Zoom In"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Zoom Out"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setRotX(0.45);
              setRotY(-0.6);
              setZoom(1.1);
            }}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Reset 4D Camera"
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 4D Dimension Dimension Guide Footer */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-400 shadow-lg max-w-xs space-y-1">
        <div className="flex items-center gap-1 text-neutral-200 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>4-Dimensional Coordinate Space</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sky-400">X (Domain):</span>
          <span>Input ↔ Branch ↔ Calc ↔ Output</span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-400">Y (Sequence):</span>
          <span>Instruction Flow / Tape Lines</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-400">Z (Hierarchy):</span>
          <span>Structural Scope & Nesting Depth</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-400">T (Reversibility):</span>
          <span>Time-Travel Execution Timeline</span>
        </div>
      </div>
    </div>
  );
};
