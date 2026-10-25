import { CatBubble, CAT_LABEL, useHeroCat } from '../../mascot/heroCat';
import { KhaoTang } from '../../mascot/KhaoTang';

/** ข้าวตัง in the plain themes' hero, top right: tap it to hear about the month. */
export function HeroCat() {
  const { mood, line, say } = useHeroCat();
  return (
    <div className="hero__cat">
      <button type="button" className="hero__cat-btn" onClick={say} aria-label={CAT_LABEL}>
        <KhaoTang mood={mood} size={96} live />
      </button>
      <CatBubble text={line} className="kt-bubble--left" />
    </div>
  );
}
