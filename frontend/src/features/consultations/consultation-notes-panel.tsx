import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface ConsultationNote {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ConsultationNotesPanelProps {
  babalawoId: string;
  clientId: string;
}

const ConsultationNotesPanel: React.FC<ConsultationNotesPanelProps> = ({ babalawoId, clientId }) => {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState({ title: '', content: '' });

  // Fetch notes for the client
  const { data: notes = [], isLoading, isError } = useQuery<ConsultationNote[]>({
    queryKey: ['consultation-notes', babalawoId, clientId],
    queryFn: async () => {
      const response = await api.get(`/consultation-notes/babalawo/${babalawoId}/client/${clientId}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating a new note
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title?: string; content: string }) => {
      const response = await api.post(`/consultation-notes/babalawo/${babalawoId}/client/${clientId}`, noteData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-notes', babalawoId, clientId] });
      setNewNote({ title: '', content: '' });
    },
  });

  // Mutation for updating a note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; content?: string } }) => {
      const response = await api.put(`/consultation-notes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-notes', babalawoId, clientId] });
      setEditingNoteId(null);
    },
  });

  // Mutation for deleting a note
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/consultation-notes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-notes', babalawoId, clientId] });
    },
  });

  const handleSubmitNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;

    createNoteMutation.mutate({
      title: newNote.title || undefined,
      content: newNote.content,
    });
  };

  const handleUpdateNote = (id: string) => {
    updateNoteMutation.mutate({
      id,
      data: { title: editContent.title || undefined, content: editContent.content },
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) return <div className="bg-card rounded-xl border border-border p-4 text-muted-foreground text-sm">Loading notes...</div>;
  if (isError) return <div className="bg-card rounded-xl border border-border p-4 text-destructive text-sm">Failed to load notes</div>;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="text-lg">📓</span> Private Notes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Only you can see these notes about your client.
        </p>
      </div>

      {/* Add new note form */}
      <div className="mb-8 border border-border rounded-xl p-4 bg-muted/40">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Add note for today</p>
        <form onSubmit={handleSubmitNewNote}>
          <input
            type="text"
            placeholder="Title (optional)"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            placeholder="Note content..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            rows={3}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <button
            type="submit"
            disabled={createNoteMutation.isPending || !newNote.content.trim()}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createNoteMutation.isPending ? 'Saving...' : 'Add Note'}
          </button>
        </form>
      </div>

      {/* Display existing notes */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Previous Notes</p>

        {notes.length === 0 ? (
          <p className="text-muted-foreground italic text-sm">No notes yet. Add your first note above.</p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {notes.map((note) => (
              <div key={note.id} className="border border-border/60 rounded-xl p-4 bg-card shadow-sm">
                {editingNoteId === note.id ? (
                  // Edit mode
                  <div>
                    <input
                      type="text"
                      value={editContent.title}
                      onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                      placeholder="Title (optional)"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <textarea
                      value={editContent.content}
                      onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                      placeholder="Note content..."
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={updateNoteMutation.isPending}
                        className="px-3 py-1.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1.5 text-sm font-medium rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {note.title && (
                          <h4 className="font-bold text-foreground">{note.title}</h4>
                        )}
                        <p className="text-xs text-muted-foreground">
                          [{formatDate(note.createdAt)}]
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditContent({ title: note.title || '', content: note.content });
                          }}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium ml-2"
                        >
                          {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                      {note.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationNotesPanel;
