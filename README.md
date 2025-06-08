# Enhanced FHIR AI-Powered Healthcare Query Service

An advanced AI-powered service that converts natural language healthcare queries into FHIR-compliant API requests using comprehensive NLP processing. This service demonstrates state-of-the-art integration of Natural Language Processing with healthcare data standards to enable intuitive, intelligent querying of medical records with clinical interpretation and sentiment analysis.

## 🚀 Enhanced Features

- **🧠 Advanced NLP Processing**: Uses spaCy with enhanced entity extraction for medical terms, symptoms, conditions, medications, and body parts
- **💭 Sentiment Analysis**: Analyzes query urgency, emotional indicators, and priority levels using TextBlob
- **🎯 Intent Classification**: Advanced intent recognition including emergency detection, symptom reporting, and appointment scheduling
- **🏥 FHIR Compliance**: Generates proper FHIR R4 API requests with comprehensive parameter mapping
- **📊 Confidence Scoring**: Multi-factor confidence calculation based on entities, intent, and sentiment
- **🩺 Clinical Interpretation**: Provides clinical context, potential diagnoses, and recommendations
- **🏷️ Medical Specialty Detection**: Auto-identifies relevant medical specialties based on query content
- **📈 Query Complexity Assessment**: Analyzes and scores query complexity for better processing
- **🔄 Intelligent Fallback**: Uses regex patterns when advanced NLP libraries are unavailable
- **⚡ Real-time Processing**: Fast, efficient processing suitable for clinical environments

## 📋 Supported Medical Entities

### Conditions
- Diabetes, Hypertension, Asthma, Heart Disease, Cancer
- Depression, Anxiety, Migraine, Arthritis, Pneumonia

### Observations/Vitals
- Blood Pressure, Temperature, Heart Rate, Weight, Glucose
- Cholesterol, Hemoglobin, Oxygen Saturation, BMI

### Symptoms & Indicators
- Pain, Fever, Nausea, Cough, Headache, Breathing difficulties
- Severity indicators: severe, mild, moderate, chronic, acute

### Medical Specialties
- Cardiology, Endocrinology, Respiratory, Neurology
- Psychiatry, Orthopedics, General Medicine

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download spaCy English model:**
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Initialize TextBlob corpora (optional for enhanced sentiment analysis):**
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('brown')"
   ```

## Usage

### Basic Usage

```python
from fhir_query_service import FHIRQueryService

service = FHIRQueryService()
result = service.parse_natural_language("Show me all diabetic patients over 50")
formatted = service.format_fhir_request(result)
print(formatted)
```

### Enhanced Usage with Comprehensive Analysis

```python
service = FHIRQueryService()

# Process patient query with full NLP analysis
query = "I'm experiencing severe chest pain and difficulty breathing"
comprehensive_analysis = service.process_patient_query(query)

print("Clinical Interpretation:", comprehensive_analysis["clinical_interpretation"])
print("Recommendations:", comprehensive_analysis["recommendations"])
print("Urgency Level:", comprehensive_analysis["nlp_analysis"]["sentiment"]["priority_level"])
```

### Advanced NLP Analysis

```python
service = FHIRQueryService()

# Get detailed NLP breakdown
nlp_analysis = service.extract_entities_and_intent("Show me diabetic patients with recent glucose tests")
print(f"Intent: {nlp_analysis['intent']}")
print(f"Medical Specialty: {nlp_analysis['medical_specialty']}")
print(f"Entities: {nlp_analysis['entities']}")
print(f"Confidence: {nlp_analysis['confidence']}")
print(f"Sentiment: {nlp_analysis['sentiment']}")
```
print(service.format_fhir_request(fhir_query))
```

## Running Examples

```bash
python fhir_query_service.py
```

This will run the demonstration with 5 example queries showing the complete NLP pipeline.

## Example Queries and Outputs

### 1. "Show me all diabetic patients over 50"

**NLP Analysis:**
- Intent: `find_patients`
- Confidence: `0.95`
- Entities: `{"conditions": ["diabetic"], "ages": [50]}`

**FHIR API Request:**
```
GET /Patient?_has:Condition:patient:code=73211009&birthdate=le1975
```

### 2. "Find blood pressure observations for patient 123 from last 30 days"

**NLP Analysis:**
- Intent: `find_observations`
- Confidence: `0.90`
- Entities: `{"observations": ["blood pressure"], "patient_ids": ["123"], "numbers": [30]}`

**FHIR API Request:**
```
GET /Observation?subject=Patient/123&code=85354-9&date=ge2024-11-08
```

### 3. "Get active diabetes conditions for patient 456"

**NLP Analysis:**
- Intent: `find_conditions`
- Confidence: `0.85`
- Entities: `{"conditions": ["diabetes"], "patient_ids": ["456"]}`

**FHIR API Request:**
```
GET /Condition?subject=Patient/456&code=73211009&clinical-status=active
```

### 4. "List all female patients named Sarah"

**NLP Analysis:**
- Intent: `find_patients`
- Confidence: `0.80`
- Entities: `{"names": ["Sarah"], "genders": ["female"]}`

**FHIR API Request:**
```
GET /Patient?name=Sarah&gender=female
```

### 5. "Show heart rate measurements for patient 789"

**NLP Analysis:**
- Intent: `find_observations`
- Confidence: `0.85`
- Entities: `{"observations": ["heart rate"], "patient_ids": ["789"]}`

**FHIR API Request:**
```
GET /Observation?subject=Patient/789&code=8867-4
```

## Architecture

### NLP Processing Pipeline

1. **Text Preprocessing**: Normalize input text
2. **Entity Recognition**: Extract medical entities using spaCy + domain knowledge
3. **Intent Classification**: Determine query intent (find_patients, find_conditions, etc.)
4. **Confidence Scoring**: Calculate confidence based on extracted entities
5. **FHIR Mapping**: Convert entities to appropriate FHIR parameters

### Supported Medical Codes

**Conditions (SNOMED CT):**
- Diabetes mellitus: `73211009`
- Hypertensive disorder: `38341003`
- Asthma: `195967001`
- Heart disease: `56265001`
- Cancer: `363346000`

**Observations (LOINC):**
- Blood pressure panel: `85354-9`
- Body temperature: `8310-5`
- Heart rate: `8867-4`
- Body weight: `29463-7`
- Glucose measurement: `33747-0`

## Testing

The service includes comprehensive test examples that cover:
- Patient queries with demographics and conditions
- Observation queries with time ranges
- Condition queries with clinical status
- Complex multi-entity queries
- Edge cases and error handling

## Error Handling

The service handles various error scenarios:
- Missing spaCy installation (fallback to regex)
- Missing language models
- Ambiguous queries
- Unsupported entity types
- Invalid FHIR parameters

## Technical Details

- **Base FHIR Server**: Uses HAPI FHIR test server (`https://hapi.fhir.org/baseR4`)
- **NLP Library**: spaCy with English language model (`en_core_web_sm`)
- **Medical Standards**: FHIR R4, SNOMED CT, LOINC
- **Python Version**: 3.7+

## Limitations

- Currently supports English language only
- Limited to basic FHIR resource types
- Requires internet connection for FHIR server queries
- Medical code mappings are simplified for demonstration

## Future Enhancements

- Support for additional languages
- Integration with real EHR systems
- More sophisticated clinical decision logic
- Support for complex temporal queries
- Integration with medical ontologies

## License

This project is for educational and demonstration purposes.
