import React, { useState } from 'react';
import { useAuth } from '../../shared/hooks/use-auth';
import ProfileView from '../../components/profile/profile-view';
import ProfileEditor from '../../components/profile/profile-editor';
import { logger } from '@/shared/utils/logger';

// Define UserProfile type
type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  occupation: string;
  organization: string;
  timezone: string;
  avatar: string;
  isPublic: boolean;
  allowMessaging: boolean;
  showOnlineStatus: boolean;
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // In a real app, we would fetch the full profile from an API
  // For now, we'll create a mock profile based on the auth user
  const mockProfile = {
    id: user?.id || 'default-id',
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1234567890',
    bio: 'Software developer passionate about web technologies',
    location: 'San Francisco, CA',
    website: 'https://johndoe.example.com',
    occupation: 'Software Engineer',
    organization: 'Example Corp',
    timezone: 'PST',
    avatar: 'https://example.com/avatar.jpg',
    isPublic: true,
    allowMessaging: true,
    showOnlineStatus: true,
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedProfile: typeof mockProfile) => {
    logger.log('Saving profile:', updatedProfile);
    // In a real app, we would save the profile to an API
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your personal information and preferences
          </p>
        </div>

        {isEditing ? (
          <ProfileEditor 
            initialProfile={mockProfile} 
            onSave={(updatedProfile) => {
              // Handle the type conversion from the editor's profile type to the UserProfile type
              const userProfile: UserProfile = {
                ...updatedProfile,
                phone: updatedProfile.phone || '',
                bio: updatedProfile.bio || '',
                location: updatedProfile.location || '',
                website: updatedProfile.website || '',
                occupation: updatedProfile.occupation || '',
                organization: updatedProfile.organization || '',
                timezone: updatedProfile.timezone || 'UTC', // Provide a default timezone
                avatar: updatedProfile.avatar || '', // Provide a default avatar
                isPublic: updatedProfile.isPublic ?? false,
                allowMessaging: updatedProfile.allowMessaging ?? true,
                showOnlineStatus: updatedProfile.showOnlineStatus ?? true,
              };
              handleSave(userProfile);
            }}
            onCancel={handleCancel} 
          />
        ) : (
          <ProfileView 
            profile={mockProfile} 
            onEdit={handleEditClick} 
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;