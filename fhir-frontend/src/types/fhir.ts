// FHIR Types and Interfaces
export interface FHIRQueryRequest {
  query: string;
  timestamp: string;
}

export interface FHIRPatient {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  age: number;
  birthDate: string;
  conditions: string[];
  observations: FHIRObservation[];
  medications: string[];
}

export interface FHIRObservation {
  id: string;
  type: string;
  value: number | string;
  unit?: string;
  date: string;
  status: 'final' | 'preliminary' | 'amended';
}

export interface FHIRCondition {
  id: string;
  code: string;
  display: string;
  severity: 'mild' | 'moderate' | 'severe';
  category: string;
  onsetDate: string;
  patientId: string;
}

export interface NLPAnalysis {
  intent: string;
  confidence: number;
  medical_specialty: string;
  query_complexity: number;
  entities: {
    conditions: string[];
    ages: number[];
    genders: string[];
    names: string[];
    patient_ids: string[];
    observations: string[];
    medications: string[];
    symptoms: string[];
    body_parts: string[];
    time_periods: string[];
    numbers: number[];
    severity_indicators: string[];
  };
  sentiment: {
    priority_level: string;
    urgency_score: number;
    emotional_indicators: string[];
  };
}

export interface FHIRQueryResponse {
  original_query: string;
  processed_timestamp: string;
  nlp_analysis: NLPAnalysis;
  fhir_query: {
    method: string;
    resource: string;
    url: string;
  };
  clinical_interpretation: {
    primary_concern: string;
    urgency_assessment: string;
    clinical_context: string;
    potential_diagnoses: string[];
  };
  recommendations: string[];
  data_requirements: {
    patient_identification: string[];
    clinical_data: string[];
    temporal_data: string[];
    additional_context: string[];
  };
}

export interface ChartData {
  name: string;
  value: number;
  category?: string;
  date?: string;
}

export interface FilterOptions {
  ageRange: [number, number];
  gender: string[];
  conditions: string[];
  dateRange: [string, string];
  severity: string[];
}

export interface QuerySuggestion {
  text: string;
  category: 'patients' | 'conditions' | 'observations' | 'medications' | 'symptoms';
  confidence: number;
  examples: string[];
}
