import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface CircleResource {
  id: string;
  title: string;
  type: string;
  addedAt: string;
}

interface CircleResourcesTabProps {
  resources: CircleResource[] | undefined;
  isAdmin: boolean;
}

export const CircleResourcesTab: React.FC<CircleResourcesTabProps> = ({
  resources,
  isAdmin,
}) => {
  const getResourceColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-600';
      case 'DOC':
        return 'bg-blue-100 text-blue-600';
      case 'VIDEO':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-stone-200 text-stone-600';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Resources</h2>
        {isAdmin && (
          <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors">
            + Add Resource
          </button>
        )}
      </div>
      {!resources || resources.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
          <FileText size={48} className="mx-auto mb-4 text-stone-300" />
          <p className="text-stone-500 font-medium">No resources shared yet</p>
          <p className="text-stone-400 text-sm">Resources will appear here when added</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer group"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getResourceColor(
                  resource.type
                )}`}
              >
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs text-stone-400">
                  Added {new Date(resource.addedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded font-medium uppercase">
                {resource.type}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
