import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface ReadReceiptProps {
  isRead: boolean;
  isSentByCurrentUser: boolean;
  isPending?: boolean;
}

export const ReadReceipt = ({
  isRead,
  isSentByCurrentUser,
  isPending = false,
}: ReadReceiptProps) => {
  // Only show read receipts for messages sent by current user
  if (!isSentByCurrentUser) return null;

  if (isPending) {
    return (
      <div className="flex items-center justify-end mt-1">
        <div className="size-2 bg-primary rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end mt-1">
      {isRead ? (
        <CheckCheck className="size-4 text-primary" />
      ) : (
        <Check className="size-4 text-primary" />
      )}
    </div>
  );
};



