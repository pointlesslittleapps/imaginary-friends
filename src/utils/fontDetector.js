// A curated list of common macOS/system and popular downloaded fonts.
// We test each against the browser's default fallback fonts; if the
// measured width differs, the font is genuinely installed and usable.
const CANDIDATE_FONTS = [
  // macOS system fonts
  'Helvetica Neue', 'Helvetica', 'Arial', 'San Francisco', 'SF Pro Display',
  'SF Pro Text', 'Avenir', 'Avenir Next', 'Futura', 'Optima', 'Baskerville',
  'Didot', 'Georgia', 'Palatino', 'Garamond', 'Times New Roman', 'Times',
  'Courier New', 'Courier', 'Menlo', 'Monaco', 'Verdana', 'Tahoma',
  'Trebuchet MS', 'Gill Sans', 'American Typewriter', 'Copperplate',
  'Marker Felt', 'Papyrus', 'Comic Sans MS', 'Impact', 'Chalkboard',
  'Chalkboard SE', 'Bradley Hand', 'Noteworthy', 'Zapfino', 'Herculanum',
  // Popular downloaded/design fonts
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Nunito', 'Raleway', 'Work Sans', 'Fira Sans',
  'Fira Code', 'JetBrains Mono', 'IBM Plex Sans', 'IBM Plex Mono',
  'Playfair Display', 'Merriweather', 'PT Serif', 'Crimson Text',
  'Space Grotesk', 'DM Sans', 'Karla', 'Rubik', 'Quicksand',
];

function measureText(fontFamily, testString, baseFont) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `72px ${baseFont}`;
  const baseWidth = ctx.measureText(testString).width;

  ctx.font = `72px '${fontFamily}', ${baseFont}`;
  const testWidth = ctx.measureText(testString).width;

  return testWidth !== baseWidth;
}

/**
 * Returns the subset of CANDIDATE_FONTS that appear to be installed
 * on this machine, by comparing rendered widths against two very
 * different fallback fonts (serif and monospace) — if a candidate
 * renders identically to BOTH fallbacks, it's almost certainly missing.
 */
export function detectInstalledFonts() {
  const testString = 'mmmmmmmmmmlliWWW jgqy0123';
  const fallbacks = ['serif', 'monospace'];

  const installed = CANDIDATE_FONTS.filter(font => {
    return fallbacks.some(fallback => measureText(font, testString, fallback));
  });

  return installed;
}
