/**
 * Tag name to color code mapping for blog post tags.
 * Used to render colored badges for each tag.
 */
export const TAG_COLORS: Record<string, string> = {
  AWS: '#f59e0b',
  TypeScript: '#3178c6',
  React: '#06b6d4',
  'Node.js': '#22c55e',
  Python: '#3b82f6',
  CDK: '#8b5cf6',
  Lambda: '#f97316',
  DynamoDB: '#eab308',
  Hono: '#ef4444',
};

/** Returns the color for a tag, falling back to a neutral grey. */
export const getTagColor = (tag: string): string =>
  TAG_COLORS[tag] ?? '#94a3b8';
