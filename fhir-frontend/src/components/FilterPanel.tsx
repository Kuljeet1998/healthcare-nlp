'use client';

import { useState, useEffect } from 'react';
import { FilterOptions } from '@/types/fhir';
import { cn } from '@/lib/utils';
import { 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableConditions: string[];
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FilterPanel({ 
  filters, 
  onFiltersChange, 
  availableConditions,
  className,
  isOpen,
  onToggle
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAgeRangeChange = (index: number, value: string) => {
    const newAgeRange: [number, number] = [...localFilters.ageRange];
    newAgeRange[index] = parseInt(value) || 0;
    handleFilterChange('ageRange', newAgeRange);
  };

  const handleGenderToggle = (gender: string) => {
    const currentGenders = localFilters.gender;
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter(g => g !== gender)
      : [...currentGenders, gender];
    handleFilterChange('gender', newGenders);
  };

  const handleConditionToggle = (condition: string) => {
    const currentConditions = localFilters.conditions;
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];
    handleFilterChange('conditions', newConditions);
  };

  const handleSeverityToggle = (severity: string) => {
    const currentSeverity = localFilters.severity;
    const newSeverity = currentSeverity.includes(severity)
      ? currentSeverity.filter(s => s !== severity)
      : [...currentSeverity, severity];
    handleFilterChange('severity', newSeverity);
  };

  const handleDateRangeChange = (index: number, value: string) => {
    const newDateRange: [string, string] = [...localFilters.dateRange];
    newDateRange[index] = value;
    handleFilterChange('dateRange', newDateRange);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      ageRange: [0, 100],
      gender: [],
      conditions: [],
      dateRange: ['', ''],
      severity: []
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.ageRange[0] > 0 || localFilters.ageRange[1] < 100) count++;
    if (localFilters.gender.length > 0) count++;
    if (localFilters.conditions.length > 0) count++;
    if (localFilters.severity.length > 0) count++;
    if (localFilters.dateRange[0] || localFilters.dateRange[1]) count++;
    return count;
  };

  const genderOptions = ['male', 'female', 'other', 'unknown'];
  const severityOptions = ['mild', 'moderate', 'severe'];

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
          isOpen ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300"
        )}
      >
        <AdjustmentsHorizontalIcon className="w-5 h-5" />
        <span>Filters</span>
        {getActiveFilterCount() > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
            {getActiveFilterCount()}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className={cn(
          "bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-6",
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filter Options
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              Age Range
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={localFilters.ageRange[0]}
                  onChange={(e) => handleAgeRangeChange(0, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min age"
                />
              </div>
              <span className="text-gray-500">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={localFilters.ageRange[1]}
                  onChange={(e) => handleAgeRangeChange(1, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max age"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleGenderToggle(gender)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-colors capitalize",
                    localFilters.gender.includes(gender)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          {availableConditions.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <HeartIcon className="w-4 h-4" />
                Conditions
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {availableConditions.map((condition) => (
                  <label key={condition} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={localFilters.conditions.includes(condition)}
                      onChange={() => handleConditionToggle(condition)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Severity */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Severity
            </label>
            <div className="flex flex-wrap gap-2">
              {severityOptions.map((severity) => (
                <button
                  key={severity}
                  onClick={() => handleSeverityToggle(severity)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-colors capitalize",
                    localFilters.severity.includes(severity)
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date Range
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={localFilters.dateRange[0]}
                  onChange={(e) => handleDateRangeChange(0, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-500">to</span>
              <div className="flex-1">
                <input
                  type="date"
                  value={localFilters.dateRange[1]}
                  onChange={(e) => handleDateRangeChange(1, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600">
                <strong>{getActiveFilterCount()}</strong> filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
