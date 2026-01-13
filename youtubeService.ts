
import { VideoData, SearchFilters } from './types';
import { parseDuration } from './utils';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchYoutubeData = async (
  apiKey: string,
  filters: SearchFilters
): Promise<VideoData[]> => {
  const { keyword, date, maxResults, length } = filters;

  // 1. Calculate publishedAfter based on date filter
  let publishedAfter = '';
  const now = new Date();
  if (date === 'today') {
    now.setHours(0, 0, 0, 0);
    publishedAfter = now.toISOString();
  } else if (date === 'week') {
    now.setDate(now.getDate() - 7);
    publishedAfter = now.toISOString();
  } else if (date === 'month') {
    now.setMonth(now.getMonth() - 1);
    publishedAfter = now.toISOString();
  } else if (date === 'year') {
    now.setFullYear(now.getFullYear() - 1);
    publishedAfter = now.toISOString();
  }

  // 2. Search videos
  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: keyword,
    type: 'video',
    maxResults: maxResults.toString(),
    key: apiKey,
    ...(publishedAfter && { publishedAfter }),
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams.toString()}`);
  if (!searchRes.ok) {
    const errorData = await searchRes.json();
    throw new Error(errorData.error?.message || '검색 요청 실패');
  }
  const searchData = await searchRes.json();
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

  if (!videoIds) return [];

  // 3. Get video statistics & contentDetails (for duration)
  const videoParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds,
    key: apiKey,
  });

  const videoRes = await fetch(`${BASE_URL}/videos?${videoParams.toString()}`);
  const videoDetails = await videoRes.json();

  // 4. Get channel details for subscribers
  const channelIds = Array.from(new Set(videoDetails.items.map((v: any) => v.snippet.channelId))).join(',');
  const channelParams = new URLSearchParams({
    part: 'statistics',
    id: channelIds,
    key: apiKey,
  });

  const channelRes = await fetch(`${BASE_URL}/channels?${channelParams.toString()}`);
  const channelDetails = await channelRes.json();

  const channelMap = channelDetails.items.reduce((acc: any, item: any) => {
    acc[item.id] = parseInt(item.statistics.subscriberCount || '0', 10);
    return acc;
  }, {});

  // 5. Combine and calculate
  const results: VideoData[] = videoDetails.items.map((video: any) => {
    const vStats = video.statistics;
    const vSnippet = video.snippet;
    const duration = video.contentDetails.duration;
    const durationSeconds = parseDuration(duration);
    const viewCount = parseInt(vStats.viewCount || '0', 10);
    const likeCount = parseInt(vStats.likeCount || '0', 10);
    const subCount = channelMap[vSnippet.channelId] || 0;
    const ratio = subCount > 0 ? (viewCount / subCount) * 100 : 0;

    return {
      id: video.id,
      thumbnail: vSnippet.thumbnails.medium.url,
      title: vSnippet.title,
      channelId: vSnippet.channelId,
      channelTitle: vSnippet.channelTitle,
      viewCount,
      likeCount,
      subscriberCount: subCount,
      publishedAt: vSnippet.publishedAt,
      duration: duration,
      durationSeconds,
      ratio,
    };
  });

  // 6. Apply video length filter (done locally as API doesn't support fine-grained duration filtering easily)
  if (length === 'short') {
    return results.filter((v) => v.durationSeconds <= 60);
  } else if (length === 'long') {
    return results.filter((v) => v.durationSeconds > 60);
  }

  return results;
};
