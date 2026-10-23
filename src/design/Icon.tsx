import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type { IconDefinition };

interface Props {
  icon: IconDefinition;
  /** px */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** App-wide icon: Font Awesome Solid, sized in px. */
export function Icon({ icon, size = 18, className, style }: Props) {
  return <FontAwesomeIcon icon={icon} className={className} style={{ fontSize: size, ...style }} aria-hidden />;
}
