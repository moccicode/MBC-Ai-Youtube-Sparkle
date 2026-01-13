
export interface VideoData {
  id: string;
  thumbnail: string;
  title: string;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  subscriberCount: number;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  ratio: number; // Views / Subscribers * 100
}

export interface DetailedInfo extends VideoData {
  description: string;
  categoryId: string;
  categoryName?: string;
  channelPublishedAt: string;
  channelViewCount: number;
  channelVideoCount: number;
  country?: string;
}

export type SortField = 'viewCount' | 'likeCount' | 'subscriberCount' | 'ratio' | 'publishedAt';
export type SortOrder = 'asc' | 'desc';

export type VideoLengthFilter = 'all' | 'short' | 'long';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export interface SearchFilters {
  keyword: string;
  length: VideoLengthFilter;
  date: DateFilter;
  maxResults: number;
}
