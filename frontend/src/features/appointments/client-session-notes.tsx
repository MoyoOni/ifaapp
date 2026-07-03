import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Textarea } from '../../shared/components/ui/textarea';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { Clock, Save, Edit3, Trash2, Plus, Calendar } from 'lucide-react';
import api from '@/lib/api';

interface ClientSessionNote {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  appointment: {
    id: string;
    date: string;
    notes?: string;
  };
}

interface ClientSessionNotesProps {
  appointmentId: string;
  clientId: string;
}

const ClientSessionNotes: React.FC<ClientSessionNotesProps> = ({ appointmentId }) => {
  const [notes, setNotes] = useState<ClientSessionNote[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get<ClientSessionNote[]>(`/appointments/${appointmentId}/notes`);
        setNotes(res.data);
      } catch {
        // notes remain empty
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [appointmentId]);

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<ClientSessionNote>(`/appointments/${appointmentId}/notes`, newNote);
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editContent.content.trim()) return;
    setSaving(true);
    try {
      const res = await api.put<ClientSessionNote>(`/appointments/${appointmentId}/notes/${editingNoteId}`, editContent);
      setNotes(notes.map(n => n.id === editingNoteId ? res.data : n));
      setEditingNoteId(null);
      setEditContent({ title: '', content: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await api.delete(`/appointments/${appointmentId}/notes/${noteId}`);
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const startEditing = (note: ClientSessionNote) => {
    setEditingNoteId(note.id);
    setEditContent({ title: note.title || '', content: note.content });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Plus size={18} /> Add New Note</CardTitle>
          <CardDescription>Write your personal reflections about this session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} placeholder="Note title (optional)" />
          <Textarea value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} placeholder="Write your personal reflections…" rows={4} />
          <div className="flex justify-end">
            <Button onClick={handleCreateNote} disabled={!newNote.content.trim() || saving} className="flex items-center gap-2">
              <Save size={16} /> {saving ? 'Saving…' : 'Save Note'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Your Session Notes</h3>
          <Badge variant="secondary">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</Badge>
        </div>

        {notes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You haven't written any personal notes yet. Your reflections will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{note.title || 'Personal Reflection'}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs"><Calendar size={12} />{formatDate(note.createdAt)}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock size={12} />
                          {new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime()
                            ? `Updated ${formatDate(note.updatedAt)}`
                            : `Created ${formatDate(note.createdAt)}`}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditing(note)} className="h-8 w-8 p-0"><Edit3 size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <Input value={editContent.title} onChange={(e) => setEditContent({ ...editContent, title: e.target.value })} placeholder="Note title (optional)" />
                      <Textarea value={editContent.content} onChange={(e) => setEditContent({ ...editContent, content: e.target.value })} rows={6} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                        <Button onClick={handleUpdateNote} disabled={!editContent.content.trim() || saving}>{saving ? 'Saving…' : 'Update'}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none whitespace-pre-line">{note.content}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSessionNotes;
