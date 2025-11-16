import { useState, useCallback, useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const API_BASE_URL = 'https://newsdata.io/api/1/news';

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
}

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string | null;
  content: string | null;
  pubDate: string;
  source_id: string;
  creator: string[] | null;
  category: string[];
  image_url: string | null;
  link: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl?: string;
  content: string;
  link: string;
}

const categories = [
  'All', 'business', 'technology', 'sports', 'entertainment', 
  'politics', 'world', 'science', 'health', 'top', 'WANTED'
];

const categoryMap: { [key: string]: string } = {
  'All': '',
  'business': 'business',
  'technology': 'technology',
  'sports': 'sports',
  'entertainment': 'entertainment',
  'politics': 'politics',
  'world': 'world',
  'science': 'science',
  'health': 'health',
  'top': 'top'
};

function calculateReadTime(content: string): string {
  if (!content) return '1 min read';
  const words = content.split(' ').length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function transformNewsDataArticle(article: NewsDataArticle): Article {
  return {
    id: article.article_id,
    title: article.title,
    excerpt: article.description || article.title,
    author: article.creator?.[0] || article.source_id || 'NewsWale Staff',
    date: formatDate(article.pubDate),
    readTime: calculateReadTime(article.content || article.description || ''),
    category: article.category?.[0] || 'General',
    imageUrl: article.image_url || undefined,
    content: article.content || article.description || 'Content not available. Visit the source link for full article.',
    link: article.link
  };
}

async function fetchNews(category: string = ''): Promise<Article[]> {
  try {
    const params = new URLSearchParams({
      apikey: API_KEY,
      language: 'en',
      size: '10'
    });

    if (category && category !== 'All' && categoryMap[category]) {
      params.append('category', categoryMap[category]);
    }

    const url = `${API_BASE_URL}?${params.toString()}`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const data: NewsDataResponse = await response.json();
    console.log('API Response:', data);
    
    if (data.status !== 'success') {
      throw new Error(`API returned error status: ${data.status}`);
    }

    if (!data.results || data.results.length === 0) {
      console.warn('No articles found in API response');
      return getFallbackArticles();
    }
    
    return data.results.map(transformNewsDataArticle);
  } catch (error) {
    console.error('Error fetching news:', error);
    return getFallbackArticles();
  }
}

function getFallbackArticles(): Article[] {
  return [
    {
      id: 'fallback-1',
      title: 'Breaking: NewsData.io API Temporarily Unavailable',
      excerpt: 'The news service is experiencing technical difficulties. Please check back shortly for live news updates.',
      author: 'NewsWale Technical Team',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      readTime: '1 min read',
      category: 'Technology',
      content: 'We are currently experiencing issues connecting to our news data provider. Our technical team is working to resolve this issue as quickly as possible. Thank you for your patience.',
      link: '#'
    },
    {
      id: 'fallback-2',
      title: 'NewsWale: Your Retro News Experience',
      excerpt: 'Experience the golden age of digital journalism with our authentic 90s-styled news platform.',
      author: 'NewsWale Editorial',
      date: '1995-11-16',
      readTime: '2 min read',
      category: 'About',
      content: 'Welcome to NewsWale, where cutting-edge news meets nostalgic design. Our platform brings you the latest stories with that classic 90s digital newspaper aesthetic.',
      link: '#'
    }
  ];
}

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('newswale_bookmarks');
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    }
  }, []);

  const toggleBookmark = useCallback((articleId: string) => {
    setBookmarks(prev => {
      const newBookmarks = prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId];
      
      localStorage.setItem('newswale_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  return { bookmarks, toggleBookmark };
}

function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive, containerRef]);
}

const NewsWale: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const { bookmarks, toggleBookmark } = useBookmarks();
  const modalRef = useRef<HTMLDivElement>(null);
  const wantedRef = useRef<HTMLDivElement>(null);

  // Enable focus trap when modal is open
  useFocusTrap(!!selectedArticle, modalRef);

  // Fetch news when component mounts or category changes
  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      setCurrentFeaturedIndex(0); // Reset featured index when category changes
      try {
        const newsData = await fetchNews(selectedCategory);
        setArticles(newsData);
        
        // Check if we got fallback articles
        if (newsData.length > 0 && newsData[0].id.includes('fallback')) {
          setError('Using demo content - API temporarily unavailable');
        }
      } catch (err) {
        console.error('News loading error:', err);
        setError('Failed to load news. Showing demo content.');
        setArticles(getFallbackArticles());
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [selectedCategory]);

  // Auto-slide featured articles every 8 seconds
  useEffect(() => {
    if (articles.length <= 3) return; // Only slide if we have more than 3 articles

    const slideInterval = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setCurrentFeaturedIndex(prev => {
          const maxIndex = Math.min(articles.length - 1, 2); // Show max 3 featured articles
          return prev >= maxIndex ? 0 : prev + 1;
        });
        setIsSliding(false);
      }, 300);
    }, 8000);

    return () => clearInterval(slideInterval);
  }, [articles.length]);

  // Get featured articles (up to 3)
  const featuredArticles = articles.slice(0, 3);
  const currentFeaturedArticle = featuredArticles[currentFeaturedIndex];
  const remainingArticles = articles.slice(3);

  const closeModal = useCallback(() => setSelectedArticle(null), []);

  // Scroll to wanted section
  const scrollToWanted = useCallback(() => {
    if (wantedRef.current) {
      wantedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (selectedArticle) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedArticle, closeModal]);

  return (
    <div className="min-h-screen bg-retro-bg font-london">
      {/* Header with enhanced 90s styling */}
      <header className="bg-white text-black p-4 md:p-6 relative overflow-hidden border-b-4 border-black">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-4">
            <h1 className="nw-london-title text-3xl md:text-4xl lg:text-6xl font-bold mb-2 text-black">
              📰 THE NEWSWALE 📰
            </h1>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm md:text-lg font-mono">
              <span className="nw-retro-badge px-2 py-1 text-xs md:text-sm">EST. 2024</span>
              <span className="hidden sm:inline">•</span>
              <span className="italic text-sm md:text-base">"AKP Own News Portal"</span>
              <span className="hidden sm:inline">•</span>
              <span className="nw-dateline text-xs md:text-sm">CHHATTISGARH EDITION</span>
            </div>
          </div>
          
          {/* Decorative border pattern */}
          <div className="border-t-2 border-b-2 md:border-t-4 md:border-b-4 border-yellow-300 py-2 mt-4">
            <div className="text-center font-impact text-xs md:text-sm tracking-widest">
              ★ LIVE NEWS DATA POWERED BY NEWSDATA.IO ★
            </div>
          </div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="nw-retro-gradient h-full"></div>
        </div>
      </header>

      {/* Enhanced Breaking News Ticker */}
      <div className="nw-marquee py-2 md:py-3 text-sm md:text-xl font-impact">
        <div className="nw-marquee-inner">
          {loading ? (
            '📡 CONNECTING... 📡 NEWSDATA.IO ACTIVE... 📡 LOADING... '
          ) : error ? (
            '⚠️ NEWS FEED OFFLINE... ⚠️ RECONNECTING... ⚠️ STANDBY... '
          ) : (
            `🔥 LIVE: ${articles.length} STORIES 🔥 REAL-TIME NEWS 🔥 ${selectedCategory.toUpperCase()} ACTIVE 🔥 FROM RAIPUR 🔥`
          )}
        </div>
      </div>

      {/* Enhanced Category Navigation */}
      <nav className="bg-gradient-to-r from-retro-gray to-gray-300 border-b-4 border-london-navy p-2 md:p-4 shadow-retro">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  if (category === 'WANTED') {
                    scrollToWanted();
                  } else {
                    setSelectedCategory(category);
                  }
                }}
                className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-bold ${
                  category === 'WANTED' 
                    ? 'font-impact tracking-widest uppercase transform hover:scale-110 transition-all duration-300 animate-pulse'
                    : selectedCategory === category ? 'nw-category-tab active' : 'nw-category-tab'
                }`}
                style={category === 'WANTED' ? {
                  backgroundColor: '#dc2626 !important',
                  color: 'white !important',
                  border: '4px solid #991b1b',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4), 0 0 20px rgba(220,38,38,0.5)'
                } : {}}
                disabled={loading && category !== 'WANTED'}
              >
                {category === 'WANTED' ? 'WANTED' : (category.length > 8 ? category.substring(0, 8) + '...' : category.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content with enhanced layout */}
      <main className="container mx-auto p-3 md:p-6">
        <div className="nw-paper-texture min-h-screen p-4 md:p-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="nw-90s-border p-8 bg-white inline-block">
                <h2 className="nw-london-heading text-2xl mb-4 text-london-navy">📡 LOADING LIVE NEWS...</h2>
                <div className="font-mono text-sm">Connecting to NewsData.io API...</div>
                <div className="mt-4">
                  <div className="w-64 h-4 bg-gray-300 nw-90s-border mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-retro-blue to-retro-teal animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="nw-90s-border p-8 bg-red-50 inline-block border-red-500">
                <h2 className="nw-london-heading text-2xl mb-4 text-red-700">⚠️ NEWS FEED ERROR</h2>
                <p className="font-mono text-sm text-red-600 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="nw-90s-button px-6 py-3 bg-red-500 text-white border-red-700"
                >
                  RETRY CONNECTION
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Featured Article with Slide Animation */}
          {!loading && !error && currentFeaturedArticle && (
            <article className="nw-featured-article mb-3 md:mb-6 p-2 md:p-4 overflow-hidden">
              {/* Featured Article Navigation */}
              {featuredArticles.length > 1 && (
                <div className="flex justify-center mb-2 md:mb-3">
                  <div className="flex space-x-1">
                    {featuredArticles.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setIsSliding(true);
                          setTimeout(() => {
                            setCurrentFeaturedIndex(index);
                            setIsSliding(false);
                          }, 300);
                        }}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full border transition-all duration-300 ${
                          currentFeaturedIndex === index 
                            ? 'bg-london-red border-london-red' 
                            : 'bg-transparent border-gray-400 hover:border-london-red'
                        }`}
                        aria-label={`Show featured article ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Article Content with Animation */}
              <div className={`transition-all duration-500 transform ${
                isSliding ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
              }`}>
                <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
                  {/* Text Content */}
                  <div className="lg:col-span-1">
                    <div className="flex flex-wrap items-center mb-2 gap-1">
                      <span className="nw-retro-badge px-1 py-1 text-xs">
                        {currentFeaturedArticle.category.toUpperCase()}
                      </span>
                      <span className="nw-dateline text-xs text-gray-700">
                        {currentFeaturedArticle.date}
                      </span>
                      {featuredArticles.length > 1 && (
                        <span className="text-xs bg-yellow-400 px-1 py-1 rounded font-bold text-black">
                          {currentFeaturedIndex + 1}/{featuredArticles.length}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="nw-london-heading text-sm md:text-lg lg:text-xl font-bold mb-2 md:mb-3 leading-tight text-london-navy">
                      {currentFeaturedArticle.title}
                    </h2>
                    
                    <p className="text-xs md:text-sm mb-2 md:mb-3 leading-relaxed text-gray-700 font-serif line-clamp-2">
                      {currentFeaturedArticle.excerpt}
                    </p>
                    
                    <div className="border-t border-london-navy pt-2">
                      <div className="nw-byline text-xs mb-2">
                        By {currentFeaturedArticle.author.length > 20 ? currentFeaturedArticle.author.substring(0, 20) + '...' : currentFeaturedArticle.author} • {currentFeaturedArticle.readTime}
                      </div>
                      
                      {/* Horizontal Button Layout */}
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => toggleBookmark(currentFeaturedArticle.id)}
                          className="nw-90s-button px-2 py-1 text-xs font-bold bg-yellow-500 text-black border-yellow-700 hover:bg-yellow-400 transition-colors"
                          aria-label="Bookmark article"
                        >
                          {bookmarks.includes(currentFeaturedArticle.id) ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => setSelectedArticle(currentFeaturedArticle)}
                          className="nw-90s-button px-2 py-1 text-xs font-bold bg-gradient-to-r from-london-red to-red-600 text-white border-red-800 hover:from-red-600 hover:to-red-700 transition-all"
                        >
                          READ
                        </button>
                        <a
                          href={currentFeaturedArticle.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nw-90s-button px-2 py-1 text-xs bg-blue-500 text-white border-blue-700 hover:bg-blue-600 transition-colors font-bold"
                        >
                          SRC
                        </a>
                        {/* Next Article Button */}
                        {featuredArticles.length > 1 && (
                          <button
                            onClick={() => {
                              setIsSliding(true);
                              setTimeout(() => {
                                setCurrentFeaturedIndex(prev => {
                                  const maxIndex = featuredArticles.length - 1;
                                  return prev >= maxIndex ? 0 : prev + 1;
                                });
                                setIsSliding(false);
                              }, 300);
                            }}
                            className="nw-90s-button px-2 py-1 text-xs bg-green-500 text-white border-green-700 hover:bg-green-600 transition-colors font-bold"
                          >
                            ►
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured Image - Small Square Box */}
                  {currentFeaturedArticle.imageUrl && (
                    <div className="lg:col-span-1 order-first lg:order-last">
                      <div className="nw-90s-border p-1">
                        <img
                          src={currentFeaturedArticle.imageUrl}
                          alt={currentFeaturedArticle.title}
                          className="w-32 h-32 md:w-40 md:h-40 object-cover mx-auto"
                        />
                        <div className="bg-black text-white p-1 text-xs font-mono text-center">
                          LIVE • {currentFeaturedIndex + 1}/{featuredArticles.length}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )}

          {/* Enhanced Section Header */}
          {!loading && !error && (
            <section>
              <div className="text-center mb-3 md:mb-4">
                <h3 className="nw-london-heading text-base md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-london-navy to-retro-blue text-transparent bg-clip-text mb-1">
                  📋 {selectedCategory === 'All' ? 'LATEST NEWS' : selectedCategory.toUpperCase()} HEADLINES
                </h3>
                <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-retro-gold to-yellow-500 mx-auto"></div>
                <p className="font-mono text-xs mt-1 text-gray-600">{remainingArticles.length} More Articles</p>
              </div>
              
              {/* Enhanced Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {remainingArticles.map((article, index) => (
                  <article key={article.id} className={`nw-article-card p-2 md:p-4 ${index % 2 === 0 ? 'md:transform md:-rotate-1' : 'md:transform md:rotate-1'}`}>
                    {article.imageUrl && (
                      <div className="nw-90s-border mb-2 p-1">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full aspect-square object-cover max-w-32 md:max-w-40 mx-auto"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center mb-2 gap-1">
                      <span className="nw-retro-badge px-1 py-1 text-xs">
                        {article.category.toUpperCase()}
                      </span>
                      <span className="nw-dateline text-xs text-gray-600">
                        {article.date}
                      </span>
                    </div>
                    
                    <h4 className="nw-london-heading font-bold mb-2 text-sm md:text-base leading-tight text-london-navy hover:text-london-red transition-colors">
                      {article.title}
                    </h4>
                    
                    <p className="text-xs mb-2 line-clamp-2 font-serif text-gray-700 leading-relaxed">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-300 pt-3 gap-2">
                      <div className="nw-byline text-xs truncate max-w-full">
                        By {article.author.length > 15 ? article.author.substring(0, 15) + '...' : article.author}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleBookmark(article.id)}
                          className="nw-90s-button px-2 py-1 text-xs"
                          aria-label="Bookmark article"
                        >
                          {bookmarks.includes(article.id) ? '★' : '☆'}
                        </button>
                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="nw-90s-button px-3 py-1 text-xs font-bold"
                        >
                          READ
                        </button>
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nw-90s-button px-2 py-1 text-xs bg-blue-500 text-white border-blue-700"
                          title="View original source"
                        >
                          SRC
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer ref={wantedRef} className="bg-gradient-to-r from-london-navy to-gray-900 text-white p-8 mt-12">
        <div className="container mx-auto">
          {/* Developer Wanted Card - Mobile Responsive */}
          <div className="mb-12 flex justify-center px-2">
            <div className="nw-paper-vintage nw-grunge-border p-3 md:p-8 max-w-4xl w-full relative shadow-2xl nw-torn-edge" style={{aspectRatio: 'auto'}}>
              {/* Distressed Wanted Header */}
              <div className="text-center mb-4 md:mb-6 relative">
                <h2 className="font-impact text-3xl md:text-5xl lg:text-7xl tracking-widest nw-metallic-text mb-2" style={{fontFamily: 'Impact, Arial Black, sans-serif', filter: 'drop-shadow(2px 2px 0px #000)'}}>
                  WANTED
                </h2>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 md:-translate-y-2 text-red-700 text-sm md:text-xl font-bold" style={{transform: 'rotate(-15deg)'}}>
                  DEAD OR ALIVE
                </div>
                <div className="w-20 md:w-32 h-1 md:h-2 bg-gradient-to-r from-transparent via-black to-transparent mx-auto relative">
                  <div className="absolute inset-0 bg-black" style={{clipPath: 'polygon(0 40%, 100% 60%, 100% 100%, 0 100%)'}}></div>
                </div>
              </div>

              {/* Main Content Grid - Mobile Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Photo Section */}
                <div className="lg:col-span-1 flex justify-center order-1 lg:order-1">
                  <div className="border-4 border-black bg-gray-200 w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 relative nw-grunge-border nw-vintage-stains" style={{background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)'}}>
                    <div className="absolute inset-2 bg-white border-2 border-gray-400 overflow-hidden">
                      <img 
                        src="/ayush-developer.png" 
                        alt="Ayush Kumar Patel"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image doesn't load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Fallback content */}
                      <div className="hidden w-full h-full items-center justify-center text-gray-600">
                        <div className="text-center">
                          <div className="text-3xl md:text-6xl mb-2 font-bold nw-typewriter">AKP</div>
                          <div className="font-bold text-xs md:text-sm nw-typewriter">PHOTO NOT FOUND</div>
                        </div>
                      </div>
                    </div>
                    {/* Photo frame damage - enhanced */}
                    <div className="absolute top-1 right-1 w-3 h-2 md:w-4 md:h-3 bg-gradient-to-br from-red-700 to-red-900 opacity-60 transform rotate-12"></div>
                    <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 w-2 h-2 md:w-3 md:h-3 bg-gradient-to-tl from-yellow-600 to-yellow-800 opacity-50 rounded-full"></div>
                    <div className="absolute top-1/2 left-1 w-1 h-4 md:w-2 md:h-6 bg-gradient-to-b from-transparent via-black to-transparent opacity-30"></div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="md:col-span-2 space-y-4">
                  {/* Name with 90s styling */}
                  <div className="text-center md:text-left">
                    <h3 className="font-impact text-2xl md:text-3xl text-black mb-2 relative" style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                      <a 
                        href="https://www.linkedin.com/in/ayush-kumar-patel-50276a281/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-800 transition-colors"
                      >
                        AYUSH KUMAR PATEL (A.K.P)
                      </a>
                    </h3>
                    <div className="text-sm font-bold bg-black text-yellow-400 inline-block px-3 py-1 transform -rotate-2">
                      CODING CRIMINAL
                    </div>
                  </div>

                  {/* Skills List with 90s styling */}
                  <div className="space-y-2 bg-black text-green-400 p-4 font-mono border-2 border-green-400" style={{boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'}}>
                    <div className="text-green-300 text-sm mb-2">&gt; DEVELOPER_INFO.TXT</div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-400">[!]</span>
                      <span className="text-sm">LOCATION: Raipur, Chhattisgarh - Coding Hub</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-400">[!]</span>
                      <span className="text-sm">EXPERTISE: React, Node.js, MongoDB Master</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-400">[!]</span>
                      <span className="text-sm">PASSION: Creative UI/UX Design & Tech Innovation</span>
                    </div>
                    <div className="text-yellow-400 text-xs mt-2 blink">STATUS: AVAILABLE FOR FREELANCE PROJECTS</div>
                  </div>

              {/* Reward Badge - Mobile Responsive */}
              <div className="flex justify-center mt-4 lg:absolute lg:top-4 lg:right-4">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex flex-col items-center justify-center transform rotate-12 border-4 border-red-700 relative nw-distressed-btn">
                  <div className="font-impact text-xs md:text-sm">BOUNTY</div>
                  <div className="font-impact text-sm md:text-lg lg:text-2xl">HIRE</div>
                  <div className="font-impact text-xs">ASAP</div>
                  {/* Badge damage */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-red-600 transform rotate-45"></div>
                </div>
              </div>

                  {/* Contact Info with Social Media Logos - Simple Buttons */}
                  <div className="mt-4">
                    <div className="text-center md:text-left mb-3">
                      <span className="font-impact text-lg text-black bg-yellow-400 px-2 py-1 transform -rotate-1 inline-block">CONTACT INFORMATION</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {/* GitHub */}
                      <a 
                        href="https://github.com/ayushkumarpatel-AKP" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black text-white px-3 py-2 border-2 border-gray-600 hover:border-purple-400 transition-colors nw-distressed-btn font-mono text-sm"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>GITHUB</span>
                      </a>

                      {/* Instagram */}
                      <a 
                        href="https://instagram.com/akp07.official" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 border-2 border-pink-700 hover:border-pink-400 transition-colors nw-distressed-btn font-mono text-sm"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>INSTA</span>
                      </a>

                      {/* LinkedIn */}
                      <a 
                        href="https://www.linkedin.com/in/ayush-kumar-patel-50276a281/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 border-2 border-blue-800 hover:border-blue-400 transition-colors nw-distressed-btn font-mono text-sm"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span>LINKEDIN</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward Badge - Mobile Responsive */}
              <div className="flex justify-center mt-4 lg:absolute lg:top-4 lg:right-4">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-black w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex flex-col items-center justify-center transform rotate-12 border-4 border-red-700 relative nw-distressed-btn">
                  <div className="font-impact text-xs md:text-sm">BOUNTY</div>
                  <div className="font-impact text-sm md:text-lg lg:text-2xl">HIRE</div>
                  <div className="font-impact text-xs">ASAP</div>
                  {/* Badge damage */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-red-600 transform rotate-45"></div>
                </div>
              </div>

              {/* Bottom Banner with enhanced grunge effect - Mobile Responsive */}
              <div className="absolute bottom-[-20px] left-0 right-0 bg-gradient-to-r from-red-900 via-red-700 to-red-900 text-yellow-200 p-2 md:p-3 text-center border-t-4 border-black nw-vintage-stains">
                <div className="font-impact text-xs md:text-sm lg:text-lg relative nw-typewriter">
                  LAST_SEEN: Coding in Raipur • STATUS: Available for new projects
                  {/* Enhanced grunge overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-20" style={{clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)'}}></div>
                  <div className="absolute top-0 left-1/4 w-4 md:w-8 h-1 bg-yellow-600 opacity-40 transform -skew-x-12"></div>
                  <div className="absolute bottom-0 right-1/3 w-3 md:w-6 h-1 bg-red-400 opacity-30 transform skew-x-12"></div>
                </div>
              </div>

              {/* Enhanced 90s style corner damage and effects */}
              <div className="absolute top-0 left-0 w-10 h-10 bg-gradient-to-br from-red-700 to-transparent opacity-50" style={{clipPath: 'polygon(0 0, 80% 0, 0 80%)'}}></div>
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-yellow-600 to-transparent opacity-40" style={{clipPath: 'polygon(100% 0, 100% 70%, 30% 0)'}}></div>
              <div className="absolute bottom-8 left-0 w-6 h-12 bg-gradient-to-t from-black to-transparent opacity-30" style={{clipPath: 'polygon(0 0, 60% 40%, 0 100%)'}}></div>
              <div className="absolute bottom-8 right-0 w-4 h-8 bg-gradient-to-l from-gray-800 to-transparent opacity-25" style={{clipPath: 'polygon(100% 0, 100% 100%, 40% 60%)'}}></div>
              
              {/* Vintage fold marks */}
              <div className="absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-black to-transparent opacity-10"></div>
              <div className="absolute top-2/3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent opacity-15"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h4 className="nw-london-title text-xl mb-3 text-retro-gold">THE NEWSWALE</h4>
              <p className="font-mono text-sm">Chhattisgarh's Premier News Portal</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-retro-cyan">POWERED BY</h5>
              <p className="font-mono text-sm">NewsData.io API • Live Updates</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-retro-magenta">LIVE NEWS</h5>
              <p className="font-mono text-sm">{articles.length} Active Articles</p>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-6 pt-6 text-center">
            <p className="font-mono text-sm">© 2023-2025 NewsWale • Made in Raipur, Chhattisgarh</p>
            <p className="font-mono text-xs mt-2 text-retro-gold">
              "Real News, Real Time, Raipur Style!"
            </p>
            <p className="font-mono text-xs mt-1 text-gray-400">
              Developed with ❤️ by Ayush Kumar Patel
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 md:p-4 z-50">
          <div
            ref={modalRef}
            className="nw-modal max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="p-4 md:p-8">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b-4 border-london-navy pb-4 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="nw-retro-badge px-2 py-1 md:px-3 md:py-2 text-sm md:text-lg">
                    {selectedArticle.category.toUpperCase()}
                  </span>
                  <span className="nw-dateline text-sm md:text-lg text-gray-700">
                    {selectedArticle.date}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="nw-90s-button px-3 py-2 md:px-4 md:py-3 text-xl md:text-2xl font-bold hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close article"
                >
                  ✕
                </button>
              </div>
              
              {/* Article Title */}
              <h1 id="modal-title" className="nw-london-heading text-4xl font-bold mb-6 text-london-navy leading-tight">
                {selectedArticle.title}
              </h1>
              
              {/* Article Image */}
              {selectedArticle.imageUrl && (
                <div className="nw-90s-border mb-8 p-2">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-80 object-cover"
                  />
                  <div className="bg-black text-white p-3 text-sm font-mono">
                    LIVE PHOTO • {selectedArticle.date} • NEWSDATA.IO
                  </div>
                </div>
              )}
              
              {/* Byline and Actions */}
              <div className="flex items-center justify-between mb-8 border-b-2 border-gray-300 pb-4">
                <div className="nw-byline text-lg">
                  By <strong>{selectedArticle.author}</strong> • {selectedArticle.readTime}
                </div>
                <button
                  onClick={() => toggleBookmark(selectedArticle.id)}
                  className="nw-90s-button px-4 py-3 font-bold"
                  aria-label="Bookmark article"
                >
                  {bookmarks.includes(selectedArticle.id) ? '★ BOOKMARKED' : '☆ BOOKMARK'}
                </button>
              </div>
              
              {/* Article Content */}
              <div className="prose prose-xl max-w-none font-serif">
                {selectedArticle.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-6 text-justify leading-relaxed text-lg text-gray-800 font-serif">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Modal Footer */}
              <div className="mt-12 pt-6 border-t-4 border-london-navy bg-gradient-to-r from-gray-50 to-gray-100 -m-8 p-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-4">
                  <div className="nw-dateline text-xs md:text-sm text-gray-600 text-center md:text-left">
                    PUBLISHED: {selectedArticle.date} | TIME: {selectedArticle.readTime}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => toggleBookmark(selectedArticle.id)}
                      className="nw-90s-button px-3 py-2 text-sm"
                    >
                      {bookmarks.includes(selectedArticle.id) ? '★' : '☆'}
                    </button>
                    <a
                      href={selectedArticle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nw-90s-button px-3 py-2 text-sm bg-blue-500 text-white border-blue-700"
                    >
                      SOURCE
                    </a>
                    <button
                      onClick={closeModal}
                      className="nw-90s-button px-4 py-2 md:px-6 md:py-3 text-sm font-bold bg-gradient-to-r from-london-red to-red-600 text-white border-red-800"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsWale;
