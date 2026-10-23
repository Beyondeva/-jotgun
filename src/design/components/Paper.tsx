import { motion, type HTMLMotionProps } from 'framer-motion';

interface Props extends HTMLMotionProps<'div'> {
  /** tear the bottom edge like a receipt */
  torn?: boolean;
  pressable?: boolean;
}

/** A sheet of receipt paper lying on the page. Use it only to group things; plain content sits on the page. */
export function Paper({ torn, pressable, className, ...rest }: Props) {
  return (
    <motion.div
      whileTap={pressable ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.12 }}
      className={`paper ${torn ? 'paper--torn' : ''} ${pressable ? 'paper--pressable' : ''} ${className ?? ''}`}
      {...rest}
    />
  );
}
