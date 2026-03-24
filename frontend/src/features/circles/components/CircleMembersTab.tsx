import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle } from 'lucide-react';
import { CircleDetail } from '../types/circle.types';

interface CircleMembersTabProps {
  circle: CircleDetail;
}

export const CircleMembersTab: React.FC<CircleMembersTabProps> = ({ circle }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Members ({circle.members?.length || 0})
        </h2>
      </div>
      {circle.members?.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-stone-300" />
          <p className="text-stone-500">No members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {circle.members?.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-muted/50 rounded-xl text-center hover:bg-muted transition-colors cursor-pointer"
            >
              {member.user.avatar ? (
                <img
                  src={member.user.avatar}
                  alt={member.user.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-card shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 border-2 border-card shadow-md">
                  <span className="text-primary font-bold text-xl">
                    {(member.user.yorubaName || member.user.name)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <p className="font-semibold text-foreground text-sm">
                {member.user.yorubaName || member.user.name}
              </p>
              {member.role === 'ADMIN' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-highlight/10 text-highlight text-xs rounded-full font-medium">
                  Admin
                </span>
              )}
              {member.role === 'MODERATOR' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  Moderator
                </span>
              )}
              {member.role === 'PATRON' && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs rounded-full font-bold">
                  ✦ Patron
                </span>
              )}
              {member.user.verified && (
                <CheckCircle size={14} className="inline ml-1 text-primary" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
