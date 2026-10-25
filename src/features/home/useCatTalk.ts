import { useCallback, useEffect, useRef, useState } from 'react';
import type { Transaction } from '../../db/types';
import type { HeroCat } from '../../mascot/heroCat';
import { catLines, catMood, type CatFacts } from '../../lib/insights';
import { useBahtText } from '../../lib/privacy';

const SHOW_MS = 4500;
const CELEBRATE_MS = 2600;

/**
 * The home cat's behaviour: mood from the month's facts, a short celebration whenever an
 * entry is added while home is open, and one line per tap (cycling), shown for a few seconds.
 */
export function useCatTalk(facts: CatFacts, periodFrom: number, txs: Transaction[] | undefined): HeroCat {
  const baht = useBahtText();
  const [line, setLine] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const lines = useRef<string[]>([]);
  lines.current = catLines(facts, baht);
  const next = useRef(0);
  const timer = useRef(0);

  const say = useCallback(() => {
    const ls = lines.current;
    setLine(ls[next.current % ls.length]);
    next.current++;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLine(null), SHOW_MS);
  }, []);
  const party = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(party.current);
    },
    [],
  );

  // a new entry in the month on screen (not a month switch, not the first load)
  const seen = useRef<{ from: number; count: number } | null>(null);
  const count = txs?.length;
  useEffect(() => {
    if (count === undefined) return;
    const before = seen.current;
    seen.current = { from: periodFrom, count };
    if (!before || before.from !== periodFrom || count <= before.count || !facts.current) return;
    setCelebrating(true);
    window.clearTimeout(party.current);
    party.current = window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
  }, [count, periodFrom, facts.current]);

  return { mood: celebrating ? 'celebrate' : catMood(facts), line, say };
}
