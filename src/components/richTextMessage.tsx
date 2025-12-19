'use client';

import React from 'react';
import Link from 'next/link';

interface RichTextMessageProps {
  content: string;
  className?: string;
}

/**
 * Component to render message text with clickable links
 * Detects URLs and converts them to clickable links with primary color
 */
export const RichTextMessage = ({
  content,
  className = '',
}: RichTextMessageProps) => {
  // URL regex pattern - matches http, https, www, and common domains
  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g

  // Split content by URLs and create parts array
  const parts: Array<{ text: string; isLink: boolean; url?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(content)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        text: content.substring(lastIndex, match.index),
        isLink: false,
      });
    }

    // Process the matched URL
    let url = match[0];
    let displayUrl = url;

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Truncate long URLs for display (optional)
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }

    parts.push({
      text: displayUrl,
      isLink: true,
      url: url,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last URL
  if (lastIndex < content.length) {
    parts.push({
      text: content.substring(lastIndex),
      isLink: false,
    });
  }

  // If no URLs found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  // Render parts with links
  // Note: Line breaks are preserved by whitespace-pre-wrap CSS class
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.isLink && part.url) {
          return (
            <Link
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={e => e.stopPropagation()}
            >
              {part.text}
            </Link>
          );
        }
        return <React.Fragment key={index}>{part.text}</React.Fragment>;
      })}
    </span>
  );
};
