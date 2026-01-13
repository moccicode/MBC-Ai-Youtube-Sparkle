
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Youtube, 
  Key, 
  Clock, 
  TrendingUp, 
  Users, 
  ThumbsUp, 
  Eye,
  Calendar,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Trophy,
  Rocket,
  Heart,
  Globe,
  Video,
  Info,
  Layers,
  BarChart3,
  MousePointer2,
  LayoutGrid,
  List,
  Star,
  Trash2,
  Bookmark,
  FolderHeart,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  DetailedInfo, 
  SearchFilters, 
  SortField, 
  SortOrder, 
  VideoLengthFilter, 
  DateFilter,
  Favorite
} from './types';
import { fetchYoutubeData } from './youtubeService';
import { formatNumber, formatDate, formatDuration } from './utils';

const App: React.FC = () => {
  // --- States ---
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('yt_api_key') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    length: 'all',
    date: 'all',
    maxResults: 20
  });
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    const saved = localStorage.getItem('yt_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteVideos, setFavoriteVideos] = useState<DetailedInfo[]>(() => {
    const saved = localStorage.getItem('yt_fav_videos');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DetailedInfo[]>([]);
  const [sortField, setSortField] = useState<SortField>('ratio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVideo, setSelectedVideo] = useState<DetailedInfo | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('yt_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('yt_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('yt_fav_videos', JSON.stringify(favoriteVideos));
  }, [favoriteVideos]);

  // --- Handlers ---
  const handleSearch = async (e?: React.FormEvent, overrideKeyword?: string) => {
    if (e) e.preventDefault();
    const searchKeyword = overrideKeyword || filters.keyword;
    
    if (!apiKey) {
      setError('어머! YouTube API 키를 입력해주셔야 분석을 시작할 수 있어요! ✨');
      return;
    }
    if (!searchKeyword.trim()) {
      setError('어떤 보물을 찾으시나요? 검색어를 입력해주세요! 🔍');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveTab('search');
    try {
      const data = await fetchYoutubeData(apiKey, { ...filters, keyword: searchKeyword });
      setResults(data);
      if (overrideKeyword) {
        setFilters(prev => ({ ...prev, keyword: overrideKeyword }));
      }
    } catch (err: any) {
      setError(err.message || '앗, 통신에 살짝 문제가 생겼어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeywordFavorite = () => {
    const keyword = filters.keyword.trim();
    if (!keyword) return;
    if (favorites.some(f => f.keyword === keyword)) {
      setError('이미 즐겨찾기에 등록된 키워드에요! 💖');
      return;
    }
    const newFav: Favorite = { id: Date.now().toString(), keyword, addedAt: new Date().toISOString() };
    setFavorites(prev => [newFav, ...prev]);
  };

  const handleToggleVideoFavorite = (video: DetailedInfo) => {
    const isAlreadyFav = favoriteVideos.some(v => v.id === video.id);
    if (isAlreadyFav) {
      setFavoriteVideos(prev => prev.filter(v => v.id !== video.id));
    } else {
      setFavoriteVideos(prev => [video, ...prev]);
    }
  };

  const handleExportExcel = (dataList: DetailedInfo[], filename: string) => {
    if (dataList.length === 0) return;
    const dataToExport = dataList.map((v, index) => ({
      '순위': index + 1,
      '제목': v.title,
      '채널명': v.channelTitle,
      '조회수': v.viewCount,
      '구독자수': v.subscriberCount,
      '떡상 지수(%)': v.ratio.toFixed(2),
      '영상 길이': formatDuration(v.durationSeconds),
      '업로드 날짜': formatDate(v.publishedAt),
      '유튜브 링크': `https://www.youtube.com/watch?v=${v.id}`
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "데이터");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const displayData = useMemo(() => {
    const source = activeTab === 'search' ? results : favoriteVideos;
    return [...source].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'publishedAt') {
        valA = new Date(a.publishedAt).getTime();
        valB = new Date(b.publishedAt).getTime();
      }
      if (sortOrder === 'asc') return Number(valA) - Number(valB);
      return Number(valB) - Number(valA);
    });
  }, [results, favoriteVideos, activeTab, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4 opacity-20"><ArrowUpDown size={16} /></div>;
    return sortOrder === 'asc' ? <ChevronUp size={18} className="text-rose-500" /> : <ChevronDown size={18} className="text-rose-500" />;
  };

  return (
    <div className={`min-h-screen pb-20 transition-all ${selectedVideo ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <header className="header-gradient backdrop-blur-lg border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500 p-3 rounded-[1.25rem] rotate-3 hover:rotate-0 transition-all cursor-pointer shadow-lg shadow-rose-200">
                <Youtube className="text-white" size={32} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-[900] tracking-tight text-slate-800 flex items-center gap-2">
                  YouTube <span className="text-rose-500">Sparkle</span>
                  <Sparkles size={24} className="text-amber-400 fill-amber-400" />
                </h1>
                <span className="text-sm font-bold text-rose-400/80 mt-[-2px]">나만 알고 싶은 떡상 분석기</span>
              </div>
            </div>
            <div className="relative group hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="h-5 w-5 text-rose-300" /></div>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="YouTube API Key ✨" 
                className="block w-72 pl-12 pr-6 py-3 bg-white border-2 border-rose-50 rounded-full text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all shadow-sm" 
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Advanced Search & Filter Section */}
        <section className="bg-white p-10 rounded-[3rem] cute-shadow border border-rose-50 mb-12 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
            <TrendingUp size={300} fill="currentColor" className="text-rose-500" />
          </div>
          
          <form onSubmit={handleSearch} className="space-y-10 relative z-10">
            {/* Search Bar */}
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={filters.keyword} 
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} 
                  placeholder="분석하고 싶은 검색어를 입력해 주세요! 🔍" 
                  className="w-full pl-10 pr-40 py-7 bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] focus:border-rose-300 focus:bg-white focus:outline-none transition-all text-2xl font-bold shadow-inner placeholder:text-slate-300" 
                />
                <div className="absolute right-4 top-4 bottom-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={handleAddKeywordFavorite} 
                    className="px-5 bg-white border-2 border-rose-100 text-rose-400 rounded-2xl hover:bg-rose-50 transition-all shadow-md active:scale-90"
                    title="검색어 즐겨찾기"
                  >
                    <Star size={28} className={favorites.some(f => f.keyword === filters.keyword.trim()) ? "fill-rose-500 text-rose-500" : ""} />
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="px-10 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:bg-slate-200"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={32} /> : <Search size={32} />}
                  </button>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleExportExcel(displayData, `YouTubeSparkle_Analysis_${filters.keyword}`)} 
                disabled={displayData.length === 0 || isLoading} 
                className="flex items-center justify-center gap-3 px-12 py-7 bg-amber-400 text-white font-[900] text-xl rounded-[2.5rem] hover:bg-amber-500 transition-all shadow-xl shadow-amber-100 shrink-0"
              >
                <Download size={28} /> 리포트 다운로드
              </button>
            </div>

            {/* Keyword Favorites Chips */}
            {favorites.length > 0 && (
              <div className="flex flex-wrap gap-3 p-5 bg-rose-50/30 border border-rose-100 rounded-[2rem]">
                <div className="w-full flex items-center gap-2 mb-1 px-2">
                  <Bookmark size={14} className="text-rose-400" />
                  <span className="text-xs font-black text-rose-400 uppercase tracking-widest">내가 저장한 검색어</span>
                </div>
                {favorites.map((fav) => (
                  <div key={fav.id} className="relative flex items-center">
                    <button 
                      type="button" 
                      onClick={() => handleSearch(undefined, fav.keyword)} 
                      className="pl-5 pr-12 py-3 bg-white border border-rose-100 rounded-full text-sm font-bold text-slate-600 hover:border-rose-400 hover:text-rose-500 transition-all shadow-sm"
                    >
                      {fav.keyword}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFavorites(prev => prev.filter(f => f.id !== fav.id))} 
                      className="absolute right-4 text-slate-300 hover:text-rose-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
              <div className="space-y-4">
                <label className="px-3 text-sm font-black text-rose-400 flex items-center gap-2 uppercase tracking-[0.1em]">
                  <Clock size={18} /> 영상 길이
                </label>
                <select 
                  value={filters.length} 
                  onChange={(e) => setFilters(prev => ({ ...prev, length: e.target.value as VideoLengthFilter }))} 
                  className="w-full p-5 border-2 border-rose-50 rounded-3xl bg-rose-50/20 text-lg font-bold text-slate-700 focus:ring-4 focus:ring-rose-50 outline-none hover:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="all">모든 길이</option>
                  <option value="short">짧은 영상 (1분 이하 ⚡)</option>
                  <option value="long">긴 영상 (1분 이상 📺)</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="px-3 text-sm font-black text-rose-400 flex items-center gap-2 uppercase tracking-[0.1em]">
                  <Calendar size={18} /> 업로드 날짜
                </label>
                <select 
                  value={filters.date} 
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value as DateFilter }))} 
                  className="w-full p-5 border-2 border-rose-50 rounded-3xl bg-rose-50/20 text-lg font-bold text-slate-700 focus:ring-4 focus:ring-rose-50 outline-none hover:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="all">전체 기간</option>
                  <option value="today">오늘 (24시간 내)</option>
                  <option value="week">이번 주 (7일 내)</option>
                  <option value="month">이번 달 (30일 내)</option>
                  <option value="year">올해 (1년 내)</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="px-3 text-sm font-black text-rose-400 flex items-center gap-2 uppercase tracking-[0.1em]">
                  <Rocket size={18} /> 검색 개수
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={filters.maxResults} 
                    onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 10 }))} 
                    className="w-full p-5 border-2 border-rose-50 rounded-3xl bg-rose-50/20 text-lg font-bold text-slate-700 focus:ring-4 focus:ring-rose-50 outline-none hover:bg-white transition-all" 
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-300 font-bold">개</span>
                </div>
              </div>

              <div className="flex items-center justify-center bg-rose-50/40 rounded-[2.5rem] p-8 border-2 border-rose-100 border-dashed group">
                <div className="text-center space-y-2">
                  <p className="text-sm font-black text-rose-500 leading-relaxed group-hover:scale-110 transition-transform">떡상 지수가 높을수록🔥</p>
                  <p className="text-[11px] font-bold text-rose-400 leading-snug">구독자 대비 조회수가 폭발한<br/>바이럴 영상입니다!</p>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Tab & Display Mode & Sort Selection */}
        <div className="flex flex-col xl:flex-row items-center justify-between mb-12 gap-8 px-4">
          <div className="flex items-center bg-white p-2 rounded-[2.5rem] shadow-sm border border-rose-50">
            <button onClick={() => setActiveTab('search')} className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all ${activeTab === 'search' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100 scale-105' : 'text-slate-400 hover:text-rose-400'}`}>
              <Search size={22} /> 검색 결과
            </button>
            <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all ${activeTab === 'saved' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100 scale-105' : 'text-slate-400 hover:text-rose-400'}`}>
              <FolderHeart size={22} /> 영상 보관함 <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">{favoriteVideos.length}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {/* Sorting Controls */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <span className="text-xs font-black text-slate-400 px-2 flex items-center gap-2"><ArrowUpDown size={14} /> 정렬:</span>
              {[
                { label: '떡상지수', field: 'ratio' as SortField },
                { label: '조회수', field: 'viewCount' as SortField },
                { label: '구독자', field: 'subscriberCount' as SortField },
              ].map((item) => (
                <button 
                  key={item.field} 
                  onClick={() => toggleSort(item.field)} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${sortField === item.field ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-rose-300'}`}
                >
                  {item.label}
                  <SortIcon field={item.field} />
                </button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-rose-50/50 p-2 rounded-2xl border border-rose-100">
              <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}>
                <LayoutGrid size={24} />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}>
                <List size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="relative min-h-[600px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[4rem] z-10 border border-white">
              <div className="relative mb-10">
                <div className="w-32 h-32 border-[10px] border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                <Sparkles size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" />
              </div>
              <p className="text-3xl font-[900] text-rose-500 animate-pulse tracking-tight">트렌드 마법 분석 중... ✨</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-rose-100 cute-shadow">
              <Trophy className="text-rose-200 mb-6" size={80} />
              <p className="text-slate-500 font-black text-2xl">{activeTab === 'search' ? '분석하고 싶은 키워드를 검색해 보세요!' : '보관함이 비어있어요. 멋진 영상을 담아보세요!'}</p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="bg-white rounded-[4rem] cute-shadow border border-rose-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-rose-50/40 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                      <th className="px-10 py-10 w-20 text-center">No</th>
                      <th className="px-10 py-10 w-64">Preview</th>
                      <th className="px-10 py-10">Video Analysis</th>
                      <th className="px-10 py-10">Stats</th>
                      <th className="px-10 py-10 bg-rose-500/5 text-rose-600">Viral Index</th>
                      <th className="px-10 py-10 text-center">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {displayData.map((video, index) => (
                      <tr key={video.id} className="hover:bg-rose-50/10 transition-all group">
                        <td className="px-10 py-10 text-center font-black text-slate-400">{index + 1}</td>
                        <td className="px-10 py-10">
                          <div onClick={() => setSelectedVideo(video)} className="relative cursor-pointer overflow-hidden rounded-[1.5rem] shadow-lg aspect-video border-4 border-white sparkle-hover">
                            <img src={video.thumbnail} className="w-full h-full object-cover" alt={video.title} />
                            <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Info size={24} className="text-white" />
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-10">
                          <div className="flex flex-col gap-2 max-w-md">
                            <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-snug">{video.title}</h3>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full">{video.channelTitle}</span>
                               <span className="text-[10px] font-bold text-slate-400">{formatDate(video.publishedAt)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-10">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-600"><Eye size={14} className="text-slate-300"/> {formatNumber(video.viewCount)}</div>
                            <div className="flex items-center gap-2 text-sm font-black text-slate-600"><Users size={14} className="text-slate-300"/> {formatNumber(video.subscriberCount)}</div>
                          </div>
                        </td>
                        <td className="px-10 py-10 bg-rose-500/5">
                           <div className={`inline-flex flex-col items-center px-6 py-3 rounded-2xl ${video.ratio > 100 ? 'bg-rose-500 text-white' : 'bg-white border-2 border-rose-100 text-rose-600'}`}>
                             <span className="text-2xl font-[1000]">{video.ratio.toFixed(1)}%</span>
                           </div>
                        </td>
                        <td className="px-10 py-10 text-center">
                          <button 
                            onClick={() => handleToggleVideoFavorite(video)} 
                            className={`p-4 rounded-full transition-all active:scale-75 ${favoriteVideos.some(v => v.id === video.id) ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-rose-400'}`}
                          >
                            <Star size={24} className={favoriteVideos.some(v => v.id === video.id) ? "fill-white" : ""} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {displayData.map((video, index) => (
                <div key={video.id} className="group bg-white rounded-[3.5rem] cute-shadow border border-rose-50 overflow-hidden flex flex-col sparkle-hover transition-all duration-500">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      onClick={() => setSelectedVideo(video)} 
                      src={video.thumbnail} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer" 
                      alt={video.title}
                    />
                    <button 
                      onClick={() => handleToggleVideoFavorite(video)}
                      className="absolute top-5 right-5 z-10 p-3.5 rounded-full backdrop-blur-md bg-white/80 text-rose-500 shadow-xl active:scale-90 transition-all"
                    >
                      <Star size={22} className={favoriteVideos.some(v => v.id === video.id) ? "fill-rose-500" : ""} />
                    </button>
                    <div className="absolute top-5 left-5 flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-500 text-white font-[1000] text-xl shadow-xl">{index + 1}</div>
                    <div className="absolute bottom-5 right-5 bg-black/70 text-white text-[10px] font-black px-4 py-1.5 rounded-full backdrop-blur-sm">{formatDuration(video.durationSeconds)}</div>
                  </div>
                  
                  <div className="p-10 flex flex-col flex-1">
                    <h3 className="text-xl font-[900] text-slate-800 leading-tight line-clamp-2 h-14 mb-5 group-hover:text-rose-500 transition-colors">{video.title}</h3>
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-8 uppercase tracking-widest">{video.channelTitle}</div>
                    
                    <div className="mt-auto grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-rose-50/50 flex flex-col items-center col-span-2 border border-rose-100 relative overflow-hidden group/ratio">
                        <TrendingUp className="absolute -right-4 -bottom-4 text-rose-100/50 scale-150 group-hover/ratio:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 relative z-10">Viral Index</span>
                        <span className={`text-4xl font-[1000] relative z-10 ${video.ratio > 100 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {video.ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col items-center pt-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Views</span>
                        <span className="text-sm font-black text-slate-600">{formatNumber(video.viewCount)}</span>
                      </div>
                      <div className="flex flex-col items-center pt-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Subs</span>
                        <span className="text-sm font-black text-slate-600">{formatNumber(video.subscriberCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={() => setSelectedVideo(null)} />
          <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 border border-white/20">
            <button onClick={() => setSelectedVideo(null)} className="absolute top-8 right-8 z-10 bg-white/80 hover:bg-rose-500 hover:text-white p-5 rounded-full transition-all shadow-xl active:scale-90 text-slate-400"><X size={32} /></button>
            
            <div className="w-full md:w-2/5 h-[350px] md:h-auto relative overflow-hidden bg-slate-100">
              <img src={selectedVideo.thumbnail} className="w-full h-full object-cover blur-2xl opacity-40 absolute inset-0 scale-150" />
              <div className="relative z-10 p-12 h-full flex flex-col justify-center gap-10">
                <div className="rounded-[3rem] shadow-2xl border-4 border-white aspect-video overflow-hidden">
                   <img src={selectedVideo.thumbnail} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl font-[1000] text-slate-800 leading-tight">{selectedVideo.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"><Layers size={16} /> {selectedVideo.categoryName}</span>
                    <span className="px-6 py-2.5 bg-white shadow-md border border-rose-100 rounded-full text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"><Globe size={16} /> {selectedVideo.country}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-10 md:p-16 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <div className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Channel Overview</div>
                  <div className="text-3xl font-[1000] text-slate-800">{selectedVideo.channelTitle}</div>
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">채널 개설</span><span className="text-slate-800 font-black">{formatDate(selectedVideo.channelPublishedAt)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">영상 수</span><span className="text-slate-800 font-black">{selectedVideo.channelVideoCount}개</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">총 조회수</span><span className="text-slate-800 font-black">{formatNumber(selectedVideo.channelViewCount)}</span></div>
                  </div>
                </div>
                <div className="bg-rose-50 p-10 rounded-[2.5rem] border border-rose-100 space-y-6">
                  <div className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Viral Analytics</div>
                  {(() => {
                    const channelCreated = new Date(selectedVideo.channelPublishedAt);
                    const videoPublished = new Date(selectedVideo.publishedAt);
                    const now = new Date();
                    const channelDays = Math.max(1, (now.getTime() - channelCreated.getTime()) / (1000 * 3600 * 24));
                    const videoDays = Math.max(1, (now.getTime() - videoPublished.getTime()) / (1000 * 3600 * 24));
                    const dailyViews = (selectedVideo.viewCount / videoDays).toFixed(0);
                    const avgUploadFreq = (selectedVideo.channelVideoCount / (channelDays / 30)).toFixed(1);
                    return (
                      <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-rose-400">월평균 업로드 빈도</span>
                          <span className="text-4xl font-[1000] text-rose-600">{avgUploadFreq}개 <span className="text-lg text-rose-300">/ Month</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-rose-400">영상 일일 평균 조회수</span>
                          <span className="text-4xl font-[1000] text-rose-600">+{formatNumber(Number(dailyViews))} <span className="text-lg text-rose-300">/ Day</span></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                  { i: Eye, l: 'Views', v: formatNumber(selectedVideo.viewCount) },
                  { i: ThumbsUp, l: 'Likes', v: formatNumber(selectedVideo.likeCount) },
                  { i: Users, l: 'Subscribers', v: formatNumber(selectedVideo.subscriberCount) },
                  { i: TrendingUp, l: 'Viral Index', v: `${selectedVideo.ratio.toFixed(1)}%` },
                ].map((s, i) => (
                  <div key={i} className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm">
                    <s.i size={24} className="text-rose-400" />
                    <div className="text-lg font-black text-slate-800">{s.v}</div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] text-base leading-relaxed text-slate-600 whitespace-pre-wrap border border-slate-100 mb-10">
                {selectedVideo.description || '영상 설명이 없습니다.'}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                 <div className="text-xs font-bold text-slate-300">게시일: {formatDate(selectedVideo.publishedAt)}</div>
                 <a 
                   href={`https://www.youtube.com/watch?v=${selectedVideo.id}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-rose-500 transition-all shadow-2xl active:scale-95 group"
                 >
                   <Youtube size={24} className="group-hover:rotate-12 transition-transform" /> Youtube에서 영상 보기
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 bg-rose-500 text-white rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
          <AlertCircle size={32} />
          <p className="font-black text-lg">{error}</p>
          <button onClick={() => setError(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-32 border-t border-rose-100 py-24 bg-white/50 text-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex justify-center gap-8 mb-12">
            <Heart className="text-rose-400 animate-pulse fill-rose-400" size={48} />
            <Sparkles className="text-amber-400 animate-bounce" size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">YouTube Sparkle ✨</h2>
          <p className="text-slate-400 font-bold mb-8">데이터로 발견하는 떡상의 기회, 당신의 크리에이티브를 응원합니다.</p>
          <p className="text-xs font-bold text-rose-300 tracking-[0.3em] uppercase">© 2024 YouTube Sparkle. All Rights Reserved.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-300 via-amber-300 to-rose-300"></div>
      </footer>
    </div>
  );
};

export default App;
