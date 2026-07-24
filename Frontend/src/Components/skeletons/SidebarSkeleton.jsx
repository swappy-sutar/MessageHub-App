import React from "react";

function SidebarSkeleton() {
  const skeletonItems = Array(8).fill(null);
  return (
    <div className="w-full py-2 px-1 space-y-1 divide-y divide-base-300/30 animate-pulse">
      {skeletonItems.map((_, idx) => (
        <div key={idx} className="w-full p-3 flex items-center gap-3">
          {/* Avatar Skeleton */}
          <div className="skeleton size-12 rounded-full flex-shrink-0 bg-base-300/80" />

          {/* Contact Details Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3.5 w-28 rounded-md bg-base-300/80" />
              <div className="skeleton h-3 w-10 rounded-md bg-base-300/60" />
            </div>
            <div className="skeleton h-3 w-40 rounded-md bg-base-300/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SidebarSkeleton;
