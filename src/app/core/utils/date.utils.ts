/**
 * Format a date as a relative time string (e.g., "2d ago", "Just now")
 * @param isoDate - ISO date string or undefined
 * @returns Relative time string or "Never" if no date provided
 */
export function formatRelativeTime(isoDate: string | undefined): string {
  if (!isoDate) return 'Never';

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
