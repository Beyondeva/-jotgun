import { Icon, type IconDefinition } from '../Icon';

/*
 * Press feedback is a background tint in CSS (see components.css "Press feedback"),
 * not a scale animation: transforming on tap makes iOS Safari move the element onto
 * its own GPU layer and back, which shows up as a flicker of the text.
 */

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: the one action per view · ink: strong but not the main CTA · quiet: outlined · ghost: text only */
  variant?: 'primary' | 'ink' | 'quiet' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  icon?: IconDefinition;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className ?? ''}`} {...rest}>
      {icon && <Icon icon={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  type = 'button',
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { icon: IconDefinition; label: string }) {
  return (
    <button type={type} aria-label={label} className={`icon-btn ${className ?? ''}`} {...rest}>
      <Icon icon={icon} size={16} />
    </button>
  );
}
