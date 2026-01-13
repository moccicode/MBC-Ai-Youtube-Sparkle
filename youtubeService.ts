
import { VideoData, SearchFilters, DetailedInfo } from './types';
import { parseDuration } from './utils';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// 카테고리 ID를 이름으로 매핑하는 간단한 객체
const categoryMap: Record<string, string> = {
  "1": "영화/애니메이션", "2": "자동차", "10": "음악", "15": "반려동물/동물", "17": "스포츠",
  "19": "여행/이벤트", "20": "게임", "22": "인물/브로그", "23": "코미디", "24": "엔터테인먼트",
  "25": "뉴스/정치", "26": "노하우/스타일", "27": "교육", "28": "과학기술", "29": "비영리/사회운동"
};

export const fetchYoutubeData = async (
  apiKey: string,
  filters: SearchFilters
): Promise<DetailedInfo[]> => {
  const { keyword, date, maxResults, length } = filters;

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

  const videoParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds,
    key: apiKey,
  });

  const videoRes = await fetch(`${BASE_URL}/videos?${videoParams.toString()}`);
  const videoDetails = await videoRes.json();

  const channelIds = Array.from(new Set(videoDetails.items.map((v: any) => v.snippet.channelId))).join(',');
  const channelParams = new URLSearchParams({
    part: 'snippet,statistics',
    id: channelIds,
    key: apiKey,
  });

  const channelRes = await fetch(`${BASE_URL}/channels?${channelParams.toString()}`);
  const channelDetails = await channelRes.json();

  const channelInfoMap = channelDetails.items.reduce((acc: any, item: any) => {
    acc[item.id] = {
      subscribers: parseInt(item.statistics.subscriberCount || '0', 10),
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      videoCount: parseInt(item.statistics.videoCount || '0', 10),
      country: item.snippet.country || '알 수 없음'
    };
    return acc;
  }, {});

  const results: DetailedInfo[] = videoDetails.items.map((video: any) => {
    const vStats = video.statistics;
    const vSnippet = video.snippet;
    const duration = video.contentDetails.duration;
    const durationSeconds = parseDuration(duration);
    const viewCount = parseInt(vStats.viewCount || '0', 10);
    const likeCount = parseInt(vStats.likeCount || '0', 10);
    const cInfo = channelInfoMap[vSnippet.channelId] || {};
    const subCount = cInfo.subscribers || 0;
    const ratio = subCount > 0 ? (viewCount / subCount) * 100 : 0;

    return {
      id: video.id,
      thumbnail: vSnippet.thumbnails.maxres?.url || vSnippet.thumbnails.high?.url || vSnippet.thumbnails.medium.url,
      title: vSnippet.title,
      description: vSnippet.description,
      categoryId: vSnippet.categoryId,
      categoryName: categoryMap[vSnippet.categoryId] || '기타',
      channelId: vSnippet.channelId,
      channelTitle: vSnippet.channelTitle,
      viewCount,
      likeCount,
      subscriberCount: subCount,
      publishedAt: vSnippet.publishedAt,
      duration: duration,
      durationSeconds,
      ratio,
      channelPublishedAt: cInfo.publishedAt,
      channelViewCount: cInfo.viewCount,
      channelVideoCount: cInfo.videoCount,
      country: cInfo.country
    };
  });

  if (length === 'short') {
    return results.filter((v) => v.durationSeconds <= 60);
  } else if (length === 'long') {
    return results.filter((v) => v.durationSeconds > 60);
  }

  return results;
};
