import type { HelpArticle } from './types';

interface HelpSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  articles: HelpArticle[];
}

export function HelpSearch({ query, onQueryChange }: HelpSearchProps) {
  return (
    <div className="relative">
      <svg className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search articles..."
        className="w-full pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
        autoFocus
      />
    </div>
  );
}
