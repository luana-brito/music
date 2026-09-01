export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Tribo {
  id: string;
  nome: string;
  cor: string;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Musica {
  id: string;
  nome: string;
  ano: number;
  blobUrl: string;
  capa: string | null;
  duracao: number;
  plays?: number;
  playsWeek?: number;
  playsWeekAt?: Date | string | null;
  triboId: string;
  tribo?: Tribo;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistItem {
  musica: Musica;
  isOffline?: boolean;
}

export interface PlayerState {
  currentTrack: PlaylistItem | null;
  playlist: PlaylistItem[];
  shuffleQueue: string[];
  isPlaying: boolean;
  volume: number;
  repeatMode: 'none' | 'one' | 'all';
  isShuffle: boolean;
}
