import React from 'react';

const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Hero Card Skeleton */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent animate-pulse" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 self-center sm:self-start">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-stone-200 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
              <div className="h-6 bg-stone-200 rounded w-3/4 mx-auto sm:mx-0 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-1/2 mx-auto sm:mx-0 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-4/5 mx-auto sm:mx-0 animate-pulse mt-2" />
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <div className="h-6 bg-stone-200 rounded-full w-20 animate-pulse" />
                <div className="h-6 bg-stone-200 rounded-full w-24 animate-pulse" />
                <div className="h-6 bg-stone-200 rounded-full w-16 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Services Skeleton */}
        <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-32 animate-pulse" />
          </div>
          <div className="divide-y divide-stone-100">
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 bg-stone-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-stone-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-stone-100 rounded w-2/3 animate-pulse" />
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-6 bg-stone-200 rounded w-16 animate-pulse" />
                <div className="h-6 bg-stone-200 rounded w-12 mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Specializations Skeleton */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-32 animate-pulse" />
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-stone-200 rounded-full w-16 animate-pulse" />
              <div className="h-6 bg-stone-200 rounded-full w-20 animate-pulse" />
              <div className="h-6 bg-stone-200 rounded-full w-24 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quick Book CTA Skeleton */}
        <div className="md:col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 bg-stone-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-48 animate-pulse" />
            </div>
            <div className="h-10 bg-stone-200 rounded-xl w-32 animate-pulse" />
          </div>
        </div>

        {/* About Me Skeleton */}
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="h-4 bg-stone-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Details + Connect Skeleton */}
        <div className="space-y-4">
          {/* Profile Details */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100">
              <div className="h-4 bg-stone-200 rounded w-20 animate-pulse" />
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="h-4 bg-stone-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-4/5 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-stone-100 rounded w-2/3 animate-pulse" />
            </div>
          </div>

          {/* Connect Actions */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
              <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
              <div className="h-4 bg-stone-200 rounded w-20 animate-pulse" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <div className="h-8 bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-8 bg-stone-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Interests Skeleton */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-stone-200 rounded-full w-16 animate-pulse" />
              <div className="h-6 bg-stone-200 rounded-full w-20 animate-pulse" />
              <div className="h-6 bg-stone-200 rounded-full w-18 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-stone-50 rounded-xl">
                <div className="h-6 bg-stone-200 rounded w-8 mx-auto animate-pulse" />
                <div className="h-3 bg-stone-100 rounded w-12 mx-auto mt-1 animate-pulse" />
              </div>
              <div className="text-center p-3 bg-stone-50 rounded-xl">
                <div className="h-6 bg-stone-200 rounded w-8 mx-auto animate-pulse" />
                <div className="h-3 bg-stone-100 rounded w-12 mx-auto mt-1 animate-pulse" />
              </div>
              <div className="text-center p-3 bg-stone-50 rounded-xl">
                <div className="h-6 bg-stone-200 rounded w-8 mx-auto animate-pulse" />
                <div className="h-3 bg-stone-100 rounded w-12 mx-auto mt-1 animate-pulse" />
              </div>
              <div className="text-center p-3 bg-stone-50 rounded-xl">
                <div className="h-6 bg-stone-200 rounded w-8 mx-auto animate-pulse" />
                <div className="h-3 bg-stone-100 rounded w-12 mx-auto mt-1 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Communities Skeleton */}
        <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="w-4 h-4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 bg-stone-200 rounded w-32 animate-pulse" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div className="group flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded w-16 mt-1 animate-pulse" />
                </div>
              </div>
              <div className="group flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded w-16 mt-1 animate-pulse" />
                </div>
              </div>
              <div className="group flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded w-16 mt-1 animate-pulse" />
                </div>
              </div>
              <div className="group flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded w-16 mt-1 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button Skeleton */}
      <div className="h-10 bg-stone-200 rounded-xl w-24 animate-pulse" />
    </div>
  );
};

export default ProfileSkeleton;