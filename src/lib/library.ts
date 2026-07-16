// Books & articles the client has authored — the "professional library" showcase.
// NEUTRAL TEMPLATE: this data is composed PER CLIENT from their own brief (real
// titles, real authorship, real cover art generated into /media/generated/). The
// arrays below ship EMPTY on purpose — a fresh scaffold carries zero prior-client
// content. The consuming components (BooksArticles / BookShelf / the /library route)
// all render nothing for an empty set, so the section simply drops out until composed.
// Book summaries are YMYL-sensitive: only ever fill them from client-confirmed facts.

export type Book = {
  slug: string;
  title: string;
  author: string;
  meta?: string; // edition / year line
  image: string; // composed cover art, e.g. "/media/generated/<slug>.webp"
  blurb: string; // one line for the card
  summary: string[]; // paragraphs for the book page
  topics: string[]; // key-topic chips
};

export type Article = { title: string; author: string; year: string; href: string };
export type KnowledgeLink = { label: string; href: string };

// Composed per client from the brief — empty in the neutral template.
export const books: Book[] = [];

export function bookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

// Selected articles — composed per client from their own publications. Empty in the template.
export const articles: Article[] = [];

// Topic hubs / knowledge-base links — composed per client. Empty in the template.
export const knowledgeLinks: KnowledgeLink[] = [];
