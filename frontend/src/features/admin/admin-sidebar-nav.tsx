import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_NAV_GROUPS, findAdminNavGroupId, type AdminTab } from './admin-nav-config';

const STORAGE_KEY = 'admin-nav-expanded-groups';

interface AdminSidebarNavProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

function useExpandedGroups(activeTab: AdminTab) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const activeGroupId = findAdminNavGroupId(activeTab);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return new Set(activeGroupId ? [...ids, activeGroupId] : ids);
      }
    } catch {
      // ignore malformed localStorage value
    }
    return new Set(activeGroupId ? [activeGroupId] : []);
  });

  // Whenever the active tab changes (e.g. via a direct route like /admin/users),
  // make sure its group is expanded even if it wasn't already.
  useEffect(() => {
    const activeGroupId = findAdminNavGroupId(activeTab);
    if (activeGroupId) {
      setExpanded(prev => (prev.has(activeGroupId) ? prev : new Set(prev).add(activeGroupId)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggle = (groupId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return { expanded, toggle };
}

/** Shared list body: search box + grouped/filtered nav items. Used by both the
 * sticky desktop sidebar and the mobile drawer so the two never drift apart. */
const NavListBody: React.FC<{
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  expanded: Set<string>;
  onToggleGroup: (groupId: string) => void;
}> = ({ activeTab, onSelectTab, expanded, onToggleGroup }) => {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_NAV_GROUPS;
    return ADMIN_NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(q)),
      }))
      .filter(group => group.items.length > 0);
  }, [query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a section…"
            aria-label="Search admin sections"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1">
        {filteredGroups.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No sections match &ldquo;{query}&rdquo;</p>
        )}
        {filteredGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = isSearching || expanded.has(group.id);
          return (
            <div key={group.id} className="pb-1">
              <button
                type="button"
                onClick={() => onToggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/10 transition-colors"
                aria-expanded={isOpen}
              >
                <GroupIcon size={14} className="flex-shrink-0" />
                <span className="flex-1 text-left truncate">{group.label}</span>
                {!isSearching && (
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform flex-shrink-0', isOpen && 'rotate-180')}
                  />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pt-0.5 pb-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = item.id === activeTab;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectTab(item.id)}
                            className={cn(
                              'w-full flex items-center gap-2.5 pl-6 pr-3 py-2 rounded-lg text-sm text-left transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-foreground/80 hover:bg-secondary/10 hover:text-foreground'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <ItemIcon size={16} className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Grouped, searchable sidebar navigation for the admin dashboard's ~48
 * sections. Replaces the old single-row horizontally-scrolling tab strip,
 * which required endless side-scrolling to reach anything past the first
 * handful of tabs. Desktop renders a sticky column; below the `lg` breakpoint
 * it collapses into a "Sections" trigger that opens the same list in a drawer,
 * matching the interaction pattern of the app's primary SidebarLayout.
 */
export const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({ activeTab, onSelectTab }) => {
  const { expanded, toggle } = useExpandedGroups(activeTab);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeLabel = useMemo(() => {
    for (const group of ADMIN_NAV_GROUPS) {
      const match = group.items.find(i => i.id === activeTab);
      if (match) return match.label;
    }
    return 'Sections';
  }, [activeTab]);

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-foreground font-medium shadow-sm"
        >
          <Menu size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left truncate">{activeLabel}</span>
          <span className="text-xs text-muted-foreground">Change section</span>
        </button>
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-6 bg-card border border-border rounded-2xl shadow-sm h-[calc(100vh-3rem)] max-h-[900px]">
          <NavListBody
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            expanded={expanded}
            onToggleGroup={toggle}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-card z-50 lg:hidden flex flex-col shadow-elevation-3"
            >
              <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Admin Sections</h2>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close section menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <NavListBody
                  activeTab={activeTab}
                  onSelectTab={handleSelect}
                  expanded={expanded}
                  onToggleGroup={toggle}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebarNav;
