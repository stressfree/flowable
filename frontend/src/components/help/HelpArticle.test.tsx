import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpArticle } from './HelpArticle';
import type { HelpArticle as HelpArticleType } from './types';

const article: HelpArticleType = {
  id: 'test-article',
  title: 'Test Article Title',
  summary: 'Test article summary text',
  category: 'getting-started',
  content: [
    { type: 'paragraph', text: 'This is a paragraph block.' },
    { type: 'heading', text: 'Section Heading' },
    { type: 'list', items: ['First item', 'Second item'] },
    { type: 'code', text: 'const x = 42;' },
    { type: 'callout', variant: 'info', text: 'This is an info callout.' },
    { type: 'callout', variant: 'warning', text: 'This is a warning callout.' },
    { type: 'callout', variant: 'tip', text: 'This is a tip callout.' },
    { type: 'link', text: 'External Link', url: 'https://example.com' },
  ],
};

describe('HelpArticle', () => {
  it('renders article title', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('renders article summary', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('Test article summary text')).toBeInTheDocument();
  });

  it('renders back button and calls onBack when clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<HelpArticle article={article} onBack={onBack} />);

    const backButton = screen.getByText('Back to articles');
    await user.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  it('renders paragraph content', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('This is a paragraph block.')).toBeInTheDocument();
  });

  it('renders heading content', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('Section Heading')).toBeInTheDocument();
  });

  it('renders list items', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
  });

  it('renders code block', () => {
    const { container } = render(<HelpArticle article={article} onBack={vi.fn()} />);

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe('const x = 42;');
  });

  it('renders callout blocks', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    expect(screen.getByText('This is an info callout.')).toBeInTheDocument();
    expect(screen.getByText('This is a warning callout.')).toBeInTheDocument();
    expect(screen.getByText('This is a tip callout.')).toBeInTheDocument();
  });

  it('renders link block with correct href', () => {
    render(<HelpArticle article={article} onBack={vi.fn()} />);

    const link = screen.getByText('External Link');
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('renders null for unknown block types', () => {
    const articleWithUnknown: typeof article = {
      ...article,
      content: [
        { type: 'paragraph', text: 'Before unknown' },
        { type: 'unknown' as 'paragraph', text: 'Unknown block' },
        { type: 'paragraph', text: 'After unknown' },
      ],
    };

    render(<HelpArticle article={articleWithUnknown} onBack={vi.fn()} />);

    expect(screen.getByText('Before unknown')).toBeInTheDocument();
    expect(screen.getByText('After unknown')).toBeInTheDocument();
    expect(screen.queryByText('Unknown block')).not.toBeInTheDocument();
  });
});
