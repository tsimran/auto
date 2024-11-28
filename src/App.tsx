import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeCurrentPage, askQuestion } from './utils/ai';
import { Header } from './components/Header';
import { QuestionInput } from './components/QuestionInput';
import { ContentSection } from './components/ContentSection';
import { FocusModal } from './components/FocusModal';
import { SelectionPopup } from './components/SelectionPopup';
import { AnswerAnimation } from './components/AnswerAnimation';
import { FloatingSearch } from './components/FloatingSearch';
import { ModelSelector, type AIModel } from './components/ModelSelector';
import { CommandSearch } from './components/CommandSearch';
import { setAIModel } from './utils/ai';
import Browser from 'webextension-polyfill';

interface SearchResult {
  id: string;
  content: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [answerType, setAnswerType] = useState<'define' | 'elaborate' | 'search' | null>(null);
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'domain' | 'page'>('page');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummarized, setIsSummarized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [selectionPopup, setSelectionPopup] = useState<{
    position: { x: number; y: number } | null;
    text: string;
    visible: boolean;
  }>({
    position: null,
    text: '',
    visible: false
  });

  const answerRef = useRef<HTMLDivElement>(null);
  const searchAnswerRef = useRef<HTMLDivElement>(null);
  const latestSearchRef = useRef<HTMLDivElement>(null);

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    setAIModel(model);
  };

  const getCurrentUrl = async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) {
      setUrl(tabs[0].url);
    }
  };

  const summarizeCurrentPage = async () => {
    setIsSummarizing(true);
    setLoading(true);
    try {
      const summary = await analyzeCurrentPage();
      setSummary(summary);
      setIsSummarized(true);
    } catch (error) {
      console.error('Error analyzing page:', error);
    }
    setLoading(false);
    setIsSummarizing(false);
  };

  const handleTextSelection = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const popupWidth = 300;
        const popupHeight = 150;

        let x = rect.left + (rect.width / 2);
        let y = rect.top;

        if (x - popupWidth/2 < 0) {
          x = popupWidth/2;
        } else if (x + popupWidth/2 > windowWidth) {
          x = windowWidth - popupWidth/2;
        }

        if (y - popupHeight < 0) {
          y = rect.bottom + 10;
        } else {
          y = rect.top - 10;
        }

        setSelectionPopup({
          position: { x, y },
          text: selectedText,
          visible: true
        });
      }
    } else {
      setSelectionPopup(prev => ({ ...prev, visible: false }));
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const popup = document.querySelector('.selection-popup');
    if (!popup?.contains(event.target as Node)) {
      setSelectionPopup(prev => ({ ...prev, visible: false }));
    }
  }, []);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await askQuestion(question, searchScope);
      setAnswer(response);
      setQuestion('');
      scrollToAnswer();
    } catch (error) {
      console.error('Error getting answer:', error);
    }
    setLoading(false);
  };

  const scrollToAnswer = () => {
    setTimeout(() => {
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSearch = (answer: string) => {
    const newSearchResult: SearchResult = {
      id: Date.now().toString(),
      content: answer,
      timestamp: Date.now()
    };
    setSearchResults(prev => [...prev, newSearchResult]);
    setAnswerType('search');
  };

  const handleFloatingSearch = async (query: string) => {
    setLoading(true);
    try {
      const match = query.match(/^\[(ALL|DOMAIN|PAGE)\]\s*(.+)$/);
      const scope = match ? match[1].toLowerCase() as 'all' | 'domain' | 'page' : 'page';
      const cleanQuery = match ? match[2] : query;
      
      const response = await askQuestion(cleanQuery, scope);
      setAnswer(response);
      scrollToAnswer();
    } catch (error) {
      console.error('Error getting answer:', error);
    }
    setLoading(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const loadState = async () => {
      const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      
      const storageKey = `tab_${tabId}`;
      const result = await Browser.storage.local.get([storageKey]);
      const tabData = result[storageKey];
      
      if (tabData) {
        if (tabData.summary) setSummary(tabData.summary);
        if (tabData.answer) setAnswer(tabData.answer);
        if (tabData.searchResults) setSearchResults(tabData.searchResults);
        if (tabData.darkMode !== undefined) {
          setDarkMode(tabData.darkMode);
          if (tabData.darkMode) {
            document.documentElement.classList.add('dark');
          }
        }
      }
    };

    loadState();
    summarizeCurrentPage();
    getCurrentUrl();
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const saveState = async () => {
      const tabs = await Browser.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      
      const storageKey = `tab_${tabId}`;
      await Browser.storage.local.set({
        [storageKey]: {
          summary,
          answer,
          searchResults,
          darkMode
        }
      });
    };

    saveState();
  }, [summary, answer, searchResults, darkMode]);

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {darkMode && <div className="fixed-gradient" />}
      <Header 
        url={url} 
        onSummarize={summarizeCurrentPage}
        isSummarizing={isSummarizing}
        isSummarized={isSummarized}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      
      <div className="p-4 space-y-4">
        <QuestionInput
          question={question}
          loading={loading}
          onChange={setQuestion}
          onSubmit={handleQuestionSubmit}
          onFocusClick={() => setShowFocusModal(true)}
          searchScope={searchScope}
        />

        <div className="mt-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelSelect={handleModelChange}
          />
          <CommandSearch />
        </div>
        
        {summary && <ContentSection title="Page Summary" content={summary} />}
        
        <div ref={answerRef}>
          {loading && answerType && !answer && (
            <AnswerAnimation type={answerType} />
          )}
          {answer && (
            <ContentSection 
              title="Answer" 
              content={answer} 
            />
          )}
        </div>

        <div ref={searchAnswerRef} id="search-answer">
          {searchResults.map((result, index) => (
            <div 
              key={result.id} 
              ref={index === searchResults.length - 1 ? latestSearchRef : null}
            >
              <ContentSection 
                title={`Search Result (${new Date(result.timestamp).toLocaleTimeString()})`}
                content={result.content} 
              />
            </div>
          ))}
        </div>
      </div>

      <SelectionPopup
        position={selectionPopup.position}
        selectedText={selectionPopup.text}
        onDefine={() => {}}
        onExplain={() => {}}
        onSearch={handleSearch}
        visible={selectionPopup.visible}
        darkMode={darkMode}
      />

      <FocusModal
        isOpen={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        onScopeSelect={setSearchScope}
        currentScope={searchScope}
      />

      <FloatingSearch 
        isSummarized={isSummarized}
        onSearch={handleFloatingSearch}
      />
    </div>
  );
};

export default App;