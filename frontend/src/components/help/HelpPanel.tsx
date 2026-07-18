import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useHelp } from '@/components/layout/HelpContext';
import { helpArticles } from './articles';
import { HelpSearch } from './HelpSearch';
import { HelpArticle } from './HelpArticle';
import type { HelpArticle as HelpArticleType } from './types';

const categoryLabels: Record<string, string> = {
  'getting-started': 'Getting Started',
  reference: 'Reference',
  'learn-more': 'Learn More',
};

function filterArticles(query: string): HelpArticleType[] {
  if (!query.trim()) return helpArticles;
  const lower = query.toLowerCase();
  return helpArticles.filter((article) => {
    const inTitle = article.title.toLowerCase().includes(lower);
    const inSummary = article.summary.toLowerCase().includes(lower);
    const inContent = article.content.some((block) => {
      if (block.text) return block.text.toLowerCase().includes(lower);
      if (block.items) return block.items.some((item) => item.toLowerCase().includes(lower));
      return false;
    });
    return inTitle || inSummary || inContent;
  });
}

function getContextualArticle(pathname: string): string | null {
  if (pathname === '/bundles/new') return 'creating-first-bundle';
  if (pathname.startsWith('/bundles/') && pathname.includes('/files/')) return 'file-types-bpmn-cmmn-dmn';
  if (pathname.startsWith('/bundles/') && pathname.includes('/spawn')) return 'spawning-processes';
  if (pathname.startsWith('/bundles/')) return 'validating-bundles';
  if (pathname.startsWith('/companies')) return 'company-hierarchy';
  return null;
}

export function HelpPanel() {
  const { isOpen, close } = useHelp();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [contextualHighlight, setContextualHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const contextual = getContextualArticle(location.pathname);
      setContextualHighlight(contextual);
    }
  }, [isOpen, location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedArticleId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  const filteredArticles = filterArticles(query);
  const selectedArticle = selectedArticleId
    ? helpArticles.find((a) => a.id === selectedArticleId)
    : null;

  const grouped = filteredArticles.reduce((acc, article) => {
    (acc[article.category] = acc[article.category] || []).push(article);
    return acc;
  }, {} as Record<string, HelpArticleType[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[380px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111827]">Help & Docs</h2>
              <button
                onClick={close}
                className="text-[#6b7280] hover:text-[#111827] p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-[#e5e7eb]">
              <HelpSearch query={query} onQueryChange={setQuery} articles={filteredArticles} />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {selectedArticle ? (
                <div className="p-4">
                  <HelpArticle article={selectedArticle} onBack={() => setSelectedArticleId(null)} />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {contextualHighlight && !query && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                      <p className="text-xs text-[#4f46e5] font-semibold uppercase tracking-wider mb-1">
                        Relevant to current page
                      </p>
                      {(() => {
                        const article = helpArticles.find((a) => a.id === contextualHighlight);
                        if (!article) return null;
                        return (
                          <button
                            onClick={() => setSelectedArticleId(article.id)}
                            className="text-left w-full"
                          >
                            <p className="text-sm font-medium text-[#111827] hover:text-[#4f46e5]">{article.title}</p>
                            <p className="text-xs text-[#6b7280] mt-0.5">{article.summary}</p>
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  {Object.entries(grouped).map(([category, articles]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">
                        {categoryLabels[category] || category}
                      </p>
                      <div className="space-y-1">
                        {articles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticleId(article.id)}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-[#111827]">{article.title}</p>
                            <p className="text-xs text-[#6b7280] mt-0.5">{article.summary}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {filteredArticles.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#6b7280]">No articles found for "{query}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
