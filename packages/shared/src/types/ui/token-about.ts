/**
 * Props for the TokenAbout component (base - platform-agnostic)
 * Displays a token's "About" section with description
 */
export interface TokenAboutPropsBase<TStyle = any> {
  /** Token description text */
  description?: string;
  /** Title text (default: "About") */
  title?: string;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Maximum number of lines to show before truncating (0 = no limit) */
  maxLines?: number;
  /** Optional custom styles for the container */
  style?: TStyle;
}
