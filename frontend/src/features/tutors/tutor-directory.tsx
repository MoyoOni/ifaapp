import React, { useState, useMemo } from 'react';
import { Search, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import TutorProfileCard from './tutor-profile-card';

interface Tutor {
  id: string;
  userId: string;
  businessName?: string;
  teachingStyle?: string;
  languages: string[];
  experience?: number;
  hourlyRate: number;
  currency: string;
  specialization: string[];
  status: string;
  description?: string;
  user: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
    avatar?: string;
  };
  _count?: {
    sessions: number;
  };
}

interface TutorDirectoryProps {
  onSelectTutor?: (id: string) => void;
}

/**
 * Tutor Directory View
 * Searchable directory of approved tutors for educational services
 */
const TutorDirectory: React.FC<TutorDirectoryProps> = ({ onSelectTutor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');

  // Fetch approved tutors
  const { data: tutors = [], isLoading } = useQuery<Tutor[]>({
    queryKey: ['tutors', { status: 'APPROVED' }],
    queryFn: async () => {
      const response = await api.get('/tutors', {
        params: {
          status: 'APPROVED',
        },
      });
      return response.data;
    },
  });

  // Filter tutors
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const matchesSearch =
        !searchQuery ||
        tutor.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.user.yorubaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.specialization.some((spec) => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tutor.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialization =
        specializationFilter === 'ALL' ||
        tutor.specialization.includes(specializationFilter);

      const matchesLanguage =
        languageFilter === 'ALL' ||
        tutor.languages.includes(languageFilter);

      return matchesSearch && matchesSpecialization && matchesLanguage;
    });
  }, [tutors, searchQuery, specializationFilter, languageFilter]);

  // Get unique specializations and languages for filters
  const specializations = useMemo(() => {
    const all = tutors.flatMap((t) => t.specialization);
    return Array.from(new Set(all));
  }, [tutors]);

  const languages = useMemo(() => {
    const all = tutors.flatMap((t) => t.languages);
    return Array.from(new Set(all));
  }, [tutors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold brand-font text-highlight flex items-center gap-3">
            <GraduationCap size={40} />
            Tutor Marketplace
          </h1>
          <p className="text-muted">
            Find qualified tutors for Yoruba language, Ifá studies, and cultural education
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Search tutors by name, specialization, or description..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Specialization
              </label>
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              >
                <option value="ALL">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-highlight"
              >
                <option value="ALL">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <p className="text-muted mb-4">
            Found {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''}
          </p>

          {filteredTutors.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No tutors found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutors.map((tutor) => (
                <TutorProfileCard
                  key={tutor.id}
                  tutor={tutor}
                  onSelect={() => onSelectTutor?.(tutor.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDirectory;
