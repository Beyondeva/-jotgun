import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Component, type ReactNode } from 'react';
import { Button } from '../design/components/Button';
import { EmptyState } from '../design/components/Feedback';
import { isChunkError, reloadForNewBuild } from '../lib/staleBuild';

/**
 * Around routed pages: a page that can't load (usually a chunk gone after a deploy) shows
 * a "โหลดใหม่" button instead of taking the whole app down to a blank screen.
 * Keyed by path in the layout, so moving to another tab clears it.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // a missing chunk: try the new build once before showing the button
    if (isChunkError(error)) reloadForNewBuild();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <EmptyState
        mood="worried"
        title="เปิดหน้านี้ไม่สำเร็จ"
        body="แอปอาจเพิ่งอัปเดต ลองโหลดใหม่อีกครั้ง"
        action={
          <Button variant="ink" icon={faRotateRight} onClick={() => window.location.reload()}>
            โหลดใหม่
          </Button>
        }
      />
    );
  }
}
