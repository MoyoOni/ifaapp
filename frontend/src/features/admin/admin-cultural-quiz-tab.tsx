import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Pencil, Trash2, RotateCcw, BarChart2, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  sortOrder: number;
  isActive: boolean;
}

interface QuizStats {
  totalAttempted: number;
  passed: number;
  failed: number;
  passRate: number;
  avgFailsBeforePass: number;
  maxFails: number;
  currentThreshold: number;
}

const EMPTY_FORM = { questionText: '', options: ['', '', '', ''], correctIndex: 0 };

export default function AdminCulturalQuizTab() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [resetUserId, setResetUserId] = useState('');
  const [threshold, setThreshold] = useState<number | null>(null);

  const { data: questions = [], isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ['admin', 'quiz', 'questions'],
    queryFn: () => api.get('/admin/quiz/questions').then(r => r.data),
  });

  const { data: stats } = useQuery<QuizStats>({
    queryKey: ['admin', 'quiz', 'stats'],
    queryFn: () => api.get('/admin/quiz/stats').then(r => r.data),
    onSuccess: (d: QuizStats) => { if (threshold === null) setThreshold(d.currentThreshold); },
  } as any);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'quiz'] });

  const createQ = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/admin/quiz/questions', data),
    onSuccess: () => { success('Question created'); setShowNewForm(false); setForm(EMPTY_FORM); invalidate(); },
    onError: () => error('Failed to create question'),
  });

  const updateQ = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof EMPTY_FORM> }) => api.patch(`/admin/quiz/questions/${id}`, data),
    onSuccess: () => { success('Question updated'); setEditingId(null); invalidate(); },
    onError: () => error('Failed to update question'),
  });

  const deleteQ = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/quiz/questions/${id}`),
    onSuccess: () => { success('Question deleted'); invalidate(); },
    onError: () => error('Failed to delete question'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/quiz/questions/${id}`, { isActive }),
    onSuccess: () => { success('Updated'); invalidate(); },
    onError: () => error('Failed to update'),
  });

  const updateThreshold = useMutation({
    mutationFn: (t: number) => api.patch('/admin/quiz/threshold', { threshold: t }),
    onSuccess: () => { success('Pass threshold updated'); invalidate(); },
    onError: () => error('Failed to update threshold'),
  });

  const resetUser = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/quiz/users/${userId}/reset`),
    onSuccess: () => { success('User orientation status reset'); setResetUserId(''); },
    onError: () => error('Failed to reset user status'),
  });

  const startEdit = (q: QuizQuestion) => {
    setEditingId(q.id);
    setForm({ questionText: q.questionText, options: [...q.options], correctIndex: q.correctIndex });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const handleOptionChange = (i: number, value: string) => {
    const opts = [...form.options];
    opts[i] = value;
    setForm(f => ({ ...f, options: opts }));
  };

  const QuestionForm = ({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) => (
    <div className="space-y-4 p-4 bg-muted/40 rounded-xl border border-border">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Question</label>
        <textarea
          value={form.questionText}
          onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
          rows={2}
          aria-label="Question text"
          placeholder="Enter the question"
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground block">Options (select correct answer)</label>
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-answer"
              checked={form.correctIndex === i}
              onChange={() => setForm(f => ({ ...f, correctIndex: i }))}
              aria-label={`Mark option ${i + 1} as correct`}
              className="shrink-0"
            />
            <input
              type="text"
              value={opt}
              onChange={e => handleOptionChange(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              aria-label={`Option ${i + 1}`}
              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {form.correctIndex === i && <Check className="w-4 h-4 text-green-500 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.questionText.trim() || form.options.some(o => !o.trim())}
          className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Attempted', value: stats.totalAttempted, icon: BookOpen },
            { label: 'Pass Rate', value: `${stats.passRate}%`, icon: BarChart2 },
            { label: 'Passed', value: stats.passed, icon: Check },
            { label: 'Failed', value: stats.failed, icon: X },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pass threshold */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Pass Threshold</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Minimum correct answers needed to pass. Currently: <strong>{stats?.currentThreshold ?? threshold ?? 2}</strong> of {questions.filter(q => q.isActive).length} active questions.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={questions.length || 10}
            value={threshold ?? stats?.currentThreshold ?? 2}
            onChange={e => setThreshold(Number(e.target.value))}
            aria-label="Pass threshold"
            className="w-20 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => threshold !== null && updateThreshold.mutate(threshold)}
            disabled={updateThreshold.isPending}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {updateThreshold.isPending ? 'Saving…' : 'Update Threshold'}
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Quiz Questions ({questions.length})
          </h3>
          <button
            type="button"
            onClick={() => { setShowNewForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <Plus className="w-3 h-3" /> Add Question
          </button>
        </div>

        {showNewForm && (
          <div className="mb-4">
            <QuestionForm
              onSave={() => createQ.mutate(form)}
              onCancel={() => { setShowNewForm(false); setForm(EMPTY_FORM); }}
              saving={createQ.isPending}
            />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className={`border rounded-xl p-4 ${q.isActive ? 'border-border' : 'border-border/40 opacity-60'}`}>
                {editingId === q.id ? (
                  <QuestionForm
                    onSave={() => updateQ.mutate({ id: q.id, data: form })}
                    onCancel={cancelEdit}
                    saving={updateQ.isPending}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                          {q.questionText}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {(q.options as string[]).map((opt, i) => (
                            <li key={i} className={`text-xs flex items-center gap-1 ${i === q.correctIndex ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                              {i === q.correctIndex ? <Check className="w-3 h-3 shrink-0" /> : <span className="w-3 shrink-0" />}
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleActive.mutate({ id: q.id, isActive: !q.isActive })}
                          title={q.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          {q.isActive ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(q)}
                          aria-label="Edit question"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (window.confirm('Delete this question?')) deleteQ.mutate(q.id); }}
                          aria-label="Delete question"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {!questions.length && !showNewForm && (
              <p className="text-sm text-muted-foreground">No questions yet. Add one above.</p>
            )}
          </div>
        )}
      </div>

      {/* Reset user */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Reset User Orientation Status
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          If a user claims they should have passed but were blocked, reset their status so they can retake.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="User ID"
            value={resetUserId}
            onChange={e => setResetUserId(e.target.value)}
            aria-label="User ID to reset"
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => resetUser.mutate(resetUserId.trim())}
            disabled={!resetUserId.trim() || resetUser.isPending}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {resetUser.isPending ? 'Resetting…' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
