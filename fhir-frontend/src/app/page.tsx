'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterOptions } from '@/types/fhir';
import { fhirApiService, ApiResponse, Patient, ChartData } from '@/services/fhirApi';
import QueryInput from '@/components/QueryInput';
import PatientTable from '@/components/PatientTable';
import DataVisualization from '@/components/DataVisualization';
import FilterPanel from '@/components/FilterPanel';
import ResultsDisplay from '@/components/ResultsDisplay';
import LanguageSelector from '@/components/LanguageSelector';
import { BeakerIcon, ChartBarIcon, TableCellsIcon, DocumentTextIcon, WifiIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { t, i18n } = useTranslation(['common', 'navigation', 'forms']);
  const [query, setQuery] = useState('');
  const [languageKey, setLanguageKey] = useState(0); // Force re-renders on language change
  const [queryResponse, setQueryResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'table' | 'charts'>('results');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [0, 100],
    gender: [],
    conditions: [],
    dateRange: ['', ''],
    severity: []
  });

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
    loadSuggestions();
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1); // Force re-render
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    // Also listen to i18n language change events
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const checkApiHealth = async () => {
    setApiStatus('checking');
    try {
      const isHealthy = await fhirApiService.isApiAvailable();
      setApiStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus('offline');
    }
  };

  const loadSuggestions = async () => {
    try {
      const fetchedSuggestions = await fhirApiService.getSuggestions();
      setSuggestions(fetchedSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  // Get available conditions for filter options from current results
  const availableConditions = useMemo(() => {
    if (!queryResponse?.simulated_results?.patients) return [];
    
    const conditions = new Set<string>();
    queryResponse.simulated_results.patients.forEach(patient => {
      patient.conditions.forEach(condition => conditions.add(condition));
    });
    return Array.from(conditions).sort();
  }, [queryResponse]);

  // Filter patients based on current filters
  const filteredPatients = useMemo(() => {
    if (!queryResponse?.simulated_results?.patients) return [];
    
    return queryResponse.simulated_results.patients.filter(patient => {
      // Age filter
      if (patient.age < filters.ageRange[0] || patient.age > filters.ageRange[1]) {
        return false;
      }
      
      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(patient.gender)) {
        return false;
      }
      
      // Conditions filter
      if (filters.conditions.length > 0) {
        const hasMatchingCondition = filters.conditions.some(condition => 
          patient.conditions.includes(condition)
        );
        if (!hasMatchingCondition) return false;
      }
      
      // Date range filter (birth date)
      if (filters.dateRange[0] && new Date(patient.birthDate) < new Date(filters.dateRange[0])) {
        return false;
      }
      if (filters.dateRange[1] && new Date(patient.birthDate) > new Date(filters.dateRange[1])) {
        return false;
      }
      
      return true;
    });
  }, [queryResponse, filters]);

  // Generate chart data from filtered patients
  const chartData = useMemo(() => {
    if (!filteredPatients.length) return [];

    // Age distribution data
    const ageGroups = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '80+': 0
    };

    filteredPatients.forEach(patient => {
      if (patient.age <= 20) ageGroups['0-20']++;
      else if (patient.age <= 40) ageGroups['21-40']++;
      else if (patient.age <= 60) ageGroups['41-60']++;
      else if (patient.age <= 80) ageGroups['61-80']++;
      else ageGroups['80+']++;
    });

    return Object.entries(ageGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value
      }));
  }, [filteredPatients]);

  const handleQuerySubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setQuery(searchQuery);
    setError(null);
    
    try {
      const response = await fhirApiService.processQuery(searchQuery);
      
      if (response.success) {
        setQueryResponse(response);
        setActiveTab('results');
      } else {
        setError(response.error || 'Query processing failed');
      }
    } catch (error: any) {
      console.error('Error processing query:', error);
      setError(error.message || 'Failed to process query');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'results', name: 'Query Results', icon: DocumentTextIcon },
    { id: 'table', name: 'Patient Data', icon: TableCellsIcon },
    { id: 'charts', name: 'Visualizations', icon: ChartBarIcon }
  ] as const;

  const getApiStatusColor = () => {
    switch (apiStatus) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case 'online': return t('common:success');
      case 'offline': return t('common:error');
      default: return t('common:loading');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BeakerIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('navigation:header.title')}</h1>
                <p className="text-gray-600">{t('navigation:header.subtitle')}</p>
              </div>
            </div>
            
            {/* API Status Indicator & Language Selector */}
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={checkApiHealth}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border hover:bg-gray-50"
              >
                <div className={`w-2 h-2 rounded-full ${getApiStatusColor()}`}></div>
                <WifiIcon className="w-4 h-4" />
                <span>{getApiStatusText()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Query Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('forms:query.title')}</h2>
            <QueryInput
              onSubmit={handleQuerySubmit}
              loading={isLoading}
              placeholder={t('forms:query.placeholder')}
            />
            
            {/* Quick suggestions */}
            {suggestions.length > 0 && !queryResponse && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">{t('forms:query.examples')}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuerySubmit(suggestion)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  {apiStatus === 'offline' && (
                    <p className="text-red-600 text-sm mt-2">
                      Make sure the Python backend is running at {fhirApiService.getBaseUrl()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Available */}
          {queryResponse && queryResponse.success && (
            <>
              {/* Filters and Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableConditions={availableConditions}
                    isOpen={isFilterOpen}
                    onToggle={() => setIsFilterOpen(!isFilterOpen)}
                  />
                  
                  <div className="text-sm text-gray-600">
                    Showing {filteredPatients.length} of {queryResponse.simulated_results.totalCount} patients
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex rounded-lg border border-gray-300 bg-white">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Area */}
              <div className="space-y-8">
                {activeTab === 'results' && (
                  <ResultsDisplay
                    queryResponse={{
                      original_query: queryResponse.query,
                      processed_timestamp: new Date().toISOString(),
                      nlp_analysis: {
                        ...queryResponse.nlp_analysis,
                        medical_specialty: queryResponse.nlp_analysis.intent,
                        query_complexity: queryResponse.nlp_analysis.confidence,
                        entities: {
                          conditions: queryResponse.nlp_analysis.entities.conditions || [],
                          ages: queryResponse.nlp_analysis.entities.ages || [],
                          genders: queryResponse.nlp_analysis.entities.genders || [],
                          names: queryResponse.nlp_analysis.entities.names || [],
                          patient_ids: queryResponse.nlp_analysis.entities.patient_ids || [],
                          observations: queryResponse.nlp_analysis.entities.observations || [],
                          medications: queryResponse.nlp_analysis.entities.medications || [],
                          symptoms: queryResponse.nlp_analysis.entities.symptoms || [],
                          body_parts: queryResponse.nlp_analysis.entities.body_parts || [],
                          time_periods: queryResponse.nlp_analysis.entities.time_periods || [],
                          numbers: queryResponse.nlp_analysis.entities.numbers || [],
                          severity_indicators: queryResponse.nlp_analysis.entities.severity_indicators || [],
                        },
                        sentiment: {
                          priority_level: queryResponse.clinical_interpretation.priority_level,
                          urgency_score: queryResponse.nlp_analysis.sentiment.urgency_score,
                          emotional_indicators: []
                        }
                      },
                      fhir_query: {
                        method: 'GET',
                        resource: 'Patient',
                        url: queryResponse.formatted_url
                      },
                      clinical_interpretation: {
                        primary_concern: queryResponse.clinical_interpretation.summary,
                        urgency_assessment: queryResponse.clinical_interpretation.urgency_level,
                        clinical_context: 'Patient data analysis',
                        potential_diagnoses: []
                      },
                      recommendations: queryResponse.clinical_interpretation.recommendations,
                      data_requirements: {
                        patient_identification: [],
                        clinical_data: [],
                        temporal_data: [],
                        additional_context: []
                      }
                    }}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'table' && (
                  <PatientTable
                    patients={filteredPatients.map(p => ({
                      id: p.id,
                      name: p.name,
                      age: p.age,
                      gender: p.gender as 'male' | 'female' | 'other' | 'unknown',
                      birthDate: p.birthDate,
                      conditions: p.conditions,
                      observations: [], // Empty for now, would be populated from API
                      medications: p.medications
                    }))}
                    onPatientSelect={(patient) => setSelectedPatient(filteredPatients.find(p => p.id === patient.id) || null)}
                    selectedPatientId={selectedPatient?.id}
                  />
                )}

                {activeTab === 'charts' && (
                  <div className="space-y-6">
                    {/* Age Distribution Chart */}
                    {chartData.length > 0 && (
                      <DataVisualization
                        data={chartData}
                        type="bar"
                        title="Patient Age Distribution"
                      />
                    )}
                    
                    {/* Gender Distribution Chart */}
                    {queryResponse.simulated_results.chartData.genderDistribution.length > 0 && (
                      <DataVisualization
                        data={queryResponse.simulated_results.chartData.genderDistribution}
                        type="pie"
                        title="Gender Distribution"
                      />
                    )}

                    {/* Condition Distribution Chart */}
                    {queryResponse.simulated_results.chartData.conditionDistribution.length > 0 && (
                      <DataVisualization
                        data={queryResponse.simulated_results.chartData.conditionDistribution}
                        type="pie"
                        title="Medical Conditions Distribution"
                      />
                    )}
                    
                    {/* Query Analysis Metrics */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Analysis Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">NLP Confidence Score</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${queryResponse.nlp_analysis.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(queryResponse.nlp_analysis.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Urgency Score</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-red-500 h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${queryResponse.nlp_analysis.sentiment.urgency_score * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(queryResponse.nlp_analysis.sentiment.urgency_score * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional metrics */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {queryResponse.simulated_results.summary.activePatients}
                          </div>
                          <div className="text-sm text-gray-600">Active Patients</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(queryResponse.simulated_results.summary.avgAge)}
                          </div>
                          <div className="text-sm text-gray-600">Avg Age</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {queryResponse.simulated_results.summary.totalConditions}
                          </div>
                          <div className="text-sm text-gray-600">Conditions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {queryResponse.clinical_interpretation.urgency_level.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">Urgency Level</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('forms:query.processing')}</p>
              <p className="text-sm text-gray-500 mt-2">Using advanced NLP to analyze your request</p>
            </div>
          )}

          {/* Empty State */}
          {!queryResponse && !isLoading && !error && (
            <div className="text-center py-12">
              <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No queries yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by entering a natural language query about patient data above.
              </p>
            </div>
          )}

          {/* Selected Patient Details */}
          {selectedPatient && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{selectedPatient.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Age:</dt>
                      <dd>{selectedPatient.age}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Gender:</dt>
                      <dd className="capitalize">{selectedPatient.gender}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Birth Date:</dt>
                      <dd>{selectedPatient.birthDate}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Conditions</h4>
                  <div className="space-y-1">
                    {selectedPatient.conditions.map((condition, index) => (
                      <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Medications</h4>
                  <div className="space-y-1">
                    {selectedPatient.medications.map((medication, index) => (
                      <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                        {medication}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPatient(null)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close Details
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
