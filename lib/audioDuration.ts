export function estimateDurationFromSize(bytes: number) {
  return Math.max(1, Math.round(bytes / 16000));
}

export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const fallback = estimateDurationFromSize(file.size);
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    const finish = (seconds: number) => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : fallback);
    };

    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(fallback);
    audio.src = objectUrl;
  });
}
