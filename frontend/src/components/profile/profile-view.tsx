import React from 'react';
import { User, MapPin, Phone, Mail, Calendar, Briefcase, Building2, Globe, Hash, Lock } from 'lucide-react';
import { useAuth } from '../../shared/hooks/use-auth';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  occupation?: string;
  organization?: string;
  timezone?: string;
  avatar?: string;
  isPublic?: boolean;
  allowMessaging?: boolean;
  showOnlineStatus?: boolean;
}

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onEdit }) => {
  const { user } = useAuth();
  
  // Determine if this is the current user's profile
  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-3xl mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-600 shadow-md overflow-hidden">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={`${profile.firstName} ${profile.lastName}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <User className="w-12 h-12" />
            </div>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {profile.firstName} {profile.lastName}
        </h1>
        {profile.occupation && (
          <p className="text-gray-600 dark:text-gray-400">{profile.occupation}</p>
        )}
        {isOwnProfile && (
          <button
            onClick={onEdit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>
          </div>

          {profile.phone && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-gray-900 dark:text-white">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile.location && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-gray-900 dark:text-white">{profile.location}</p>
              </div>
            </div>
          )}

          {profile.website && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</p>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {profile.occupation && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</p>
                <p className="text-gray-900 dark:text-white">{profile.occupation}</p>
              </div>
            </div>
          )}

          {profile.organization && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</p>
                <p className="text-gray-900 dark:text-white">{profile.organization}</p>
              </div>
            </div>
          )}

          {profile.timezone && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Timezone</p>
                <p className="text-gray-900 dark:text-white">{profile.timezone}</p>
              </div>
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">About</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;