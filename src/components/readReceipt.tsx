import React from 'react';
import { Check, CheckCheck, Clock3 } from 'lucide-react';

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
        <Clock3 className="size-2 text-primary" />
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
