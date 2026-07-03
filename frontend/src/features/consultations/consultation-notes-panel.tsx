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
  const { data: notes = [], isLoading, isError, refetch } = useQuery<ConsultationNote[]>({
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
      data: { title: editContent.title || undefined, content: editContent.content } 
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) return <div className="p-4">Loading notes...</div>;
  if (isError) return <div className="p-4 text-red-500">Failed to load notes</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-lg">📓</span> Private Notes
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Only you can see these notes about your client.
        </p>
      </div>

      {/* Add new note form */}
      <div className="mb-8 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add note for today</h3>
        <form onSubmit={handleSubmitNewNote}>
          <input
            type="text"
            placeholder="Title (optional)"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full p-2 mb-3 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600"
          />
          <textarea
            placeholder="Note content..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            rows={3}
            className="w-full p-2 mb-3 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600"
          />
          <button
            type="submit"
            disabled={createNoteMutation.isPending || !newNote.content.trim()}
            className={`px-4 py-2 rounded ${
              createNoteMutation.isPending || !newNote.content.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {createNoteMutation.isPending ? 'Saving...' : 'Add Note'}
          </button>
        </form>
      </div>

      {/* Display existing notes */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Previous Notes</h3>
        
        {notes.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 italic">No notes yet. Add your first note above.</p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 bg-white dark:bg-gray-700 shadow-sm">
                {editingNoteId === note.id ? (
                  // Edit mode
                  <div>
                    <input
                      type="text"
                      value={editContent.title}
                      onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                      placeholder="Title (optional)"
                      className="w-full p-2 mb-3 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600"
                    />
                    <textarea
                      value={editContent.content}
                      onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                      rows={4}
                      className="w-full p-2 mb-3 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-600"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={updateNoteMutation.isPending}
                        className={`px-3 py-1 rounded ${
                          updateNoteMutation.isPending
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
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
                          <h4 className="font-semibold text-gray-900 dark:text-white">{note.title}</h4>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          [{formatDate(note.createdAt)}]
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditContent({ title: note.title || '', content: note.content });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                        >
                          {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300">
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