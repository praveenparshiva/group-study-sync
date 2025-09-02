import React from 'react';
import Linkify from 'linkify-react';

/**
 * SOLUTION 2: Library-based approach using linkify-react
 * More robust and handles edge cases better than regex
 */

// Configure linkify options for consistent styling and behavior
const linkifyOptions = {
  className: 'text-blue-400 underline hover:text-blue-500 transition-colors',
  target: '_blank',
  rel: 'noopener noreferrer',
};

/**
 * Component that uses linkify-react to convert URLs to links
 * This is the recommended approach as it's more robust and secure
 */
export const LinkifyText: React.FC<{ children: string }> = ({ children }) => {
  return (
    <p className="whitespace-pre-wrap">
      <Linkify options={linkifyOptions}>
        {children}
      </Linkify>
    </p>
  );
};

/**
 * For cases where you need just the linkified content without the paragraph wrapper
 */
export const LinkifyContent: React.FC<{ children: string }> = ({ children }) => {
  return (
    <Linkify options={linkifyOptions}>
      {children}
    </Linkify>
  );
};