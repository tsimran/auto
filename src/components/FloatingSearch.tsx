import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Globe, Layout, FileText, Loader2, Sparkles, Bot } from 'lucide-react';
import type { AIModel } from './ModelSelector';
import { setAIModel } from '../utils/ai';

interface FloatingSearchProps {
  isSummarized: boolean;
  onSearch: (query: string) => void;
}

export const FloatingSearch: React.FC<FloatingSearchProps> = ({ isSummarized, onSearch }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'domain' | 'page'>('page');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        !isLoading
      ) {
        setIsExpanded(false);
        setShowScopeMenu(false);
        setShowModelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLoading]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setShowScopeMenu(false);
    setShowModelMenu(false);

    const query = `[${searchScope.toUpperCase()}] ${searchQuery}`;
    
    try {
      await onSearch(query);
    } finally {
      setIsLoading(false);
      setSearchQuery('');
      setIsExpanded(false);
    }
  };

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    setAIModel(model);
    setShowModelMenu(false);
  };

  const scopeIcons = {
    all: <Globe className="w-4 h-4" />,
    domain: <Layout className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />
  };

  const scopeLabels = {
    all: 'Search everywhere',
    domain: 'Search this domain',
    page: 'Search this page'
  };

  const modelIcons = {
    gemini: <Sparkles className="w-4 h-4" />,
    perplexity: <Bot className="w-4 h-4" />
  };

  const modelLabels = {
    gemini: 'Gemini',
    perplexity: 'Perplexity'
  };

  if (!isSummarized) return null;

  return (
    <>
      {(showScopeMenu || showModelMenu || isExpanded) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-500 ease-out"
          onClick={() => {
            setShowScopeMenu(false);
            setShowModelMenu(false);
            if (!isLoading) setIsExpanded(false);
          }}
        />
      )}
      <div className="fixed bottom-4 left-4 z-50" ref={searchContainerRef}>
        <form 
          onSubmit={handleSubmit}
          className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isExpanded ? 'w-[calc(100%-2rem)]' : 'w-10'
          }`}
        >
          <div
            className={`relative flex items-center bg-white/90 dark:bg-gray-800/90 rounded-full 
              shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300
              ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-sm backdrop-saturate-150
              ${isExpanded ? 'w-full' : 'w-10 h-10 hover:scale-105'}
              ${isLoading ? 'border-blue-500 dark:border-blue-400' : ''}
              ${!isExpanded && !isLoading ? 'animate-bounce-subtle search-icon-pulse' : ''}
              ${isExpanded ? 'neon-glow' : ''}`}
          >
            <button
              type="button"
              onClick={() => {
                if (!isLoading) {
                  setIsExpanded(!isExpanded);
                  setShowScopeMenu(false);
                  setShowModelMenu(false);
                }
              }}
              disabled={isLoading}
              className={`flex items-center justify-center transition-transform duration-300 relative z-10
                ${isExpanded ? 'w-10 h-10 rotate-90' : 'w-full h-full hover:rotate-12'}`}
            >
              {isLoading ? (
                <div className="relative">
                  <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
                </div>
              ) : isExpanded ? (
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                  dark:hover:text-gray-300 transition-colors" />
              ) : (
                <Search className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                  dark:hover:text-gray-300 transition-colors" />
              )}
            </button>

            <div className={`flex-1 flex items-center overflow-hidden transition-all duration-300
              ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <button
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    setShowScopeMenu(!showScopeMenu);
                    setShowModelMenu(false);
                  }
                }}
                disabled={isLoading}
                className="flex items-center justify-center w-10 h-10 text-gray-500 
                  hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
                  transition-transform hover:scale-110 disabled:opacity-50"
              >
                {scopeIcons[searchScope]}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    setShowModelMenu(!showModelMenu);
                    setShowScopeMenu(false);
                  }
                }}
                disabled={isLoading}
                className="flex items-center justify-center w-10 h-10 text-gray-500 
                  hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
                  transition-transform hover:scale-110 disabled:opacity-50"
              >
                {modelIcons[selectedModel]}
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isLoading ? 'Generating answer...' : scopeLabels[searchScope]}
                  disabled={isLoading}
                  className="outline-none bg-transparent text-gray-800 dark:text-gray-200 
                    placeholder-gray-400 dark:placeholder-gray-500 text-sm w-full px-2
                    disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {showScopeMenu && !isLoading && (
            <div
              className="absolute left-10 bottom-14 bg-white/90 dark:bg-gray-800/90 rounded-lg 
                shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]
                transform origin-bottom-left animate-in slide-in-from-bottom-2 duration-200
                backdrop-blur-sm backdrop-saturate-150"
            >
              {(Object.keys(scopeIcons) as Array<keyof typeof scopeIcons>).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => {
                    setSearchScope(scope);
                    setShowScopeMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                    transition-all duration-200 hover:scale-105
                    ${searchScope === scope 
                      ? 'bg-blue-50/80 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80'
                    }`}
                >
                  <span className="transition-transform duration-200 hover:scale-110">
                    {scopeIcons[scope]}
                  </span>
                  <span>{scopeLabels[scope]}</span>
                </button>
              ))}
            </div>
          )}

          {showModelMenu && !isLoading && (
            <div
              className="absolute left-20 bottom-14 bg-white/90 dark:bg-gray-800/90 rounded-lg 
                shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]
                transform origin-bottom-left animate-in slide-in-from-bottom-2 duration-200
                backdrop-blur-sm backdrop-saturate-150"
            >
              {(Object.keys(modelIcons) as Array<keyof typeof modelIcons>).map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => handleModelSelect(model)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                    transition-all duration-200 hover:scale-105
                    ${selectedModel === model 
                      ? 'bg-blue-50/80 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80'
                    }`}
                >
                  <span className="transition-transform duration-200 hover:scale-110">
                    {modelIcons[model]}
                  </span>
                  <span>{modelLabels[model]}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </>
  );
};