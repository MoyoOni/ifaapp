import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, UserPlus, Check, Loader2, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  yorubaName?: string | null;
}

const InviteClientView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: results = [], isLoading: searching } = useQuery<SearchUser[]>({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      const res = await api.get('/users', { params: { search: searchQuery, role: 'CLIENT' } });
      const payload = res.data;
      return Array.isArray(payload) ? payload : (payload.users ?? payload.data ?? []);
    },
    enabled: searchQuery.trim().length >= 3,
    staleTime: 10000,
  });

  const addMutation = useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/babalawo-client/${user!.id}/clients`, { clientId }),
    onSuccess: (_data, clientId) => {
      setAddedIds(prev => new Set([...prev, clientId]));
      queryClient.invalidateQueries({ queryKey: ['babalawo-clients'] });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">Find & Add Seeker</h1>
          <p className="text-stone-600 text-lg mt-1">Search for an existing user and add them as your seeker</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/practitioner/my-seekers')}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to Seekers
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email (min. 3 characters)..."
            className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-highlight text-sm"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" size={16} />
          )}
        </div>
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
          <p className="mt-1 text-xs text-stone-400">Type at least 3 characters to search</p>
        )}
      </div>

      {/* Results */}
      {searchQuery.trim().length >= 3 && (
        <div className="max-w-xl space-y-3">
          {results.length === 0 && !searching ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
              <User size={40} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 font-medium">No users found</p>
              <p className="text-stone-400 text-sm mt-1">Try a different name or email</p>
            </div>
          ) : (
            results.map(result => (
              <div key={result.id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (result.name[0] || '').toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{result.name}</p>
                    {result.yorubaName && <p className="text-xs text-stone-400 italic">{result.yorubaName}</p>}
                    <p className="text-sm text-stone-500">{result.email}</p>
                  </div>
                </div>

                {addedIds.has(result.id) ? (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <Check size={14} /> Added
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addMutation.mutate(result.id)}
                    disabled={addMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight text-white rounded-lg text-sm font-bold hover:bg-yellow-600 disabled:opacity-60 transition-colors"
                  >
                    {addMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UserPlus size={14} />
                    )}
                    Add as Seeker
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {addedIds.size > 0 && (
        <div className="max-w-xl">
          <button
            type="button"
            onClick={() => navigate('/practitioner/my-seekers')}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors"
          >
            View My Seekers ({addedIds.size} added)
          </button>
        </div>
      )}
    </div>
  );
};

export default InviteClientView;
