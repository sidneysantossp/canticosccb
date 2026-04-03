import type { Hino } from '@/types';
import { getEmergencyArchiveZipSegmentByNumber } from '@/lib/emergencyAudioArchives';

export function resolveEmergencyArchiveTrack(track: Hino): Hino | null {
  const segment = getEmergencyArchiveZipSegmentByNumber(track.number);
  if (!segment) {
    return null;
  }

  return {
    ...track,
    audioUrl:
      `/api/emergency-audio-track?segment=${encodeURIComponent(segment.id)}` +
      `&number=${encodeURIComponent(String(track.number || 0))}` +
      `&title=${encodeURIComponent(track.title || '')}`,
  };
}
