import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Lock,
  UserPlus,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import { CircleDetail } from '../types/circle.types';

interface CircleHeroProps {
  circle: CircleDetail;
  onBack?: () => void;
  isMember: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  onJoin: () => void;
  onLeave: () => void;
  isJoining: boolean;
  isLeaving: boolean;
}

export const CircleHero: React.FC<CircleHeroProps> = ({
  circle,
  onBack,
  isMember,
  isAdmin,
  isCreator,
  onJoin,
  onLeave,
  isJoining,
  isLeaving,
}) => {
  return (
    <>
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Circles
        </button>
      )}

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-xl"
      >
        {/* Banner Image */}
        {circle.banner ? (
          <div className="h-48 md:h-64 relative">
            <img
              src={circle.banner}
              alt={circle.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/10" />
        )}

        {/* Circle Info Overlay */}
        <div className="relative px-6 pb-6 -mt-20">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Avatar */}
            {circle.avatar ? (
              <img
                src={circle.avatar}
                alt={circle.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/20 flex items-center justify-center border-4 border-white shadow-xl">
                <Users size={40} className="text-primary" />
              </div>
            )}

            {/* Title and Actions */}
            <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {circle.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    {circle.privacy === 'PUBLIC' && (
                      <Globe size={14} className="text-primary" />
                    )}
                    {circle.privacy === 'PRIVATE' && (
                      <Lock size={14} className="text-amber-600" />
                    )}
                    {circle.privacy === 'INVITE_ONLY' && (
                      <UserPlus size={14} className="text-orange-600" />
                    )}
                    {circle.privacy?.replace('_', ' ').toLowerCase()}
                  </span>
                  <span>•</span>
                  <span>{circle._count?.members || circle.memberCount} members</span>
                  {circle.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {circle.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    className="p-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                    title="Circle Settings"
                  >
                    <Settings size={20} className="text-stone-600" />
                  </button>
                )}
                {isMember ? (
                  <button
                    onClick={onLeave}
                    disabled={isLeaving || isCreator}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isLeaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={onJoin}
                    disabled={isJoining}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Join Circle
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {circle.description && (
            <p className="mt-4 text-stone-600 max-w-3xl">{circle.description}</p>
          )}

          {/* Topics */}
          {circle.topics && circle.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {circle.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
