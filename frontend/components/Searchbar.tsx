"use client";

import { searchCards } from "@/lib/api/cards";
import { CardData } from "@/lib/types";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

export default function Searchbar({ search, setSearch }: Props) {
  const [input, setInput] = useState(search);
  const [results, setResults] = useState<CardData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref to detect clicks outside the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // NEW: Ref to prevent fetching right after making a selection
  const skipNextFetch = useRef(false);

  // 1. Debounce updating the parent search state
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input);
    }, 300);

    return () => clearTimeout(timer);
  }, [input, setSearch]);

  // 2. Debounce fetching autocomplete suggestions
 // 2. Debounce fetching autocomplete suggestions
// 2. Debounce fetching autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchCards(input);
        
        // --- NEW: Deduplicate the cards by name ---
        const seenNames = new Set();
        const uniqueCards = data.filter(card => {
          if (seenNames.has(card.name)) {
            return false; // Skip if we already have this name
          }
          seenNames.add(card.name);
          return true;  // Keep if it's the first time we see it
        });
        // ------------------------------------------

        setResults(uniqueCards); // Set unique cards instead of raw data
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (skipNextFetch.current) {
        skipNextFetch.current = false;
        return;
      }
      
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);
  // 3. Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder="Search Magic cards..."
        className="
          w-full
          rounded-full
          bg-gray-100
          py-3
          pl-11
          pr-10
          text-sm
          text-gray-900
          placeholder:text-gray-500
          outline-none
          transition
          focus:bg-white
          focus:ring-2
          focus:ring-gray-300
          dark:bg-gray-800
          dark:text-gray-100
          dark:placeholder:text-gray-400
          dark:focus:bg-gray-700
          dark:focus:ring-gray-600
        "
      />

      {/* Loading Spinner */}
      {loading && (
        <Loader2
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
        />
      )}

      {/* Dropdown Suggestions Menu */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                skipNextFetch.current = true; // Tell the useEffect NOT to fetch on this specific change
                setInput(card.name);
                setSearch(card.name);
                setIsOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {card.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}