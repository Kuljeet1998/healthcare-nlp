'use client';

import { FHIRQueryResponse } from '@/types/fhir';
import { cn, formatDate } from '@/lib/utils';
import { 
  ClockIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BeakerIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ResultsDisplayProps {
  queryResponse: FHIRQueryResponse | null;
  isLoading?: boolean;
  className?: string;
}

export default function ResultsDisplay({ 
  queryResponse, 
  isLoading = false,
  className 
}: ResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!queryResponse) {
    return (
      <div className={cn("bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center", className)}>
        <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Query Results</h3>
        <p className="text-gray-600">Enter a query to see analysis results and clinical insights.</p>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'medium':
      case 'moderate':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Query Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Query Analysis
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Query</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{queryResponse.original_query}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processed</label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                {formatDate(queryResponse.processed_timestamp)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Specialty</label>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <BeakerIcon className="w-4 h-4" />
                {queryResponse.nlp_analysis.medical_specialty}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${queryResponse.nlp_analysis.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(queryResponse.nlp_analysis.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Interpretation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HeartIcon className="w-5 h-5" />
          Clinical Interpretation
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Concern</label>
            <p className="text-gray-900">{queryResponse.clinical_interpretation.primary_concern}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Assessment</label>
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
              getUrgencyColor(queryResponse.clinical_interpretation.urgency_assessment)
            )}>
              {getPriorityIcon(queryResponse.clinical_interpretation.urgency_assessment)}
              <span className="font-medium">{queryResponse.clinical_interpretation.urgency_assessment}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Context</label>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
              {queryResponse.clinical_interpretation.clinical_context}
            </p>
          </div>
          
          {queryResponse.clinical_interpretation.potential_diagnoses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Potential Diagnoses</label>
              <div className="space-y-2">
                {queryResponse.clinical_interpretation.potential_diagnoses.map((diagnosis, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <TagIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-900">{diagnosis}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NLP Analysis Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5" />
          NLP Analysis Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entities */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Extracted Entities</h4>
            
            {queryResponse.nlp_analysis.entities.conditions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Conditions
                </label>
                <div className="flex flex-wrap gap-1">
                  {queryResponse.nlp_analysis.entities.conditions.map((condition, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {queryResponse.nlp_analysis.entities.symptoms.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-1">
                  {queryResponse.nlp_analysis.entities.symptoms.map((symptom, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {queryResponse.nlp_analysis.entities.medications.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Medications
                </label>
                <div className="flex flex-wrap gap-1">
                  {queryResponse.nlp_analysis.entities.medications.map((medication, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {medication}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {queryResponse.nlp_analysis.entities.body_parts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Body Parts
                </label>
                <div className="flex flex-wrap gap-1">
                  {queryResponse.nlp_analysis.entities.body_parts.map((part, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sentiment & Analysis */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Sentiment Analysis</h4>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                getUrgencyColor(queryResponse.nlp_analysis.sentiment.priority_level)
              )}>
                {getPriorityIcon(queryResponse.nlp_analysis.sentiment.priority_level)}
                <span className="font-medium">{queryResponse.nlp_analysis.sentiment.priority_level}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Urgency Score
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${queryResponse.nlp_analysis.sentiment.urgency_score * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(queryResponse.nlp_analysis.sentiment.urgency_score * 100)}%</span>
              </div>
            </div>
            
            {queryResponse.nlp_analysis.sentiment.emotional_indicators.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Emotional Indicators
                </label>
                <div className="flex flex-wrap gap-1">
                  {queryResponse.nlp_analysis.sentiment.emotional_indicators.map((indicator, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {queryResponse.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5" />
            Recommendations
          </h3>
          
          <div className="space-y-3">
            {queryResponse.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <LightBulbIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-green-900">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FHIR Query Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          FHIR Query Details
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {queryResponse.fhir_query.method}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {queryResponse.fhir_query.resource}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded break-all">
                {queryResponse.fhir_query.url}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
