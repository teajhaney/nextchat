import { LoadingSpinner } from './LoadingSpinner';

export const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <LoadingSpinner className="border-2 border-primary h-6 w-6 border-dashed" />
    </div>
  );
};
