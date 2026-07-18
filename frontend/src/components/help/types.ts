export interface HelpContent {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'callout' | 'link';
  text?: string;
  items?: string[];
  url?: string;
  variant?: 'info' | 'warning' | 'tip';
}

export interface HelpArticle {
  id: string;
  title: string;
  category: 'getting-started' | 'reference' | 'learn-more';
  summary: string;
  content: HelpContent[];
  relatedPages?: string[];
}
