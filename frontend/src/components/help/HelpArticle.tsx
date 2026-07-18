import type { HelpArticle as HelpArticleType } from './types';

interface HelpArticleProps {
  article: HelpArticleType;
  onBack: () => void;
}

const calloutStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600' },
  tip: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
};

export function HelpArticle({ article, onBack }: HelpArticleProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#4f46e5] mb-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to articles
      </button>

      <h2 className="text-lg font-semibold text-[#111827] mb-1">{article.title}</h2>
      <p className="text-sm text-[#6b7280] mb-4">{article.summary}</p>

      <div className="space-y-3">
        {article.content.map((block, index) => {
          switch (block.type) {
            case 'paragraph':
              return (
                <p key={index} className="text-sm text-[#374151] leading-relaxed">
                  {block.text}
                </p>
              );
            case 'heading':
              return (
                <h3 key={index} className="text-sm font-semibold text-[#111827] mt-4">
                  {block.text}
                </h3>
              );
            case 'list':
              return (
                <ul key={index} className="space-y-1.5">
                  {block.items?.map((item, i) => (
                    <li key={i} className="text-sm text-[#374151] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] mt-1.5 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              );
            case 'code':
              return (
                <pre key={index} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-md p-3 text-xs font-mono text-[#374151] overflow-x-auto">
                  {block.text}
                </pre>
              );
            case 'callout': {
              const styles = calloutStyles[block.variant || 'info'];
              return (
                <div key={index} className={`${styles.bg} ${styles.border} border rounded-md p-3 flex items-start gap-2`}>
                  <svg className={`w-4 h-4 ${styles.icon} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-sm ${styles.text}`}>{block.text}</p>
                </div>
              );
            }
            case 'link':
              return (
                <a
                  key={index}
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#4f46e5] hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {block.text}
                </a>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
