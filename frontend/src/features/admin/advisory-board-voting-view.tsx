import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Vote,
  Users,
  Calendar,
  Loader2,
  Plus,
  XCircle,
  CheckCircle2,
  BarChart3,
  Flag
} from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { useAuth } from '@/shared/hooks/use-auth';

interface AdvisoryVote {
  id: string;
  title: string;
  description: string;
  proposer: {
    id: string;
    name: string;
    yorubaName?: string;
    role?: string;
  };
  deadline: string; // ISO date string
  requiredMajority: 'SIMPLE' | 'SUPER' | 'UNANIMOUS'; // 50%, 75%, 100%
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  voterCount: number;
  voteOptions: string[];
  results: {
    option: string;
    count: number;
    percentage: number;
  }[];
}

interface CastVoteDto {
  voteId: string;
  option: string;
}

const AdvisoryBoardVotingView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'create'>('active');

  const { data: votes = [], isLoading } = useQuery<AdvisoryVote[]>({
    queryKey: ['advisory-votes', activeTab],
    queryFn: async () => {
      const params = {
        status: activeTab === 'active' ? 'ACTIVE,PENDING' : 'CLOSED,APPROVED,REJECTED'
      };
      try {
        const response = await api.get('/admin/advisory-board/votes', { params });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch advisory votes, using demo data');
        const now = Date.now();
        const demoVotes: AdvisoryVote[] = [
          {
            id: 'vote-1',
            title: 'Expand Community Grants',
            description: 'Approve additional funding for temple-led community grants.',
            proposer: { id: 'demo-admin-1', name: 'Chief Adeyemi', role: 'ADMIN' },
            deadline: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
            requiredMajority: 'SUPER',
            status: 'ACTIVE',
            createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
            votes: { yes: 8, no: 2, abstain: 1 },
            voterCount: 11,
            voteOptions: ['Approve', 'Reject', 'Needs Review'],
            results: [
              { option: 'Approve', count: 8, percentage: 73 },
              { option: 'Reject', count: 2, percentage: 18 },
              { option: 'Needs Review', count: 1, percentage: 9 }
            ],
          },
          {
            id: 'vote-2',
            title: 'Update Practitioner Code of Conduct',
            description: 'Adopt updated guidelines for practitioner onboarding.',
            proposer: { id: 'demo-admin-1', name: 'Chief Adeyemi', role: 'ADMIN' },
            deadline: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
            requiredMajority: 'SIMPLE',
            status: 'CLOSED',
            createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
            votes: { yes: 12, no: 1, abstain: 0 },
            voterCount: 13,
            voteOptions: ['Approve', 'Reject'],
            results: [
              { option: 'Approve', count: 12, percentage: 92 },
              { option: 'Reject', count: 1, percentage: 8 }
            ],
          },
        ];

        return demoVotes.filter((vote) =>
          activeTab === 'active'
            ? vote.status === 'ACTIVE' || vote.status === 'PENDING'
            : vote.status !== 'ACTIVE' && vote.status !== 'PENDING'
        );
      }
    }
  });

  const castVoteMutation = useMutation({
    mutationFn: async (voteData: CastVoteDto) => {
      const response = await api.post(`/admin/advisory-board/votes/${voteData.voteId}/cast`, voteData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisory-votes'] });
    }
  });

  const createVoteMutation = useMutation({
    mutationFn: async (voteData: {
      title: string;
      description: string;
      voteOptions: string[];
      deadline: string;
      requiredMajority: 'SIMPLE' | 'SUPER' | 'UNANIMOUS';
    }) => {
      const response = await api.post('/admin/advisory-board/votes', voteData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisory-votes'] });
      setActiveTab('active');
    }
  });

  const [newVote, setNewVote] = useState({
    title: '',
    description: '',
    voteOptions: ['', ''],
    deadline: '',
    requiredMajority: 'SIMPLE' as 'SIMPLE' | 'SUPER' | 'UNANIMOUS'
  });

  const handleCreateVote = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty options
    const filteredOptions = newVote.voteOptions.filter(opt => opt.trim() !== '');

    if (filteredOptions.length < 2) {
      alert('Please provide at least 2 voting options');
      return;
    }

    if (!newVote.title || !newVote.description || !newVote.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    createVoteMutation.mutate({
      title: newVote.title,
      description: newVote.description,
      voteOptions: filteredOptions,
      deadline: newVote.deadline,
      requiredMajority: newVote.requiredMajority
    });
  };

  const handleAddOption = () => {
    setNewVote(prev => ({
      ...prev,
      voteOptions: [...prev.voteOptions, '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewVote(prev => {
      const newOptions = [...prev.voteOptions];
      newOptions[index] = value;
      return { ...prev, voteOptions: newOptions };
    });
  };

  const handleRemoveOption = (index: number) => {
    if (newVote.voteOptions.length <= 2) return; // Keep at least 2 options

    setNewVote(prev => {
      const newOptions = [...prev.voteOptions];
      newOptions.splice(index, 1);
      return { ...prev, voteOptions: newOptions };
    });
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const canVote = (vote: AdvisoryVote) => {
    return vote.status === 'ACTIVE' &&
      new Date(vote.deadline) > new Date() &&
      user?.role === 'ADVISORY_BOARD_MEMBER';
  };

  const getStatusColor = (status: AdvisoryVote['status']) => {
    switch (status) {
      case 'APPROVED': return 'text-green-400 bg-green-400/10';
      case 'REJECTED': return 'text-red-400 bg-red-400/10';
      case 'ACTIVE': return 'text-blue-400 bg-blue-400/10';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
      case 'CLOSED': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flag className="w-8 h-8 text-highlight" />
          <h1 className="text-3xl font-bold text-white">Advisory Board Voting</h1>
        </div>
        <p className="text-muted">
          Participate in important decisions for the Ifá community
        </p>
      </div>

      <div className="bg-background-light/10 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'active'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted hover:text-white'
              }`}
            onClick={() => setActiveTab('active')}
          >
            Active Votes
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'closed'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted hover:text-white'
              }`}
            onClick={() => setActiveTab('closed')}
          >
            Past Votes
          </button>
          {user?.role === 'ADVISORY_BOARD_MEMBER' && (
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'create'
                ? 'text-highlight border-b-2 border-highlight'
                : 'text-muted hover:text-white'
                }`}
              onClick={() => setActiveTab('create')}
            >
              Create Vote
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'active' && votes.length === 0 && (
            <div className="text-center py-12 text-muted">
              <Vote className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No active votes</p>
              <p className="text-sm">Check back later for new proposals</p>
            </div>
          )}

          {activeTab === 'closed' && votes.length === 0 && (
            <div className="text-center py-12 text-muted">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No closed votes</p>
              <p className="text-sm">No voting history available yet</p>
            </div>
          )}

          {activeTab === 'create' && user?.role === 'ADVISORY_BOARD_MEMBER' && (
            <form onSubmit={handleCreateVote} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Vote Title *
                </label>
                <input
                  type="text"
                  value={newVote.title}
                  onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  placeholder="Enter vote title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Description *
                </label>
                <textarea
                  value={newVote.description}
                  onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  placeholder="Describe the proposal..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Voting Options *
                </label>
                <div className="space-y-3">
                  {newVote.voteOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                        placeholder={`Option ${index + 1}`}
                      />
                      {newVote.voteOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-highlight hover:text-highlight/80 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Option
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={newVote.deadline}
                    onChange={(e) => setNewVote({ ...newVote, deadline: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Required Majority
                  </label>
                  <select
                    value={newVote.requiredMajority}
                    onChange={(e) => setNewVote({
                      ...newVote,
                      requiredMajority: e.target.value as 'SIMPLE' | 'SUPER' | 'UNANIMOUS'
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
                  >
                    <option value="SIMPLE" className="bg-background">Simple Majority (50%)</option>
                    <option value="SUPER" className="bg-background">Super Majority (75%)</option>
                    <option value="UNANIMOUS" className="bg-background">Unanimous (100%)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createVoteMutation.isPending}
                  className="px-6 py-3 bg-highlight text-foreground rounded-lg font-medium hover:bg-highlight/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createVoteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Vote...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Submit Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {(activeTab === 'active' || activeTab === 'closed') && (
            <div className="space-y-6">
              {votes.map((vote) => {
                const totalVotes = vote.votes.yes + vote.votes.no + vote.votes.abstain;
                const yesPercentage = calculatePercentage(vote.votes.yes, totalVotes);
                const noPercentage = calculatePercentage(vote.votes.no, totalVotes);
                const abstainPercentage = calculatePercentage(vote.votes.abstain, totalVotes);

                return (
                  <div
                    key={vote.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-highlight transition-colors"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{vote.title}</h3>
                        <p className="text-muted mt-1">{vote.description}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1 text-muted">
                            <Users size={16} />
                            <span>{vote.voterCount} voters</span>
                          </div>

                          <div className="flex items-center gap-1 text-muted">
                            <Calendar size={16} />
                            <span>
                              {new Date(vote.createdAt).toLocaleDateString()} -{' '}
                              {new Date(vote.deadline).toLocaleDateString()}
                            </span>
                          </div>

                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vote.status)}`}>
                            {vote.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-muted text-sm">Proposed by</p>
                        <p className="text-white font-medium">{vote.proposer.name}</p>
                        <p className="text-xs text-muted">{vote.proposer.role}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-white mb-3">Voting Options</h4>

                      <div className="space-y-3">
                        {vote.voteOptions.map((option, index) => {
                          const optionResult = vote.results?.find(r => r.option === option);
                          const percentage = optionResult ? optionResult.percentage : 0;

                          return (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-muted">{option}</span>

                              {vote.results ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-32 bg-background/20 rounded-full h-2">
                                    <div
                                      className="bg-highlight h-2 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-white font-medium w-10">{percentage}%</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (canVote(vote)) {
                                      castVoteMutation.mutate({
                                        voteId: vote.id,
                                        option: option
                                      });
                                    }
                                  }}
                                  disabled={!canVote(vote)}
                                  className={`px-4 py-1 rounded-lg text-sm font-medium ${canVote(vote)
                                    ? 'bg-highlight text-foreground hover:bg-highlight/80'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                  Vote
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div>
                          <p className="text-muted">Yes</p>
                          <p className="text-green-400 font-bold">{vote.votes.yes} ({yesPercentage}%)</p>
                        </div>
                        <div>
                          <p className="text-muted">No</p>
                          <p className="text-red-400 font-bold">{vote.votes.no} ({noPercentage}%)</p>
                        </div>
                        <div>
                          <p className="text-muted">Abstain</p>
                          <p className="text-yellow-400 font-bold">{vote.votes.abstain} ({abstainPercentage}%)</p>
                        </div>
                        <div>
                          <p className="text-muted">Total</p>
                          <p className="text-white font-bold">{totalVotes} votes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryBoardVotingView;