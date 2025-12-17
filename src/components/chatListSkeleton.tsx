'use client';

import clsx from 'clsx';

export interface ChatListSkeletonProps {
  /**
   * Number of skeleton items to display
   * @default 5
   */
  count?: number;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom className for individual skeleton items
   */
  itemClassName?: string;
  /**
   * Whether to show avatar skeleton
   * @default true
   */
  showAvatar?: boolean;
  /**
   * Whether to show title skeleton (name)
   * @default true
   */
  showTitle?: boolean;
  /**
   * Whether to show subtitle skeleton (message preview)
   * @default true
   */
  showSubtitle?: boolean;
  /**
   * Whether to show timestamp skeleton
   * @default true
   */
  showTimestamp?: boolean;
  /**
   * Whether to show badge skeleton (unread count)
   * @default false
   */
  showBadge?: boolean;
  /**
   * Custom color for skeleton elements
   * @default 'bg-primary'
   */
  skeletonColor?: string;
  /**
   * Spacing between items
   * @default 'space-y-3'
   */
  spacing?: string;
}

export const ChatListSkeleton = ({
  count = 5,
  className,
  itemClassName,
  showAvatar = true,
  showTitle = true,
  showSubtitle = true,
  showTimestamp = true,
  showBadge = false,
  skeletonColor = 'bg-primary',
  spacing = 'space-y-3',
}: ChatListSkeletonProps) => {
  return (
    <div className={clsx(spacing, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'p-3 flex justify-between items-center shadow rounded-sm animate-pulse',
            itemClassName
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            {showAvatar && (
              <div
                className={clsx('size-10 rounded-full', skeletonColor)}
              ></div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              {showTitle && (
                <div className={clsx('h-4 rounded w-24', skeletonColor)}></div>
              )}
              {showSubtitle && (
                <div className={clsx('h-3 rounded w-32', skeletonColor)}></div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {showTimestamp && (
              <div className={clsx('h-3 rounded w-12', skeletonColor)}></div>
            )}
            {showBadge && (
              <div
                className={clsx('h-4 rounded-full w-4', skeletonColor)}
              ></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
