import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BarChart2, Star, Trash2, UserPlus, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

type SubTab = 'courses' | 'enrollments' | 'certificates';

interface Course { id: string; title: string; status: string; isFeatured: boolean; instructor: { name: string }; _count: { enrollments: number } }
interface EnrollmentStat { courseId: string; title: string; enrollments: number; completions: number; completionRate: number; revenue: number }

const COURSE_CATEGORIES = ['Foundational', 'Spiritual Practice', 'Advanced Priestly', 'Cultural Studies'];
const COURSE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const EMPTY_COURSE_FORM = {
  title: '', description: '', category: COURSE_CATEGORIES[0], level: 'BEGINNER',
  price: '0', currency: 'NGN', duration: '',
};

function CreateCourseForm({ onDone }: { onDone: () => void }) {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_COURSE_FORM);
  const create = useMutation({
    mutationFn: () => api.post('/academy/courses', {
      title: form.title,
      slug: slugify(form.title),
      description: form.description,
      category: form.category,
      level: form.level,
      price: Number(form.price) || 0,
      currency: form.currency,
      duration: form.duration ? Number(form.duration) : undefined,
    }),
    onSuccess: () => {
      success('Course created and live');
      qc.invalidateQueries({ queryKey: ['admin', 'academy-courses'] });
      onDone();
    },
    onError: (err: any) => error(err?.response?.data?.message || 'Failed to create course'),
  });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" />New Course</h4>
      <div>
        <label htmlFor="course-title" className="text-xs text-muted-foreground">Title *</label>
        <input id="course-title" type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Introduction to Ifá"
          className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label htmlFor="course-description" className="text-xs text-muted-foreground">Description *</label>
        <textarea id="course-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
          className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="course-category" className="text-xs text-muted-foreground">Category</label>
          <select id="course-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="course-level" className="text-xs text-muted-foreground">Level</label>
          <select id="course-level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            {COURSE_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="course-price" className="text-xs text-muted-foreground">Price</label>
          <input id="course-price" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="course-currency" className="text-xs text-muted-foreground">Currency</label>
          <input id="course-currency" type="text" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="course-duration" className="text-xs text-muted-foreground">Hours</label>
          <input id="course-duration" type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">Cancel</button>
        <button type="button" onClick={() => create.mutate()} disabled={!form.title.trim() || !form.description.trim() || create.isPending}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
          {create.isPending ? 'Creating…' : 'Create Course'}
        </button>
      </div>
    </div>
  );
}

function CoursesTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useQuery<{ courses: Course[]; total: number }>({
    queryKey: ['admin', 'academy-courses', page],
    queryFn: () => api.get(`/admin/academy/courses?page=${page}&limit=20`).then(r => r.data),
  });
  const feature = useMutation({
    mutationFn: ({ id, featuredUntil }: { id: string; featuredUntil: string | null }) =>
      api.patch(`/admin/academy/courses/${id}/feature`, { featuredUntil }),
    onSuccess: () => { success('Updated'); qc.invalidateQueries({ queryKey: ['admin', 'academy-courses'] }); },
    onError: () => error('Failed'),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/academy/courses/${id}`, { status, reason: 'Admin action' }),
    onSuccess: () => { success('Status updated'); qc.invalidateQueries({ queryKey: ['admin', 'academy-courses'] }); },
    onError: () => error('Failed'),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!showCreate && (
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" />New Course
          </button>
        )}
      </div>
      {showCreate && <CreateCourseForm onDone={() => setShowCreate(false)} />}
      {data?.courses.map(c => (
        <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.instructor.name} &middot; {c._count.enrollments} enrolled</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${c.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600' : c.status === 'ARCHIVED' ? 'bg-muted text-muted-foreground' : 'bg-blue-500/10 text-blue-600'}`}>{c.status}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => feature.mutate({ id: c.id, featuredUntil: c.isFeatured ? null : new Date(Date.now() + 30 * 86400000).toISOString() })} className={`p-1.5 rounded-lg ${c.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-muted'}`} title={c.isFeatured ? 'Unfeature' : 'Feature 30d'}>
              <Star className="w-4 h-4" />
            </button>
            {c.status !== 'ARCHIVED' && (
              <button type="button" onClick={() => updateStatus.mutate({ id: c.id, status: 'ARCHIVED' })} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10" title="Archive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:opacity-40">Previous</button>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        <button type="button" onClick={() => setPage(p => p + 1)} disabled={(page * 20) >= (data?.total ?? 0)} className="text-sm text-primary disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function EnrollmentsTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [userId, setUserId] = useState('');
  const { data, isLoading } = useQuery<EnrollmentStat[]>({
    queryKey: ['admin', 'enrollment-stats'],
    queryFn: () => api.get('/admin/academy/enrollment-stats').then(r => r.data),
  });
  const enroll = useMutation({
    mutationFn: () => api.post('/admin/academy/enroll', { courseId, userId }),
    onSuccess: () => { success('Enrolled'); setCourseId(''); setUserId(''); qc.invalidateQueries({ queryKey: ['admin', 'enrollment-stats'] }); },
    onError: () => error('Failed to enroll'),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" />Manual Enrol</h4>
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Course ID" value={courseId} onChange={e => setCourseId(e.target.value)} className="flex-1 min-w-32 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="text" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} className="flex-1 min-w-32 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="button" onClick={() => enroll.mutate()} disabled={!courseId || !userId || enroll.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Enrol</button>
        </div>
      </div>
      <div className="space-y-3">
        {data?.map(s => (
          <div key={s.courseId} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground truncate flex-1 mr-4">{s.title}</p>
              <p className="text-sm font-bold text-primary shrink-0">NGN {s.revenue.toLocaleString()}</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{s.enrollments} enrolled</span>
              <span>{s.completions} completed</span>
              <span className={`font-semibold ${s.completionRate >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>{s.completionRate.toFixed(0)}% completion</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificatesTab() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const [enrollmentId, setEnrollmentId] = useState('');
  const issue = useMutation({
    mutationFn: () => api.post(`/admin/academy/certificates/${enrollmentId}`),
    onSuccess: () => { success('Certificate issued'); setEnrollmentId(''); },
    onError: () => error('Failed'),
  });
  const revoke = useMutation({
    mutationFn: (eid: string) => api.delete(`/admin/academy/certificates/${eid}`, { data: { reason: 'Admin revocation' } }),
    onSuccess: () => { success('Certificate revoked'); qc.invalidateQueries({ queryKey: ['admin', 'academy-courses'] }); },
    onError: () => error('Failed'),
  });
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Issue Certificate</h4>
        <div className="flex gap-2">
          <input type="text" placeholder="Enrollment ID" value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)} className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="button" onClick={() => issue.mutate()} disabled={!enrollmentId || issue.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Issue</button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Revoke Certificate</h4>
        <div className="flex gap-2">
          <input type="text" placeholder="Enrollment ID" className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" id="revoke-eid" />
          <button type="button" onClick={() => { const v = (document.getElementById('revoke-eid') as HTMLInputElement)?.value; if (v) revoke.mutate(v); }} disabled={revoke.isPending} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Revoke</button>
        </div>
      </div>
    </div>
  );
}

const SUB_TABS = [
  { id: 'courses' as SubTab, label: 'Courses', Icon: BookOpen },
  { id: 'enrollments' as SubTab, label: 'Enrollments', Icon: BarChart2 },
  { id: 'certificates' as SubTab, label: 'Certificates', Icon: Star },
];

export default function AdminAcademyTab() {
  const [sub, setSub] = useState<SubTab>('courses');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl flex-wrap w-fit">
        {SUB_TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setSub(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${sub === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {sub === 'courses' && <CoursesTab />}
      {sub === 'enrollments' && <EnrollmentsTab />}
      {sub === 'certificates' && <CertificatesTab />}
    </div>
  );
}
