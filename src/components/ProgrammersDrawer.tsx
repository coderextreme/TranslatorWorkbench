/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Programmers Drawer Component
 * Manages concurrent programmer presence, profile editing, team chat,
 * activity feed, and collaborative debugger synchronization settings.
 */

import React, { useState } from 'react';
import {
  Users,
  X,
  MessageSquare,
  Activity,
  Send,
  UserCheck,
  Radio,
  ExternalLink,
  Edit3,
  Check,
  Eye,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  ProgrammerPresence,
  ProgrammerChatMessage,
  CollabActivityEvent
} from '../types';

interface ProgrammersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  myProfile: ProgrammerPresence;
  otherProgrammers: ProgrammerPresence[];
  isConnected: boolean;
  chatMessages: ProgrammerChatMessage[];
  activities: CollabActivityEvent[];
  executionSync: boolean;
  onToggleExecutionSync: (enabled: boolean) => void;
  onSendMessage: (text: string) => void;
  onUpdateMyProfile: (updates: Partial<ProgrammerPresence>) => void;
  onFocusOp: (opId: string) => void;
}

const COLOR_OPTIONS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#ef4444', // rose
  '#14b8a6'  // teal
];

const AVATAR_OPTIONS = ['👩‍💻', '👨‍🔬', '⚡', '📡', '🚀', '📚', '🧩', '🔧', '🎯', '✨'];

export const ProgrammersDrawer: React.FC<ProgrammersDrawerProps> = ({
  isOpen,
  onClose,
  myProfile,
  otherProgrammers,
  isConnected,
  chatMessages,
  activities,
  executionSync,
  onToggleExecutionSync,
  onSendMessage,
  onUpdateMyProfile,
  onFocusOp
}) => {
  const [activeTab, setActiveTab] = useState<'TEAM' | 'CHAT' | 'LOG'>('TEAM');
  const [chatInput, setChatInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(myProfile.name);
  const [tempRole, setTempRole] = useState(myProfile.role);
  const [tempAvatar, setTempAvatar] = useState(myProfile.avatar);
  const [tempColor, setTempColor] = useState(myProfile.color);

  if (!isOpen) return null;

  const totalProgrammers = 1 + otherProgrammers.length;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleSaveProfile = () => {
    onUpdateMyProfile({
      name: tempName.trim() || myProfile.name,
      role: tempRole.trim() || myProfile.role,
      avatar: tempAvatar,
      color: tempColor
    });
    setIsEditingProfile(false);
  };

  const handleOpenSecondWindow = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-100">
                Programmers Workspace
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                <span>{isConnected ? `${totalProgrammers} Online` : 'Reconnecting...'}</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Concurrent multi-programmer editing & live sync
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/50 p-1 text-xs">
        <button
          onClick={() => setActiveTab('TEAM')}
          className={`flex-1 py-1.5 px-3 rounded font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'TEAM'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team ({totalProgrammers})</span>
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-1.5 px-3 rounded font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'CHAT'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {chatMessages.length > 0 && (
            <span className="text-[10px] px-1.5 rounded-full bg-amber-500/30 text-amber-300 font-mono">
              {chatMessages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('LOG')}
          className={`flex-1 py-1.5 px-3 rounded font-medium flex items-center justify-center gap-1.5 transition ${
            activeTab === 'LOG'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Feed</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TEAM TAB */}
        {activeTab === 'TEAM' && (
          <div className="space-y-4">
            {/* My Profile Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  My Programmer Identity
                </span>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              {!isEditingProfile ? (
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: myProfile.color }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-inner shrink-0"
                  >
                    {myProfile.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {myProfile.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-sky-300 border border-neutral-700">
                        You
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {myProfile.role}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Handle / Name</label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Role Title</label>
                    <input
                      type="text"
                      value={tempRole}
                      onChange={(e) => setTempRole(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Avatar</label>
                    <div className="flex gap-1.5">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setTempAvatar(av)}
                          className={`w-7 h-7 rounded border text-sm flex items-center justify-center transition ${
                            tempAvatar === av
                              ? 'border-amber-400 bg-neutral-800 scale-110'
                              : 'border-neutral-700 hover:bg-neutral-800'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Accent Color</label>
                    <div className="flex gap-1.5">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTempColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border transition ${
                            tempColor === c
                              ? 'ring-2 ring-white scale-110'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    className="w-full mt-2 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Broadcast Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collaborative Debugger Sync Mode */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Collaborative Debugger</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={executionSync}
                    onChange={(e) => onToggleExecutionSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                {executionSync
                  ? 'Active: Play, Step, Unstep, and Time Scrubbing are broadcast live to all connected programmers.'
                  : 'Independent: Each programmer can scrub through reversible time without disrupting peers.'}
              </p>
            </div>

            {/* Connected Collaborators List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Active Collaborators ({otherProgrammers.length})
                </h3>
              </div>

              {otherProgrammers.length === 0 ? (
                <div className="p-5 border border-dashed border-neutral-800 rounded-xl text-center bg-neutral-950/40">
                  <p className="text-xs text-neutral-400">
                    No other programmers connected yet.
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Open a new window or share the URL to code together concurrently!
                  </p>
                  <button
                    onClick={handleOpenSecondWindow}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sky-400 text-xs font-semibold transition border border-neutral-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Second Programmer Window</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {otherProgrammers.map((prog) => (
                    <div
                      key={prog.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          style={{ backgroundColor: prog.color }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-inner"
                        >
                          {prog.avatar || '👨‍💻'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-200 truncate">
                            {prog.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {prog.role || 'Programmer'}
                          </div>
                          {prog.focusedOpId && (
                            <div className="text-[10px] text-amber-400 font-mono mt-0.5 truncate">
                              Target: {prog.focusedOpId}
                            </div>
                          )}
                        </div>
                      </div>

                      {prog.focusedOpId && (
                        <button
                          onClick={() => onFocusOp(prog.focusedOpId!)}
                          title="Follow to this programmer's active operation"
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sky-300 text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Follow</span>
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={handleOpenSecondWindow}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-sky-400 text-xs font-semibold transition border border-neutral-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Another Collaborator Window</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[50vh] pr-1">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No messages yet. Send a note to collaborators!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === myProfile.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5 font-mono">
                        <span
                          style={{ color: msg.senderColor }}
                          className="font-bold flex items-center gap-1"
                        >
                          <span>{msg.senderAvatar}</span>
                          <span>{msg.senderName}</span>
                        </span>
                        <span>· {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg text-xs max-w-[85%] break-words ${
                          isMe
                            ? 'bg-amber-600/30 border border-amber-500/40 text-neutral-100'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-2 border-t border-neutral-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message team programmers..."
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* LOG / AUDIT FEED TAB */}
        {activeTab === 'LOG' && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Collaborative Action Stream
            </h3>
            <div className="space-y-2">
              {activities.slice().reverse().map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs font-mono flex items-start gap-2"
                >
                  <div
                    style={{ backgroundColor: act.programmerColor }}
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        style={{ color: act.programmerColor }}
                        className="font-bold truncate"
                      >
                        {act.programmerName}
                      </span>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-neutral-300 mt-0.5">{act.action}</div>
                    {act.target && (
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Target: {act.target}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
