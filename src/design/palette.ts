/** Category inks. Keys are stored in the DB, so never rename one. */
export const CAT_COLORS = ['brick', 'clay', 'ochre', 'olive', 'moss', 'teal', 'sky', 'indigo', 'plum', 'rose', 'sand', 'slate'] as const;

export type CatColor = (typeof CAT_COLORS)[number];

/** The 8 colours offered when creating or editing a category. */
export const CATEGORY_COLORS: CatColor[] = ['brick', 'ochre', 'moss', 'teal', 'sky', 'indigo', 'plum', 'rose'];

export const catColor = (key: CatColor) => ({
  ink: `var(--cat-${key})`,
  /** a faint wash of the colour on paper */
  wash: `color-mix(in srgb, var(--cat-${key}) 13%, var(--sheet))`,
});
