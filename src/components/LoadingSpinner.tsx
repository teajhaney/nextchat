export const LoadingSpinner = ({ className }: { className: string }) => {
  return (
    <div className="center h-full">
      <div className={`  rounded-full  animate-spin ${className}`}></div>{' '}
    </div>
  );
};
