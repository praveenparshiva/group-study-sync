import React from 'react';

/**
 * SOLUTION 1: Regex-based approach
 * Converts URLs in text to clickable links using regex pattern matching
 */

// Comprehensive URL regex pattern that matches http/https URLs with all special characters
// This pattern captures everything from http/https until whitespace or end of string
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export const linkifyText = (text: string): React.ReactElement => {
  if (!text) return <></>;

  const parts = text.split(URL_REGEX);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a URL by testing if it starts with http/https
        if (part.match(/^https?:\/\//)) {
          // Clean up the URL by removing trailing punctuation that might not be part of the URL
          let cleanUrl = part;
          const trailingPunctuation = /[.,;:!?)]$/;
          if (trailingPunctuation.test(part)) {
            cleanUrl = part.replace(trailingPunctuation, '');
          }
          
          return (
            <a
              key={index}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-500 transition-colors"
            >
              {cleanUrl}
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