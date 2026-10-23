import type { Slip } from '../../db/types';
import { useObjectUrl } from '../../lib/useObjectUrl';

/** Up to three slip thumbnails fanned out like a small stack of paper. */
export function InboxThumbs({ slips }: { slips: Slip[] }) {
  return (
    <span className="inbox-strip__thumbs" aria-hidden>
      {slips.slice(0, 3).map((s, i) => (
        <Thumb key={s.id} slip={s} i={i} />
      ))}
    </span>
  );
}

function Thumb({ slip, i }: { slip: Slip; i: number }) {
  const url = useObjectUrl(slip.thumb);
  return (
    <span style={{ left: i * 10, transform: `rotate(${(i - 1) * 5}deg)`, zIndex: 3 - i, background: '#fff' }}>
      {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </span>
  );
}
