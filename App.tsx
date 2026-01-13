
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
  List
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  DetailedInfo, 
  SearchFilters, 
  SortField, 
  SortOrder, 
  VideoLengthFilter, 
  DateFilter 
} from './types';
import { fetchYoutubeData } from './youtubeService';
import { formatNumber, formatDate, formatDuration } from './utils';

const App: React.FC = () => {
  // --- States ---
  const [apiKey, setApiKey] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    length: 'all',
    date: 'all',
    maxResults: 20
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DetailedInfo[]>([]);
  const [sortField, setSortField] = useState<SortField>('ratio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVideo, setSelectedVideo] = useState<DetailedInfo | null>(null);

  // --- Handlers ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('어머! YouTube API 키를 입력해주셔야 분석을 시작할 수 있어요! ✨');
      return;
    }
    if (!filters.keyword.trim()) {
      setError('어떤 보물을 찾으시나요? 검색어를 입력해주세요! 🔍');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchYoutubeData(apiKey, filters);
      setResults(data);
    } catch (err: any) {
      if (err.message?.includes('quota')) {
        setError('오늘 준비한 마법 가루(API 할당량)를 다 썼어요! 내일 다시 만나요! 😢');
      } else {
        setError(err.message || '앗, 통신에 살짝 문제가 생겼어요. 다시 해볼까요?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;

    const dataToExport = sortedResults.map((v, index) => ({
      '순위': index + 1,
      '제목': v.title,
      '채널명': v.channelTitle,
      '조회수': v.viewCount,
      '좋아요': v.likeCount,
      '구독자수': v.subscriberCount,
      '떡상 지수(%)': v.ratio.toFixed(2),
      '영상 길이': formatDuration(v.durationSeconds),
      '업로드 날짜': formatDate(v.publishedAt),
      '유튜브 링크': `https://www.youtube.com/watch?v=${v.id}`
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "떡상 분석 리포트");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `YouTubeSparkle_분석_${filters.keyword}_${dateStr}.xlsx`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'publishedAt') {
        valA = new Date(a.publishedAt).getTime();
        valB = new Date(b.publishedAt).getTime();
      }

      if (sortOrder === 'asc') return Number(valA) - Number(valB);
      return Number(valB) - Number(valA);
    });
  }, [results, sortField, sortOrder]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4 opacity-20"><ChevronDown size={18} /></div>;
    return sortOrder === 'asc' ? <ChevronUp size={18} className="text-rose-500" /> : <ChevronDown size={18} className="text-rose-500" />;
  };

  const getInsights = (video: DetailedInfo) => {
    const channelCreated = new Date(video.channelPublishedAt);
    const videoPublished = new Date(video.publishedAt);
    const now = new Date();
    
    const channelDays = Math.max(1, (now.getTime() - channelCreated.getTime()) / (1000 * 3600 * 24));
    const videoDays = Math.max(1, (now.getTime() - videoPublished.getTime()) / (1000 * 3600 * 24));

    return {
      avgUploadFreq: (video.channelVideoCount / (channelDays / 30)).toFixed(1),
      dailyViews: (video.viewCount / videoDays).toFixed(0),
      annualGrowth: ((video.subscriberCount / (channelDays / 365))).toFixed(0),
    };
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
                <span className="text-sm font-bold text-rose-400/80 mt-[-2px]">나만 알고 싶은 떡상 탐지기</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-rose-300" />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Secret API Key ✨"
                  className="block w-72 pl-12 pr-6 py-3 bg-white border-2 border-rose-50 rounded-full text-base font-medium focus:outline-none focus:ring-4 focus:ring-rose-100 transition-all placeholder:text-rose-200 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Search & Filter Section */}
        <section className="bg-white p-10 rounded-[3rem] cute-shadow border border-rose-50 mb-12 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
            <Heart size={300} fill="currentColor" className="text-rose-500" />
          </div>
          
          <form onSubmit={handleSearch} className="space-y-10 relative z-10">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="무엇이 떡상 중일까요? 검색어를 넣어주세요! 🎀"
                  className="w-full pl-8 pr-16 py-6 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] focus:border-rose-300 focus:bg-white focus:outline-none transition-all text-2xl font-bold shadow-inner placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-rose-500 text-white rounded-[1.5rem] hover:bg-rose-600 hover:scale-105 active:scale-95 disabled:bg-slate-200 transition-all shadow-xl shadow-rose-200"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={32} /> : <Search size={32} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={results.length === 0 || isLoading}
                className="flex items-center justify-center gap-3 px-10 py-6 bg-amber-400 text-white font-[900] text-xl rounded-[2rem] hover:bg-amber-500 hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-xl shadow-amber-100 shrink-0"
              >
                <Download size={28} />
                엑셀 리포트
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="px-2 text-base font-black text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                  <Clock size={20} /> 영상 길이
                </label>
                <select 
                  value={filters.length}
                  onChange={(e) => setFilters(prev => ({ ...prev, length: e.target.value as VideoLengthFilter }))}
                  className="w-full p-5 border-2 border-rose-50 rounded-2xl bg-rose-50/20 text-lg font-bold text-slate-600 focus:ring-4 focus:ring-rose-50 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
                >
                  <option value="all">모든 길이 다 좋아!</option>
                  <option value="short">짧고 굵은 숏폼 ⚡</option>
                  <option value="long">여유로운 롱폼 📺</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="px-2 text-base font-black text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                  <Calendar size={20} /> 업로드 날짜
                </label>
                <select 
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value as DateFilter }))}
                  className="w-full p-5 border-2 border-rose-50 rounded-2xl bg-rose-50/20 text-lg font-bold text-slate-600 focus:ring-4 focus:ring-rose-50 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
                >
                  <option value="all">언제 올라왔든!</option>
                  <option value="today">오늘의 따끈한 소식</option>
                  <option value="week">이번 주 핫한 영상</option>
                  <option value="month">이번 달의 베스트</option>
                  <option value="year">올해의 레전드</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="px-2 text-base font-black text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                  <Rocket size={20} /> 검색 개수
                </label>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  value={filters.maxResults}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 10 }))}
                  className="w-full p-5 border-2 border-rose-50 rounded-2xl bg-rose-50/20 text-lg font-bold text-slate-600 focus:ring-4 focus:ring-rose-50 outline-none hover:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center justify-center bg-rose-50/50 rounded-2xl p-6 border-2 border-rose-100 border-dashed">
                <p className="text-sm font-bold text-rose-400 text-center leading-relaxed">
                  TIP: 떡상 지수가 높을수록<br/>구독자 대비 반응이 뜨거운 영상이에요! 🔥
                </p>
              </div>
            </div>
          </form>
        </section>

        {/* View Mode Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 px-8 gap-6">
          <div className="flex items-center bg-rose-100/50 p-2 rounded-[1.5rem] border border-rose-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-3 px-8 py-3 rounded-[1.25rem] font-black transition-all ${viewMode === 'grid' ? 'bg-rose-500 text-white shadow-lg' : 'text-rose-400 hover:bg-rose-100'}`}
            >
              <LayoutGrid size={20} /> 카드형
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-3 px-8 py-3 rounded-[1.25rem] font-black transition-all ${viewMode === 'table' ? 'bg-rose-500 text-white shadow-lg' : 'text-rose-400 hover:bg-rose-100'}`}
            >
              <List size={20} /> 테이블형
            </button>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-slate-400 font-bold text-sm">정렬 기준:</span>
            <div className="flex gap-2">
              {[
                { label: '떡상지수', field: 'ratio' as SortField },
                { label: '조회수', field: 'viewCount' as SortField },
                { label: '구독자', field: 'subscriberCount' as SortField },
              ].map((item) => (
                <button
                  key={item.field}
                  onClick={() => toggleSort(item.field)}
                  className={`px-5 py-2 rounded-full text-xs font-black border transition-all ${sortField === item.field ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="relative min-h-[600px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[4rem] z-10 border border-white">
              <div className="relative mb-10">
                <div className="w-32 h-32 border-[10px] border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" size={48} />
              </div>
              <p className="text-3xl font-[900] text-rose-500 animate-pulse tracking-tight text-center px-4">마법 분석 중... ✨</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-rose-100 cute-shadow">
              <Trophy className="text-rose-200 mb-6" size={80} />
              <p className="text-slate-600 font-black text-2xl">분석할 보물을 찾아주세요!</p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="bg-white rounded-[4rem] cute-shadow border border-rose-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-rose-50/40 text-rose-500 font-black text-sm uppercase tracking-[0.2em] whitespace-nowrap">
                      <th className="px-8 py-10 w-24 text-center">Rank</th>
                      <th className="px-8 py-10 w-80">Preview</th>
                      <th className="px-8 py-10 min-w-[450px]">Video & Channel</th>
                      <th className="px-8 py-10 cursor-pointer" onClick={() => toggleSort('viewCount')}>
                        <div className="flex items-center gap-2">조회수 <SortIcon field="viewCount" /></div>
                      </th>
                      <th className="px-8 py-10 cursor-pointer bg-rose-500/5" onClick={() => toggleSort('ratio')}>
                        <div className="flex items-center gap-2 text-rose-600">떡상 지수 <SortIcon field="ratio" /></div>
                      </th>
                      <th className="px-8 py-10 cursor-pointer" onClick={() => toggleSort('subscriberCount')}>
                        <div className="flex items-center gap-2">구독자 <SortIcon field="subscriberCount" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {sortedResults.map((video, index) => (
                      <tr key={video.id} className="hover:bg-rose-50/20 transition-all group">
                        <td className="px-8 py-10 text-center font-black">{index + 1}</td>
                        <td className="px-8 py-10">
                          <div onClick={() => setSelectedVideo(video)} className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] shadow-xl w-64 aspect-video border-4 border-white">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                              <MousePointer2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={48} />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className="flex flex-col gap-4 max-w-[500px]">
                            <h3 className="text-xl font-black text-slate-800 leading-snug">{video.title}</h3>
                            <span className="text-sm font-bold px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100 w-fit">{video.channelTitle}</span>
                          </div>
                        </td>
                        <td className="px-8 py-10 font-black text-slate-700">{formatNumber(video.viewCount)}</td>
                        <td className="px-8 py-10 bg-rose-500/5">
                          <div className={`inline-flex flex-col items-center min-w-[120px] px-8 py-4 rounded-[2rem] ${video.ratio > 100 ? 'bg-rose-500 text-white' : 'bg-white text-rose-600 border-2 border-rose-100'}`}>
                            <span className="text-3xl font-black">{video.ratio.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-10 font-black text-slate-600">{formatNumber(video.subscriberCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View (Card Mode) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {sortedResults.map((video, index) => (
                <div key={video.id} className="group bg-white rounded-[3.5rem] cute-shadow border border-rose-50 overflow-hidden flex flex-col hover:scale-[1.03] transition-all duration-500 sparkle-hover">
                  {/* Thumbnail Wrapper */}
                  <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(video)}>
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 rounded-[1.25rem] bg-rose-500 text-white font-black text-xl shadow-xl rotate-[-6deg] group-hover:rotate-0 transition-all z-10">
                      {index + 1}
                    </div>
                    <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full z-10">
                      {formatDuration(video.durationSeconds)}
                    </div>
                    <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white p-4 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                        <Info size={32} className="text-rose-500" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-10 flex flex-col flex-1">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
                        <Rocket size={14} /> {video.channelTitle}
                      </div>
                      <h3 className="text-xl font-[900] text-slate-800 leading-tight line-clamp-2 h-14 group-hover:text-rose-500 transition-colors">
                        {video.title}
                      </h3>
                    </div>

                    {/* Ratio Badge */}
                    <div className="my-8 p-6 rounded-[2.5rem] bg-rose-50/50 border-2 border-rose-50 flex flex-col items-center justify-center relative overflow-hidden group/ratio">
                      <TrendingUp size={60} className="absolute -right-4 -bottom-4 text-rose-100/50 group-hover/ratio:scale-125 transition-transform" />
                      <span className="text-xs font-black text-rose-400 uppercase tracking-tighter mb-1 relative z-10">Viral Index</span>
                      <span className={`text-4xl font-[1000] relative z-10 ${video.ratio > 100 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {video.ratio.toFixed(1)}%
                      </span>
                    </div>

                    {/* Stats Footer */}
                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Views</span>
                        <div className="flex items-center gap-1.5 text-sm font-black text-slate-600">
                          <Eye size={14} /> {formatNumber(video.viewCount)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Subs</span>
                        <div className="flex items-center gap-1.5 text-sm font-black text-slate-600 justify-end">
                          <Users size={14} /> {formatNumber(video.subscriberCount)}
                        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedVideo(null)} />
          <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-rose-100 animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedVideo(null)} className="absolute top-6 right-6 z-10 bg-slate-100 hover:bg-rose-500 hover:text-white p-4 rounded-full transition-all shadow-lg active:scale-90"><X size={28} /></button>
            <div className="w-full md:w-2/5 h-[300px] md:h-auto relative overflow-hidden bg-slate-100">
              <img src={selectedVideo.thumbnail} className="w-full h-full object-cover blur-sm opacity-30 absolute inset-0 scale-125" />
              <div className="relative z-10 p-10 h-full flex flex-col justify-center gap-8">
                <div className="rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden aspect-video group">
                   <img src={selectedVideo.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-[900] text-slate-800 leading-tight">{selectedVideo.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-black flex items-center gap-2"><Layers size={16} /> {selectedVideo.categoryName}</span>
                    <span className="px-4 py-2 bg-white/80 backdrop-blur shadow-sm border border-rose-100 rounded-full text-sm font-black text-rose-500 flex items-center gap-2"><Globe size={16} /> {selectedVideo.country}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-widest text-xs mb-2"><Rocket size={16} /> Channel Info</div>
                  <div className="text-2xl font-black text-slate-800">{selectedVideo.channelTitle}</div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">채널 개설일</span><span className="text-slate-700 font-black">{formatDate(selectedVideo.channelPublishedAt)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">총 조회수</span><span className="text-slate-700 font-black">{formatNumber(selectedVideo.channelViewCount)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">영상 개수</span><span className="text-slate-700 font-black">{selectedVideo.channelVideoCount}개</span></div>
                  </div>
                </div>
                <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-widest text-xs mb-2"><BarChart3 size={16} /> Data Insights</div>
                  {(() => {
                    const insights = getInsights(selectedVideo);
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col"><span className="text-xs font-bold text-rose-400 mb-1">월평균 업로드 빈도</span><span className="text-2xl font-black text-rose-600">{insights.avgUploadFreq}개 / Month</span></div>
                        <div className="flex flex-col"><span className="text-xs font-bold text-rose-400 mb-1">영상 일평균 조회수</span><span className="text-2xl font-black text-rose-600">+{insights.dailyViews} views / Day</span></div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                  { icon: Eye, label: '조회수', val: formatNumber(selectedVideo.viewCount), color: 'rose' },
                  { icon: ThumbsUp, label: '좋아요', val: formatNumber(selectedVideo.likeCount), color: 'amber' },
                  { icon: Users, label: '구독자', val: formatNumber(selectedVideo.subscriberCount), color: 'indigo' },
                  { icon: TrendingUp, label: '떡상지수', val: `${selectedVideo.ratio.toFixed(1)}%`, color: 'emerald' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border-2 border-slate-50 p-6 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm">
                    <stat.icon size={24} className={`text-${stat.color}-400`} />
                    <div className="text-lg font-black text-slate-800">{stat.val}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-400 font-black uppercase tracking-widest text-xs"><Info size={16} /> Video Description</div>
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative">
                   <p className="text-slate-600 leading-relaxed text-base break-words whitespace-pre-wrap">{selectedVideo.description || '영상 설명이 없습니다.'}</p>
                   <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between items-center">
                     <div className="text-xs font-bold text-slate-400">게시일: {formatDate(selectedVideo.publishedAt)}</div>
                     <a href={`https://www.youtube.com/watch?v=${selectedVideo.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-rose-500 transition-all shadow-xl active:scale-95"><Youtube size={20} /> Youtube에서 보기</a>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-32 border-t border-rose-100 py-20 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-10">
            <Heart className="text-rose-400 animate-pulse fill-rose-400" size={32} />
            <Sparkles className="text-amber-400 scale-125" size={32} />
          </div>
          <p className="text-slate-400 text-xl font-bold">© 2024 YouTube Sparkle ✨</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
