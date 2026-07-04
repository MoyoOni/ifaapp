import React, { useState, useEffect } from 'react';
import { NotebookPen, ChevronDown, ChevronUp, Save, Clock } from 'lucide-react';

interface ConsultationNotepadProps {
  /** The babalawo's own user ID — used as part of the storage key */
  babalawoId?: string;
  /** The client's user ID */
  clientId: string;
  /** Display name of the client or context label */
  clientName: string;
  /** Optional appointment ID to scope notes per-session */
  appointmentId?: string;
  /** Label shown on the toggle button */
  label?: string;
  /** Placeholder text for the textarea */
  placeholder?: string;
}

interface NoteEntry {
  text: string;
  savedAt: string; // ISO string
}

function storageKey(babalawoId: string | undefined, clientId: string, appointmentId?: string) {
  if (appointmentId) return `session_notes_${clientId}_${appointmentId}`;
  return `consult_notes_${babalawoId ?? 'anon'}_${clientId}`;
}

export const ConsultationNotepad: React.FC<ConsultationNotepadProps> = ({
  babalawoId,
  clientId,
  clientName,
  appointmentId,
  label = 'Private Notes',
  placeholder,
}) => {
  const key = storageKey(babalawoId, clientId, appointmentId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState<NoteEntry | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Load persisted note on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSaved(JSON.parse(raw) as NoteEntry);
    } catch { /* ignore */ }
  }, [key]);

  // Populate draft when panel opens. Intentionally keyed only on `open` --
  // this should fire once per open, not on every keystroke (`draft`) or
  // every save (`saved`); the `!draft` guard already prevents clobbering
  // in-progress edits.
  useEffect(() => {
    if (open && saved && !draft) setDraft(saved.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    const entry: NoteEntry = { text: draft.trim(), savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      setSaved(entry);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch { /* ignore */ }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="border-t border-border/50 mt-4 pt-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <span className="flex items-center gap-1.5">
          <NotebookPen size={13} />
          {label}
          {saved?.text && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder ?? `Private notes about ${clientName}. Only you can see these.`}
            rows={4}
            maxLength={2000}
            className="w-full p-3 text-xs bg-muted/40 border border-border rounded-xl resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card transition-all"
          />
          <div className="flex items-center justify-between">
            {saved?.savedAt ? (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock size={10} />
                Last saved {formatDate(saved.savedAt)}
              </p>
            ) : <span />}
            <button
              type="button"
              disabled={!draft.trim() || draft.trim() === saved?.text}
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={12} />
              {justSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Notes are stored privately on this device. They are never shared with the seeker.
          </p>
        </div>
      )}
    </div>
  );
};
