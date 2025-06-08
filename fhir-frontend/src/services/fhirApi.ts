/**
 * FHIR API Service
 * Handles communication between React frontend and Python backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface ApiResponse {
  success: boolean;
  query: string;
  nlp_analysis: {
    intent: string;
    entities: Record<string, any>;
    confidence: number;
    sentiment: {
      urgency_score: number;
      polarity: string;
    };
  };
  fhir_query: Record<string, any>;
  formatted_url: string;
  clinical_interpretation: {
    summary: string;
    urgency_level: string;
    priority_level: string;
    recommendations: string[];
  };
  simulated_results: {
    patients: Patient[];
    totalCount: number;
    chartData: {
      ageDistribution: ChartData[];
      genderDistribution: ChartData[];
      conditionDistribution: ChartData[];
    };
    summary: {
      avgAge: number;
      genderDistribution: Record<string, number>;
      totalConditions: number;
      activePatients: number;
    };
    queryInfo: {
      originalQuery: string;
      processedAt: string;
      resultsGenerated: number;
    };
  };
  error?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  birthDate: string;
  conditions: string[];
  medications: string[];
  lastVisit: string;
  mrn: string;
  status: string;
  contactInfo: {
    phone: string;
    email: string;
  };
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface PatientDetails extends Patient {
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
    height: string;
  };
  recentVisits: Array<{
    date: string;
    type: string;
    provider: string;
    notes: string;
  }>;
  allergies: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  version: string;
}

export class FHIRApiService {
  private baseUrl: string;
  private requestTimeout: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Process a natural language query
   */
  async processQuery(query: string): Promise<ApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      console.error('API request failed:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Get query suggestions for autocomplete
   */
  async getSuggestions(query?: string): Promise<string[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/suggestions`);
      if (query) {
        url.searchParams.append('q', query);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return []; // Return empty array as fallback
    }
  }

  /**
   * Get detailed patient information
   */
  async getPatientDetails(patientId: string): Promise<PatientDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/api/patients/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
      throw new Error(`Failed to get patient details: ${error.message}`);
    }
  }

  /**
   * Health check to verify API connectivity
   */
  async healthCheck(): Promise<HealthStatus | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }

  /**
   * Check if API is available
   */
  async isApiAvailable(): Promise<boolean> {
    const health = await this.healthCheck();
    return health?.status === 'healthy';
  }

  /**
   * Get API base URL for debugging
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set custom timeout for requests
   */
  setRequestTimeout(timeout: number): void {
    this.requestTimeout = timeout;
  }
}

// Export singleton instance
export const fhirApiService = new FHIRApiService();

// Export types for use in components
export type { ApiResponse, Patient, ChartData, PatientDetails, HealthStatus };
