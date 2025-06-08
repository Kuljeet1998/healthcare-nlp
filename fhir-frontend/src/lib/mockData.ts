import { FHIRPatient, FHIRObservation, FHIRCondition, FHIRQueryResponse, QuerySuggestion } from '@/types/fhir';

// Mock data for demonstration
export const mockPatients: FHIRPatient[] = [
  {
    id: 'patient-001',
    name: 'John Smith',
    gender: 'male',
    age: 45,
    birthDate: '1979-03-15',
    conditions: ['diabetes', 'hypertension'],
    observations: [
      {
        id: 'obs-001',
        type: 'blood pressure',
        value: '140/90',
        unit: 'mmHg',
        date: '2024-06-01',
        status: 'final'
      },
      {
        id: 'obs-002',
        type: 'glucose',
        value: 120,
        unit: 'mg/dL',
        date: '2024-06-01',
        status: 'final'
      }
    ],
    medications: ['metformin', 'lisinopril']
  },
  {
    id: 'patient-002',
    name: 'Sarah Johnson',
    gender: 'female',
    age: 32,
    birthDate: '1992-07-22',
    conditions: ['asthma'],
    observations: [
      {
        id: 'obs-003',
        type: 'oxygen saturation',
        value: 98,
        unit: '%',
        date: '2024-06-02',
        status: 'final'
      }
    ],
    medications: ['albuterol']
  },
  {
    id: 'patient-003',
    name: 'Michael Brown',
    gender: 'male',
    age: 67,
    birthDate: '1957-11-08',
    conditions: ['heart disease', 'diabetes'],
    observations: [
      {
        id: 'obs-004',
        type: 'cholesterol',
        value: 240,
        unit: 'mg/dL',
        date: '2024-05-28',
        status: 'final'
      },
      {
        id: 'obs-005',
        type: 'heart rate',
        value: 72,
        unit: 'bpm',
        date: '2024-06-02',
        status: 'final'
      }
    ],
    medications: ['insulin', 'aspirin']
  },
  {
    id: 'patient-004',
    name: 'Emily Davis',
    gender: 'female',
    age: 28,
    birthDate: '1996-04-12',
    conditions: ['migraine'],
    observations: [
      {
        id: 'obs-006',
        type: 'blood pressure',
        value: '110/70',
        unit: 'mmHg',
        date: '2024-06-03',
        status: 'final'
      }
    ],
    medications: ['ibuprofen']
  },
  {
    id: 'patient-005',
    name: 'Robert Wilson',
    gender: 'male',
    age: 55,
    birthDate: '1969-09-30',
    conditions: ['hypertension', 'arthritis'],
    observations: [
      {
        id: 'obs-007',
        type: 'weight',
        value: 180,
        unit: 'lbs',
        date: '2024-06-01',
        status: 'final'
      },
      {
        id: 'obs-008',
        type: 'blood pressure',
        value: '150/95',
        unit: 'mmHg',
        date: '2024-06-01',
        status: 'final'
      }
    ],
    medications: ['lisinopril', 'ibuprofen']
  }
];

export const mockConditions: FHIRCondition[] = [
  {
    id: 'cond-001',
    code: '73211009',
    display: 'Diabetes mellitus',
    severity: 'moderate',
    category: 'endocrine',
    onsetDate: '2020-01-15',
    patientId: 'patient-001'
  },
  {
    id: 'cond-002',
    code: '38341003',
    display: 'Hypertensive disorder',
    severity: 'mild',
    category: 'cardiovascular',
    onsetDate: '2019-06-20',
    patientId: 'patient-001'
  },
  {
    id: 'cond-003',
    code: '195967001',
    display: 'Asthma',
    severity: 'mild',
    category: 'respiratory',
    onsetDate: '2018-03-10',
    patientId: 'patient-002'
  }
];

export const querySuggestions: QuerySuggestion[] = [
  {
    text: "Find all diabetic patients over 40",
    category: 'patients',
    confidence: 0.95,
    examples: [
      "Show diabetic patients above 50",
      "List diabetes patients over 40 years",
      "Get all patients with diabetes over age 40"
    ]
  },
  {
    text: "Show blood pressure readings for patient John Smith",
    category: 'observations',
    confidence: 0.90,
    examples: [
      "Blood pressure observations for John Smith",
      "Get BP readings for patient John",
      "Show vital signs for John Smith"
    ]
  },
  {
    text: "List all patients with heart disease",
    category: 'conditions',
    confidence: 0.92,
    examples: [
      "Find heart disease patients",
      "Show cardiovascular conditions",
      "Get all cardiac patients"
    ]
  },
  {
    text: "Find medications for hypertension",
    category: 'medications',
    confidence: 0.88,
    examples: [
      "Show hypertension medications",
      "List blood pressure drugs",
      "Get antihypertensive medications"
    ]
  },
  {
    text: "Show recent glucose measurements",
    category: 'observations',
    confidence: 0.85,
    examples: [
      "Latest glucose readings",
      "Recent blood sugar levels",
      "Show glucose observations"
    ]
  }
];

// Main function to process queries and return FHIR responses
export async function processQuery(query: string): Promise<FHIRQueryResponse> {
  const timestamp = new Date().toISOString();
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const queryLower = query.toLowerCase();
  const entities = extractMockEntities(queryLower);
  const resource = determineResource(queryLower);
  const queryParams = generateQueryParams(queryLower);
  
  const response: FHIRQueryResponse = {
    original_query: query,
    processed_timestamp: timestamp,
    nlp_analysis: {
      intent: determineIntent(queryLower),
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      medical_specialty: determineMedicalSpecialty(queryLower),
      query_complexity: Math.floor(Math.random() * 5) + 1,
      entities,
      sentiment: {
        priority_level: determinePriorityLevel(queryLower),
        urgency_score: Math.random() * 0.5 + (queryLower.includes('emergency') || queryLower.includes('urgent') ? 0.5 : 0),
        emotional_indicators: extractEmotionalIndicators(queryLower)
      }
    },
    fhir_query: {
      method: 'GET',
      resource,
      url: `https://hapi.fhir.org/baseR4/${resource}?${queryParams}`
    },
    clinical_interpretation: {
      primary_concern: extractPrimaryConcern(queryLower),
      urgency_assessment: determineUrgencyLevel(queryLower),
      clinical_context: generateClinicalContext(queryLower),
      potential_diagnoses: extractPotentialDiagnoses(queryLower)
    },
    recommendations: generateRecommendations(queryLower),
    data_requirements: {
      patient_identification: ['Patient ID', 'Name', 'Date of Birth'],
      clinical_data: ['Diagnoses', 'Medications', 'Vital Signs'],
      temporal_data: ['Onset dates', 'Last updated'],
      additional_context: ['Provider notes', 'Care plan']
    }
  };

  return response;
}

function determineIntent(query: string): string {
  if (query.includes('find') || query.includes('show') || query.includes('get')) return 'search';
  if (query.includes('create') || query.includes('add')) return 'create';
  if (query.includes('update') || query.includes('modify')) return 'update';
  if (query.includes('delete') || query.includes('remove')) return 'delete';
  return 'search';
}

function determineMedicalSpecialty(query: string): string {
  if (query.includes('heart') || query.includes('cardio')) return 'Cardiology';
  if (query.includes('diabetes') || query.includes('endocrin')) return 'Endocrinology';
  if (query.includes('mental') || query.includes('psych')) return 'Psychiatry';
  if (query.includes('child') || query.includes('pediatr')) return 'Pediatrics';
  if (query.includes('cancer') || query.includes('oncol')) return 'Oncology';
  return 'Internal Medicine';
}

function determinePriorityLevel(query: string): string {
  if (query.includes('emergency') || query.includes('urgent') || query.includes('critical')) return 'high';
  if (query.includes('soon') || query.includes('moderate')) return 'medium';
  return 'low';
}

function determineUrgencyLevel(query: string): string {
  if (query.includes('emergency') || query.includes('critical')) return 'Critical';
  if (query.includes('urgent') || query.includes('immediate')) return 'High';
  if (query.includes('soon') || query.includes('moderate')) return 'Medium';
  return 'Low';
}

function extractEmotionalIndicators(query: string): string[] {
  const indicators = [];
  if (query.includes('pain') || query.includes('hurt')) indicators.push('pain');
  if (query.includes('worried') || query.includes('concern')) indicators.push('anxiety');
  if (query.includes('emergency') || query.includes('urgent')) indicators.push('urgency');
  if (query.includes('help') || query.includes('please')) indicators.push('request_for_help');
  return indicators;
}

function generateClinicalContext(query: string): string {
  if (query.includes('diabetes')) {
    return 'Patient inquiry relates to diabetes management and monitoring. Consider reviewing current treatment plan, medication adherence, and lifestyle factors.';
  }
  if (query.includes('blood pressure') || query.includes('hypertension')) {
    return 'Cardiovascular health assessment indicated. Review current BP readings, medication effectiveness, and risk factors.';
  }
  if (query.includes('pain')) {
    return 'Pain assessment required. Evaluate pain severity, location, duration, and impact on daily activities.';
  }
  return 'General healthcare inquiry requiring comprehensive patient assessment and care coordination.';
}

function extractMockEntities(query: string) {
  const entities = {
    conditions: [] as string[],
    ages: [] as number[],
    genders: [] as string[],
    names: [] as string[],
    patient_ids: [] as string[],
    observations: [] as string[],
    medications: [] as string[],
    symptoms: [] as string[],
    body_parts: [] as string[],
    time_periods: [] as string[],
    numbers: [] as number[],
    severity_indicators: [] as string[]
  };

  // Extract conditions
  const conditions = ['diabetes', 'hypertension', 'asthma', 'heart disease', 'migraine'];
  conditions.forEach(condition => {
    if (query.includes(condition)) entities.conditions.push(condition);
  });

  // Extract observations
  const observations = ['blood pressure', 'glucose', 'cholesterol', 'heart rate', 'weight'];
  observations.forEach(obs => {
    if (query.includes(obs)) entities.observations.push(obs);
  });

  // Extract age numbers
  const ageMatch = query.match(/\b(\d+)\b/g);
  if (ageMatch) {
    entities.ages = ageMatch.map(Number).filter(n => n > 0 && n < 120);
  }

  // Extract names
  const nameMatch = query.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
  if (nameMatch) {
    entities.names = nameMatch;
  }

  return entities;
}

function determineResource(query: string): string {
  if (query.includes('patient')) return 'Patient';
  if (query.includes('condition') || query.includes('disease')) return 'Condition';
  if (query.includes('medication') || query.includes('drug')) return 'MedicationRequest';
  if (query.includes('observation') || query.includes('vital')) return 'Observation';
  return 'Patient';
}

function generateQueryParams(query: string): string {
  const params = [];
  
  if (query.includes('diabetes')) params.push('code=73211009');
  if (query.includes('male')) params.push('gender=male');
  if (query.includes('female')) params.push('gender=female');
  
  const ageMatch = query.match(/over\s+(\d+)/);
  if (ageMatch) {
    const year = new Date().getFullYear() - parseInt(ageMatch[1]);
    params.push(`birthdate=le${year}`);
  }

  return params.join('&') || '_count=10';
}

function extractPrimaryConcern(query: string): string {
  if (query.includes('diabetes')) return 'Diabetes management';
  if (query.includes('blood pressure')) return 'Blood pressure monitoring';
  if (query.includes('heart')) return 'Cardiovascular health';
  if (query.includes('pain')) return 'Pain assessment';
  return 'General healthcare inquiry';
}

function extractPotentialDiagnoses(query: string): string[] {
  const diagnoses = [];
  if (query.includes('diabetes')) diagnoses.push('Type 2 Diabetes Mellitus');
  if (query.includes('hypertension') || query.includes('blood pressure')) diagnoses.push('Essential Hypertension');
  if (query.includes('asthma')) diagnoses.push('Bronchial Asthma');
  if (query.includes('heart')) diagnoses.push('Coronary Artery Disease');
  return diagnoses;
}

function generateRecommendations(query: string): string[] {
  const recommendations = [];
  
  if (query.includes('diabetes')) {
    recommendations.push('Monitor blood glucose levels regularly');
    recommendations.push('Review dietary habits and medication adherence');
  }
  
  if (query.includes('blood pressure') || query.includes('hypertension')) {
    recommendations.push('Regular blood pressure monitoring');
    recommendations.push('Consider lifestyle modifications');
  }
  
  if (query.includes('emergency') || query.includes('urgent')) {
    recommendations.push('Immediate medical attention recommended');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Follow up with healthcare provider as needed');
  }
  
  return recommendations;
}
