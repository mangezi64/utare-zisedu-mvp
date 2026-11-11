"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ZIMBABWE_CITIES } from "@/types";
import {
  MapPin,
  Globe,
  PlusCircle,
  Search,
  ChevronDown,
  Check,
  X,
  Info,
  Building2,
} from "lucide-react";

interface ZimbabweCitySelectProps {
  value: string;
  onChange: (city: string) => void;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  id?: string;
  required?: boolean;
  label?: string;
  allowAbroad?: boolean;
}

const MAJOR_CITIES = [
  "Harare",
  "Bulawayo",
  "Chitungwiza",
  "Mutare",
  "Gweru",
  "Epworth",
  "Kwekwe",
  "Kadoma",
  "Masvingo",
  "Chinhoyi",
  "Norton",
  "Marondera",
  "Ruwa",
  "Chegutu",
  "Zvishavane",
  "Bindura",
  "Beitbridge",
  "Redcliff",
  "Victoria Falls",
  "Hwange",
  "Rusape",
  "Chiredzi",
  "Kariba",
  "Karoi",
  "Gokwe",
  "Chipinge",
  "Shurugwi",
  "Gwanda",
];

const KNOWN_CITIES_SET = new Set<string>(ZIMBABWE_CITIES);

export default function ZimbabweCitySelect({
  value,
  onChange,
  className = "",
  selectClassName = "",
  inputClassName = "",
  id = "zimbabwe-city-select",
  required = false,
  label,
  allowAbroad = true,
}: ZimbabweCitySelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customText, setCustomText] = useState("");

  const isAbroad =
    value.toLowerCase().includes("abroad") ||
    value.toLowerCase().includes("diaspora");

  const isOther =
    !KNOWN_CITIES_SET.has(value) && !isAbroad && value !== "";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtered lists based on search term
  const query = searchTerm.trim().toLowerCase();

  const filteredMajorCities = useMemo(() => {
    if (!query) return MAJOR_CITIES;
    return MAJOR_CITIES.filter((c) => c.toLowerCase().includes(query));
  }, [query]);

  const filteredOtherTowns = useMemo(() => {
    const list = ZIMBABWE_CITIES.filter(
      (c) =>
        !MAJOR_CITIES.includes(c) &&
        c !== "Other" &&
        c !== "Growth Point / Rural District" &&
        c !== "Diaspora / Abroad (Outside Zimbabwe)"
    );
    if (!query) return list;
    return list.filter((c) => c.toLowerCase().includes(query));
  }, [query]);

  const showDistricts =
    !query || "growth point / rural district".includes(query);
  const showAbroad =
    allowAbroad &&
    (!query ||
      "diaspora / abroad (outside zimbabwe)".includes(query) ||
      "abroad".includes(query) ||
      "diaspora".includes(query) ||
      "international".includes(query));

  const exactMatchExists =
    filteredMajorCities.some((c) => c.toLowerCase() === query) ||
    filteredOtherTowns.some((c) => c.toLowerCase() === query);

  const handleSelectPredefined = (city: string) => {
    onChange(city);
    setSearchTerm("");
    setCustomText("");
    setIsOpen(false);
  };

  const handleSelectAbroad = () => {
    const defaultVal = customText.trim()
      ? `Abroad (${customText.trim()})`
      : "Diaspora / Abroad (Outside Zimbabwe)";
    onChange(defaultVal);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleSelectOther = () => {
    const customVal = customText.trim() ? customText.trim() : "Other";
    onChange(customVal);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleApplyCustomSearch = () => {
    if (!searchTerm.trim()) return;
    onChange(searchTerm.trim());
    setCustomText(searchTerm.trim());
    setSearchTerm("");
    setIsOpen(false);
  };

  const displayLabel = useMemo(() => {
    if (!value) return "Select Zimbabwean town, city or abroad...";
    if (isAbroad) return value.startsWith("Abroad") || value.startsWith("Diaspora") ? value : `Abroad (${value})`;
    return value;
  }, [value, isAbroad]);

  return (
    <div ref={containerRef} className={`relative space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700"
        >
          {label}
        </label>
      )}

      {/* Main Trigger / Search Display Box */}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className={`w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-xs hover:border-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition ${selectClassName}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {isAbroad ? (
              <Globe className="h-4 w-4 text-blue-600 shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
            )}
            <span
              className={`truncate ${
                !value ? "text-slate-400" : "font-medium text-slate-800"
              }`}
            >
              {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("Harare");
                  setCustomText("");
                }}
                className="p-0.5 hover:text-slate-600 rounded"
                title="Reset to Harare"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-emerald-700" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden animate-fadeIn">
            {/* Search Input Filter Header */}
            <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search town, city, district or abroad..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* If user typed a search that isn't an exact match, offer 1-click 'Use Custom' */}
            {searchTerm.trim().length > 1 && !exactMatchExists && (
              <button
                type="button"
                onClick={handleApplyCustomSearch}
                className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 border-b border-emerald-100 text-xs font-bold hover:bg-emerald-100 transition shrink-0"
              >
                <PlusCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  Use &quot;<strong>{searchTerm.trim()}</strong>&quot; as custom location
                </span>
              </button>
            )}

            {/* Scrollable List of Cities and Towns */}
            <div className="overflow-y-auto p-1.5 space-y-2 text-xs divide-y divide-slate-100">
              {/* Major Cities Group */}
              {filteredMajorCities.length > 0 && (
                <div className="pt-1">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-emerald-700" />
                    Major Cities & Metropolitan Hubs
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                    {filteredMajorCities.map((city) => {
                      const isSelected = value === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleSelectPredefined(city)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                            isSelected
                              ? "bg-emerald-700 text-white font-bold"
                              : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                          }`}
                        >
                          <span>{city}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Towns, Municipalities & Urban Centres Group */}
              {filteredOtherTowns.length > 0 && (
                <div className="pt-2">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    Towns & Urban Centres ({filteredOtherTowns.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                    {filteredOtherTowns.map((town) => {
                      const isSelected = value === town;
                      return (
                        <button
                          key={town}
                          type="button"
                          onClick={() => handleSelectPredefined(town)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                            isSelected
                              ? "bg-emerald-700 text-white font-bold"
                              : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                          }`}
                        >
                          <span className="truncate">{town}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* International & Diaspora */}
              {showAbroad && (
                <div className="pt-2">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-blue-600" />
                    International & Diaspora
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAbroad}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                      isAbroad
                        ? "bg-blue-600 text-white font-bold"
                        : "text-blue-900 bg-blue-50/70 hover:bg-blue-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span>Diaspora / Abroad (Outside Zimbabwe)</span>
                    </div>
                    {isAbroad && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </div>
              )}

              {/* Districts & Custom Locations */}
              {(showDistricts || !exactMatchExists) && (
                <div className="pt-2">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Growth Points & Custom Options
                  </div>

                  {showDistricts && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectPredefined("Growth Point / Rural District")
                      }
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition mb-1 ${
                        value === "Growth Point / Rural District"
                          ? "bg-emerald-700 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>Growth Point / Rural District</span>
                      {value === "Growth Point / Rural District" && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSelectOther}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      isOther
                        ? "bg-emerald-700 text-white font-bold"
                        : "text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Other (Specify Custom Location)</span>
                    </div>
                    {isOther && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </div>
              )}

              {filteredMajorCities.length === 0 &&
                filteredOtherTowns.length === 0 &&
                !showAbroad && (
                  <div className="p-4 text-center text-slate-500">
                    <p className="text-xs">No matching town found for &quot;{searchTerm}&quot;.</p>
                    <button
                      type="button"
                      onClick={handleApplyCustomSearch}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add &quot;{searchTerm}&quot; as your location
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* When 'Other' or a custom Zimbabwean town is active */}
      {isOther && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 space-y-1.5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <PlusCircle className="h-3.5 w-3.5 text-emerald-700" />
            <span>Specify Your Zimbabwean Town, Growth Point or Ward</span>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-700" />
            <input
              type="text"
              required={required}
              placeholder="e.g. Chakari, Hauna, Nyika, Murombedzi, Mhangura..."
              value={customText || (value !== "Other" ? value : "")}
              onChange={(e) => {
                const text = e.target.value;
                setCustomText(text);
                onChange(text.trim() ? text : "Other");
              }}
              className={`w-full rounded-lg border border-emerald-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-none ${inputClassName}`}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            We will pair you with the closest regional solar and Starlink-backed partner hub.
          </p>
        </div>
      )}

      {/* When Diaspora / Abroad is active */}
      {isAbroad && allowAbroad && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-3 space-y-1.5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Globe className="h-3.5 w-3.5 text-blue-700" />
            <span>Specify Your Country & City Abroad</span>
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-blue-700" />
            <input
              type="text"
              required={required}
              placeholder="e.g. South Africa (Johannesburg), UK (London), Botswana (Gaborone), Canada..."
              value={
                customText ||
                (value.startsWith("Abroad (")
                  ? value.replace(/^Abroad\s*\(/i, "").replace(/\)$/, "")
                  : "")
              }
              onChange={(e) => {
                const text = e.target.value;
                setCustomText(text);
                onChange(
                  text.trim()
                    ? `Abroad (${text.trim()})`
                    : "Diaspora / Abroad (Outside Zimbabwe)"
                );
              }}
              className={`w-full rounded-lg border border-blue-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none ${inputClassName}`}
            />
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-blue-800 pt-0.5">
            <Info className="h-3.5 w-3.5 shrink-0 text-blue-600 mt-0.5" />
            <span>
              <strong>Diaspora Notice:</strong> Full access to skills diagnostics, AI roadmaps, tailored ATS CVs, and remote job applications is active. (Physical innovation hub workstations operate inside Zimbabwe).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
