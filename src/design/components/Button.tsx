import { motion, type HTMLMotionProps } from 'framer-motion';
import { Icon, type IconDefinition } from '../Icon';

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** primary: the one action per view · ink: strong but not the main CTA · quiet: outlined · ghost: text only */
  variant?: 'primary' | 'ink' | 'quiet' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  icon?: IconDefinition;
  block?: boolean;
  children?: React.ReactNode;
}

const press = { scale: 0.98 };
const tween = { duration: 0.12 };

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: Props) {
  return (
    <motion.button
      whileTap={press}
      transition={tween}
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className ?? ''}`}
      {...rest}
    >
      {icon && <Icon icon={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
    </motion.button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'children'> & { icon: IconDefinition; label: string }) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} transition={tween} aria-label={label} className={`icon-btn ${className ?? ''}`} {...rest}>
      <Icon icon={icon} size={16} />
    </motion.button>
  );
}
