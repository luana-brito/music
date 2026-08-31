export function estimateDurationFromSize(bytes: number, file?: File) {
  const isWav = Boolean(file && (file.name.toLowerCase().endsWith('.wav') || /wav/i.test(file.type)));
  const bytesPerSecond = isWav ? 176400 : 16000;
  return Math.max(1, Math.round(bytes / bytesPerSecond));
}

export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const fallback = estimateDurationFromSize(file.size, file);
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
