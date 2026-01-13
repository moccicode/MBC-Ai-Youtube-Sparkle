
import React, { useState, useMemo } from 'react';
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
  Heart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  VideoData, 
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VideoData[]>([]);
  const [sortField, setSortField] = useState<SortField>('ratio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  // --- Components ---
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4 opacity-20"><ChevronDown size={18} /></div>;
    return sortOrder === 'asc' ? <ChevronUp size={18} className="text-rose-500" /> : <ChevronDown size={18} className="text-rose-500" />;
  };

  return (
    <div className="min-h-screen pb-20">
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

        {/* Error Handling */}
        {error && (
          <div className="mb-12 p-8 bg-rose-100/40 border-2 border-rose-200 rounded-[2.5rem] flex items-center gap-6 text-rose-700 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-rose-50">
            <div className="bg-rose-500 p-3 rounded-full text-white shrink-0 shadow-md">
              <AlertCircle size={32} />
            </div>
            <p className="font-bold text-xl">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto bg-white/50 hover:bg-white p-3 rounded-2xl transition-all shadow-sm">
              <X size={28} />
            </button>
          </div>
        )}

        {/* Results Area */}
        <div className="relative min-h-[600px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[4rem] z-10 border border-white">
              <div className="relative mb-10">
                <div className="w-32 h-32 border-[10px] border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" size={48} />
              </div>
              <p className="text-3xl font-[900] text-rose-500 animate-pulse tracking-tight text-center px-4">
                마법 지팡이로 분석 중이에요... ✨<br/>
                <span className="text-xl font-bold text-slate-400 block mt-4">데이터를 정성스럽게 모으는 중!</span>
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-rose-100 cute-shadow">
              <div className="bg-rose-50 p-12 rounded-full mb-10 rotate-12 hover:rotate-0 transition-all shadow-inner">
                <Trophy className="text-rose-300" size={80} />
              </div>
              <p className="text-slate-600 font-black text-3xl">아직 분석 결과가 없어요!</p>
              <p className="text-slate-400 font-bold mt-4 text-xl">어서 검색창에 마법을 걸어보세요! 🍭</p>
            </div>
          ) : (
            <div className="bg-white rounded-[4rem] cute-shadow border border-rose-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-rose-50/40 text-rose-500 font-black text-sm uppercase tracking-[0.2em] whitespace-nowrap">
                      <th className="px-8 py-10 w-24 text-center">Rank</th>
                      <th className="px-8 py-10 w-80">Preview</th>
                      <th className="px-8 py-10 min-w-[450px]">Video & Channel</th>
                      <th 
                        className="px-8 py-10 cursor-pointer hover:bg-rose-100/30 transition-colors"
                        onClick={() => toggleSort('viewCount')}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Eye size={20} /> 조회수
                          <SortIcon field="viewCount" />
                        </div>
                      </th>
                      <th 
                        className="px-8 py-10 cursor-pointer hover:bg-rose-100/30 transition-colors bg-rose-500/5"
                        onClick={() => toggleSort('ratio')}
                      >
                        <div className="flex items-center gap-2 text-rose-600 whitespace-nowrap">
                          <TrendingUp size={24} /> 떡상 지수
                          <SortIcon field="ratio" />
                        </div>
                      </th>
                      <th 
                        className="px-8 py-10 cursor-pointer hover:bg-rose-100/30 transition-colors"
                        onClick={() => toggleSort('subscriberCount')}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Users size={20} /> 구독자수
                          <SortIcon field="subscriberCount" />
                        </div>
                      </th>
                      <th 
                        className="px-8 py-10 cursor-pointer hover:bg-rose-100/30 transition-colors"
                        onClick={() => toggleSort('publishedAt')}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar size={20} /> 업로드 날짜
                          <SortIcon field="publishedAt" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {sortedResults.map((video, index) => (
                      <tr key={video.id} className="hover:bg-rose-50/20 transition-all group sparkle-hover">
                        <td className="px-8 py-10 text-center">
                          <div className={`w-14 h-14 rounded-[1.25rem] mx-auto flex items-center justify-center text-2xl font-[900] text-white shadow-xl rotate-[-4deg] group-hover:rotate-0 transition-all ${index < 3 ? 'rank-badge' : 'bg-slate-300'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-xl w-64 aspect-video border-4 border-white shrink-0">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                            />
                            {index === 0 && (
                              <div className="absolute top-3 left-3 bg-amber-400 text-white p-2 rounded-[1rem] shadow-xl animate-bounce">
                                <Trophy size={20} fill="currentColor" />
                              </div>
                            )}
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-black backdrop-blur-sm">
                              {formatDuration(video.durationSeconds)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className="flex flex-col gap-5 max-w-[500px]">
                            <a 
                              href={`https://www.youtube.com/watch?v=${video.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xl font-[900] text-slate-800 hover:text-rose-500 transition-colors leading-[1.6] block group/link whitespace-normal break-normal overflow-visible"
                              style={{ wordBreak: 'keep-all' }}
                            >
                              {video.title}
                              <ExternalLink size={20} className="opacity-0 group-hover/link:opacity-100 shrink-0 text-rose-300 mt-1 inline-block align-middle ml-2" />
                            </a>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold px-5 py-2 bg-rose-50 text-rose-500 rounded-full border border-rose-100 shadow-sm flex items-center gap-2 w-fit">
                                <Rocket size={14} /> {video.channelTitle}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10">
                          <div className="flex flex-col gap-2 min-w-[160px] whitespace-nowrap">
                            <div className="flex items-center gap-2 text-2xl font-black text-slate-700">
                                <Eye size={22} className="text-slate-400" /> {formatNumber(video.viewCount)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-tight pl-1">
                              <ThumbsUp size={16} className="text-rose-300" /> {formatNumber(video.likeCount)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10 bg-rose-500/5">
                          <div className={`inline-flex flex-col items-center min-w-[150px] px-10 py-6 rounded-[2.5rem] ${video.ratio > 100 ? 'bg-rose-500 text-white shadow-2xl shadow-rose-200' : 'bg-white text-rose-600 border-2 border-rose-100'} transition-all transform group-hover:scale-110`}>
                            <span className="text-4xl font-black leading-none whitespace-nowrap">{video.ratio.toFixed(1)}%</span>
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <TrendingUp size={14} className={video.ratio > 100 ? 'text-rose-100' : 'text-rose-400'} />
                              <span className={`text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${video.ratio > 100 ? 'opacity-90' : 'opacity-70'}`}>떡상 지수</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-10 min-w-[160px]">
                          <div className="flex flex-col gap-1.5 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-2xl font-black text-slate-600">
                                <Users size={24} className="text-rose-300" /> {formatNumber(video.subscriberCount)}
                            </div>
                            <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] pl-8">구독자수</span>
                          </div>
                        </td>
                        <td className="px-8 py-10 whitespace-nowrap min-w-[200px]">
                          <div className="flex flex-col gap-1.5 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-xl font-bold text-slate-500">
                                <Calendar size={24} className="text-slate-300" /> {formatDate(video.publishedAt)}
                            </div>
                            <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] pl-8">업로드일</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-32 border-t border-rose-100 py-20 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-10">
            <Heart className="text-rose-400 animate-pulse fill-rose-400" size={32} />
            <Sparkles className="text-amber-400 scale-125" size={32} />
            <Heart className="text-rose-400 animate-pulse fill-rose-400 delay-150" size={32} />
          </div>
          <p className="text-slate-400 text-xl font-bold">
            © 2024 YouTube Sparkle ✨ <span className="text-rose-300">데이터에 감성을 더하다</span>
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-10">
            <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-[1.5rem] border border-rose-100 shadow-xl text-base font-black text-rose-500">
              <TrendingUp size={24} />
              <span>떡상 지수 = (조회수 / 구독자수) × 100</span>
            </div>
            <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-[1.5rem] border border-rose-100 shadow-xl text-base font-black text-slate-400">
              <Rocket size={24} />
              <span>Powered by YouTube Data API v3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
