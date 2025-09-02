import React from 'react';

/**
 * SOLUTION 1: Regex-based approach
 * Converts URLs in text to clickable links using regex pattern matching
 */

// URL regex pattern that matches http/https URLs
const URL_REGEX = /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/gi;

export const linkifyText = (text: string): React.ReactElement => {
  if (!text) return <></>;

  const parts = text.split(URL_REGEX);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a URL by testing against the regex
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex to avoid issues with global flag
          URL_REGEX.lastIndex = 0;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-500 transition-colors"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

/**
 * Component wrapper for linkified text that preserves whitespace
 */
export const LinkifiedText: React.FC<{ children: string }> = ({ children }) => {
  return (
    <p className="whitespace-pre-wrap">
      {linkifyText(children)}
    </p>
  );
};