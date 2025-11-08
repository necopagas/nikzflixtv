// src/types/index.ts

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category?: string;
  language?: string;
  country?: string;
  isLive?: boolean;
}

export interface WatchProgress {
  itemId: number | string;
  progress: number;
  timestamp: number;
  title?: string;
  image?: string;
  duration?: number;
}

export interface MyListItem {
  id: number | string;
  title: string;
  image?: string;
  addedAt: number;
  type?: 'movie' | 'tv' | 'anime' | 'drama';
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'fil' | 'ceb' | 'ko' | 'ja';
  autoplay: boolean;
  quality: 'auto' | 'hd' | 'sd';
  hoverPreviews: boolean;
  dataSaver: boolean;
  subtitleSize: number;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  skipIntroTime: number;
  parentalControls: boolean;
  maturityRating: 'G' | 'PG' | 'PG-13' | 'R' | 'All';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  avatar?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export type Theme = 'light' | 'dark';
export type MediaType = 'movie' | 'tv' | 'anime' | 'drama' | 'vivamax';
export type VideoQuality = 'auto' | 'hd' | 'sd' | '4k';
