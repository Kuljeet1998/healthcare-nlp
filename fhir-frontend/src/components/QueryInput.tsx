'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { querySuggestions } from '@/lib/mockData';
import { QuerySuggestion } from '@/types/fhir';
import { cn, debounce } from '@/lib/utils';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function QueryInput({ onSubmit, loading = false, placeholder = "Ask a healthcare question..." }: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced function to filter suggestions
  const debouncedFilterSuggestions = debounce((searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = querySuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.examples.some(example => 
        example.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).slice(0, 5);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, 300);

  useEffect(() => {
    debouncedFilterSuggestions(query);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSubmit(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getCategoryIcon = (category: QuerySuggestion['category']) => {
    switch (category) {
      case 'patients':
        return '👤';
      case 'conditions':
        return '🏥';
      case 'observations':
        return '📊';
      case 'medications':
        return '💊';
      case 'symptoms':
        return '🩺';
      default:
        return '🔍';
    }
  };

  const getCategoryColor = (category: QuerySuggestion['category']) => {
    switch (category) {
      case 'patients':
        return 'bg-blue-100 text-blue-800';
      case 'conditions':
        return 'bg-red-100 text-red-800';
      case 'observations':
        return 'bg-green-100 text-green-800';
      case 'medications':
        return 'bg-purple-100 text-purple-800';
      case 'symptoms':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Suggested queries</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-transparent",
                  selectedIndex === index && "bg-blue-50 border-blue-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">
                    {getCategoryIcon(suggestion.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {suggestion.text}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        getCategoryColor(suggestion.category)
                      )}>
                        {suggestion.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Try:</span>
        {querySuggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
          >
            "{suggestion.text}"
          </button>
        ))}
      </div>
    </div>
  );
}
