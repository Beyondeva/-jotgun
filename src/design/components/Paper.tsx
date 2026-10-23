interface Props extends React.HTMLAttributes<HTMLDivElement> {
  /** tear the bottom edge like a receipt */
  torn?: boolean;
  pressable?: boolean;
}

/** A sheet of receipt paper lying on the page. Use it only to group things; plain content sits on the page. */
export function Paper({ torn, pressable, className, ...rest }: Props) {
  return <div className={`paper ${torn ? 'paper--torn' : ''} ${pressable ? 'paper--pressable' : ''} ${className ?? ''}`} {...rest} />;
}
