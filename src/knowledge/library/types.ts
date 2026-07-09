export type LibraryCategory =
  | 'philosophy'
  | 'club-dna'
  | 'formations'
  | 'principles'
  | 'coaching-craft';

export type LibrarySection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type LibraryReference = {
  label: string;
  url?: string;
};

export type LibraryArticle = {
  id: string;
  category: LibraryCategory;
  title: string;
  subtitle: string;
  /** Era or period the article covers, e.g. "1987-1991". */
  era?: string;
  /** Club, national team, or coaching tradition the article is rooted in. */
  origin?: string;
  tags: readonly string[];
  /** Optional link to a diagram in the legacy coachingLibrary items (rendered collapsed, text stays primary). */
  diagramId?: string;
  sections: readonly LibrarySection[];
  keyIdeas: readonly string[];
  trainingIdeas?: readonly string[];
  references?: readonly LibraryReference[];
  /** Draft articles are hidden from the library UI until promoted. */
  status: 'draft' | 'active';
  /** ISO date (YYYY-MM-DD) of the last content revision. */
  updatedOn: string;
};
