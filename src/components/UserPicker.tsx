import React, { useState, useEffect } from 'react';
import { userService } from '../lib/firestore';
import { UserProfile } from '../types';
import { User, ChevronDown, Check, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UserPickerProps {
  selectedUserId?: string;
  onSelect: (user: UserProfile) => void;
  onClear?: () => void;
  onRemove?: (userUid: string) => void;
  label?: string;
  disabled?: boolean;
  mode?: 'single' | 'participants';
  participantIds?: string[];
}

export default function UserPicker({ 
  selectedUserId, 
  onSelect, 
  onClear, 
  onRemove,
  label, 
  disabled, 
  mode = 'single',
  participantIds = []
}: UserPickerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = userService.getUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <div className="relative">
      {label && <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1 block">{label}</label>}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
          mode === 'participants' 
            ? "bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-[var(--accent)]/90 shadow-sm"
            : "w-full justify-between bg-[var(--bg)] border-[var(--border)] text-[var(--text-main)] hover:border-[var(--accent)]",
          disabled && "opacity-60 cursor-not-allowed grayscale"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {mode === 'participants' ? (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Manage Team</span>
            </>
          ) : selectedUser ? (
            <>
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--bg)]">
                {selectedUser.photoURL ? (
                  <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--accent)] font-bold text-[8px]">
                    {(selectedUser.displayName || selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="truncate">{selectedUser.displayName || selectedUser.email}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-muted)]">Select team member...</span>
            </>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-[var(--text-muted)] transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={cn(
                "absolute mt-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-2xl z-[80] max-h-80 overflow-y-auto p-1.5 min-w-[240px]",
                mode === 'participants' ? "right-0" : "left-0 right-0"
              )}
            >
              {loading ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] font-medium animate-pulse">Loading team members...</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">No team members available</div>
              ) : (
                <div className="space-y-1">
                  {users.map(user => {
                    const isParticipant = participantIds.includes(user.uid);
                    const isSelected = selectedUserId === user.uid;

                    return (
                      <div 
                        key={user.uid}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all group/item",
                          isSelected || (mode === 'participants' && isParticipant)
                            ? "bg-[var(--accent)]/5" 
                            : "hover:bg-[var(--bg)]"
                        )}
                      >
                        <button
                          onClick={() => {
                            onSelect(user);
                            if (mode === 'single') setIsOpen(false);
                          }}
                          className="flex-1 flex items-center gap-3 truncate text-left"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--bg)] shadow-sm">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--accent)] font-bold text-xs uppercase bg-[var(--accent)]/5">
                                {(user.displayName || user.email).charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <p className={cn(
                              "font-bold text-xs truncate",
                              (isSelected || (mode === 'participants' && isParticipant)) ? "text-[var(--accent)]" : "text-[var(--text-main)]"
                            )}>
                              {user.displayName || 'Unnamed User'}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {isSelected && mode === 'single' && (
                            <div className="flex items-center gap-1">
                              <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onClear) onClear();
                                  setIsOpen(false);
                                }}
                                className="p-1.5 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-all shadow-sm border border-red-500/20 active:scale-95"
                                title="Unassign"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          
                          {mode === 'participants' && isParticipant && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRemove) onRemove(user.uid);
                              }}
                              className="p-1.5 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-all shadow-sm border border-red-500/20 active:scale-95"
                              title="Remove from project"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {mode === 'participants' && !isParticipant && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(user);
                              }}
                              className="p-1.5 hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white rounded-md transition-all shadow-sm border border-[var(--accent)]/20 active:scale-95"
                              title="Add to project"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
        </>
      )}
    </AnimatePresence>
  </div>
);
}
