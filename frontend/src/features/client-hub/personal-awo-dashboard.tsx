import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Calendar, FileText, UserPlus, Building2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import VerificationBadge from '@/shared/components/verification-badge';
import { getDemoUser, getUserTempleRelationships } from '@/demo';


interface PersonalAwo {
  id: string;
  babalawoId: string;
  clientId: string;
  status: string;
  relationshipType: string;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  covenantAgreed: boolean;
  covenantText?: string;
  exclusivityAcknowledged: boolean;
  gracePeriodStart?: string;
  gracePeriodEnd?: string;
  inGracePeriod: boolean;
  renewalPrompted: boolean;
  assignedAt: string;
  babalawo: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
    verified: boolean;
    bio?: string;
    location?: string;
    culturalLevel?: string;
    temple?: {
      id: string;
      name: string;
      yorubaName?: string;
      slug: string;
      logo?: string;
      verified: boolean;
    };
  };
}

interface PersonalAwoDashboardProps {
  clientId: string;
  onMessage?: () => void;
  onRequestConsultation?: () => void;
  onViewDocuments?: () => void;
  onChangeAwo?: () => void;
}

/**
 * Personal Awo Dashboard
 * Client's view of their assigned Babalawo relationship
 * NOTE: "Personal Awo" relationship is sacred - client can change but not "unfriend" like social media
 */
const PersonalAwoDashboard: React.FC<PersonalAwoDashboardProps> = ({
  clientId,
  onMessage,
  onRequestConsultation,
  onViewDocuments,
  onChangeAwo,
}) => {
  const { data: personalAwo, isLoading } = useQuery<PersonalAwo>({
    queryKey: ['personal-awo', clientId],
    queryFn: async () => {
      try {
        const response = await api.get(`/babalawo-client/personal-awo/${clientId}`);
        return response.data;
      } catch (e) {
        logger.warn('Using demo personal awo');
        // Find demo babalawo for the client from the ecosystem
        const demoClient = getDemoUser(clientId);
        if (!demoClient) return null;

        // Get the client's temple relationships to find their babalawo
        const temples = getUserTempleRelationships(clientId);
        const temple = temples.length > 0 ? temples[0] : null;
        const babalawoId = temple?.babalawos[0] || 'demo-baba-1';
        const demoBaba = getDemoUser(babalawoId);

        if (!demoBaba) return null;

        return {
          id: 'rel-demo-1',
          babalawoId: demoBaba.id,
          clientId: clientId,
          status: 'ACTIVE',
          relationshipType: 'PERSONAL_AWO',
          covenantAgreed: true,
          exclusivityAcknowledged: true,
          inGracePeriod: false,
          renewalPrompted: false,
          assignedAt: '2025-01-01',
          babalawo: {
            ...demoBaba,
            temple: temple ? {
              id: temple.id,
              name: temple.name,
              yorubaName: temple.yorubaName,
              slug: temple.slug,
              logo: temple.logo,
              verified: temple.verified
            } : undefined
          }
        };
      }
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 bg-stone-50 rounded-[2.5rem]">
        <div className="w-16 h-16 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!personalAwo) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
        {/* Empty State / Welcome */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 text-center border border-stone-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-highlight/20 via-highlight to-highlight/20"></div>
          <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-highlight border border-stone-100 shadow-sm">
            <UserPlus size={40} />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold brand-font text-stone-800 mb-4 tracking-tight">
            Begin Your Journey
          </h1>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            The path to destiny is rarely walked alone. Connect with a verified Babaláwo to unlock the full potential of your dashboard, receive guidance, and align with your true self.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onChangeAwo}
              className="px-8 py-4 bg-highlight text-white rounded-2xl font-bold text-lg hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Building2 size={20} />
              Find a Spiritual Guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { babalawo } = personalAwo;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">

      {/* 1. Hero / Greeting Section */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-highlight/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-stone-50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute top-6 right-8 text-[200px] leading-none text-stone-50 font-bold -z-10 select-none opacity-50 brand-font">
          Ifá
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-50 border border-stone-100 rounded-full text-xs font-bold text-highlight uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-highlight animate-pulse"></span>
            <span>Daily Energy: Eji Ogbe</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold brand-font text-stone-800 mb-4 tracking-tight">
              E kàárò, <span className="text-transparent bg-clip-text bg-gradient-to-r from-highlight to-yellow-600">Omni</span>.
            </h1>
            <p className="text-xl text-stone-500 font-medium leading-relaxed">
              "The path is open for those who seek." — Today is a powerful day for clarity and new beginnings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. Your Guide (Personal Awo Card) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold brand-font text-stone-800">Your Spiritual Guide</h2>
            {onChangeAwo && (
              <button
                onClick={onChangeAwo}
                className="text-xs font-bold text-stone-400 hover:text-highlight uppercase tracking-wider transition-colors px-3 py-1 rounded-lg hover:bg-stone-100"
              >
                Change Guide
              </button>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-lg border border-stone-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Card Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full"></div>

            <div className="flex flex-col sm:flex-row gap-6 items-start relative z-10">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-stone-100 overflow-hidden shadow-inner ring-4 ring-white">
                  {babalawo.avatar ? (
                    <img src={babalawo.avatar} alt={babalawo.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-stone-300 brand-font">
                      {(babalawo.name[0] || 'A').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3">
                  <VerificationBadge verified={babalawo.verified} />
                </div>
              </div>

              <div className="flex-1 space-y-3 pt-2">
                <div>
                  <h3 className="text-2xl font-bold text-stone-800 leading-tight">{babalawo.name}</h3>
                  <p className="text-highlight font-bold text-sm uppercase tracking-wide mt-1">
                    {babalawo.yorubaName || 'Verified Practitioner'}
                  </p>
                </div>

                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">
                  {babalawo.bio || 'Experienced Babalawo dedicated to guiding you through your spiritual journey with wisdom and care.'}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-xs font-bold text-stone-600 border border-stone-100">
                    <Building2 size={12} className="text-stone-400" />
                    {babalawo.temple?.name || 'Independent Practice'}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg text-xs font-bold text-stone-600 border border-stone-100">
                    <UserPlus size={12} className="text-stone-400" />
                    {personalAwo.relationshipType === 'PERSONAL_AWO' ? 'Personal Awo' : 'Consultant'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grace Period Warning */}
            {personalAwo.inGracePeriod && (
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 animate-pulse">
                <AlertCircle className="shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Renewal Needed</p>
                  <p className="text-amber-700/80">Your mentorship period is ending. Please renew soon to maintain connection.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Quick Actions Grid */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-2xl font-bold brand-font text-stone-800 px-2">Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">

            <button
              onClick={onRequestConsultation}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md hover:border-highlight/30 hover:-translate-y-1 transition-all text-left group flex items-start gap-4"
            >
              <div className="bg-highlight/10 p-3 rounded-2xl text-highlight group-hover:bg-highlight group-hover:text-white transition-colors">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 text-lg group-hover:text-highlight transition-colors">Request Consultation</h4>
                <p className="text-stone-500 text-sm mt-1">Schedule a reading or consultation</p>
              </div>
            </button>

            <button
              onClick={onMessage}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md hover:border-blue-400/30 hover:-translate-y-1 transition-all text-left group flex items-start gap-4"
            >
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <MessageSquare size={24} />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 text-lg group-hover:text-blue-500 transition-colors">Message</h4>
                <p className="text-stone-500 text-sm mt-1">Chat privately with your guide</p>
              </div>
            </button>

            <button
              onClick={onViewDocuments}
              className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md hover:border-purple-400/30 hover:-translate-y-1 transition-all text-left group flex items-start gap-4"
            >
              <div className="bg-purple-50 p-3 rounded-2xl text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 text-lg group-hover:text-purple-500 transition-colors">My Archives</h4>
                <p className="text-stone-500 text-sm mt-1">Review past readings & documents</p>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalAwoDashboard;