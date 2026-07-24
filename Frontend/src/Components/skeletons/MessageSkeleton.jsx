import React from "react";

function MessageSkeleton() {
  const skeletonMessages = Array(6).fill(null);
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in w-full">
      {skeletonMessages.map((_, idx) => {
        const isMine = idx % 2 === 1;
        return (
          <div
            key={idx}
            className={`flex items-end gap-2.5 ${isMine ? "justify-end" : "justify-start"} animate-pulse`}
          >
            {!isMine && (
              <div className="skeleton size-8 rounded-full flex-shrink-0 bg-base-300/80" />
            )}

            <div
              className={`p-3.5 rounded-2xl space-y-2 max-w-[70%] ${
                isMine ? "bg-primary/20 rounded-br-none" : "bg-base-200/80 rounded-bl-none"
              }`}
            >
              <div className="skeleton h-3.5 w-32 sm:w-44 rounded-md bg-base-300/80" />
              <div className="skeleton h-3 w-48 sm:w-64 rounded-md bg-base-300/60" />
              <div className="flex justify-end pt-1">
                <div className="skeleton h-2.5 w-12 rounded-md bg-base-300/50" />
              </div>
            </div>

            {isMine && (
              <div className="skeleton size-8 rounded-full flex-shrink-0 bg-base-300/80" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MessageSkeleton;