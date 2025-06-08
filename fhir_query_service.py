import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import uuid

# NLP Library Integration
try:
    import spacy
    from spacy.lang.en.stop_words import STOP_WORDS
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("Warning: spaCy not installed. Install with: pip install spacy && python -m spacy download en_core_web_sm")

# Additional NLP libraries for sentiment analysis
try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("Warning: TextBlob not available for sentiment analysis. Install with: pip install textblob")

class FHIRQueryService:
    """
    Enhanced AI-powered service for converting natural language queries into FHIR API requests.
    Features comprehensive NLP processing including entity extraction, sentiment analysis,
    intent classification, and confidence scoring for healthcare queries.
    Uses spaCy for advanced NLP processing when available, falls back to regex patterns.
    """
    
    def __init__(self):
        self.base_url = "https://hapi.fhir.org/baseR4"
        
        # Initialize spaCy if available
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                print("✅ spaCy NLP model loaded successfully")
            except OSError:
                print("⚠️  spaCy model not found. Install with: python -m spacy download en_core_web_sm")
        
        # Define medical condition mappings with expanded coverage
        self.condition_codes = {
            "diabetes": {"code": "73211009", "display": "Diabetes mellitus", "category": "endocrine"},
            "diabetic": {"code": "73211009", "display": "Diabetes mellitus", "category": "endocrine"},
            "hypertension": {"code": "38341003", "display": "Hypertensive disorder", "category": "cardiovascular"},
            "high blood pressure": {"code": "38341003", "display": "Hypertensive disorder", "category": "cardiovascular"},
            "asthma": {"code": "195967001", "display": "Asthma", "category": "respiratory"},
            "heart disease": {"code": "56265001", "display": "Heart disease", "category": "cardiovascular"},
            "cancer": {"code": "363346000", "display": "Malignant neoplastic disease", "category": "oncology"},
            "depression": {"code": "35489007", "display": "Depressive disorder", "category": "mental_health"},
            "anxiety": {"code": "48694002", "display": "Anxiety disorder", "category": "mental_health"},
            "migraine": {"code": "37796009", "display": "Migraine", "category": "neurological"},
            "arthritis": {"code": "3723001", "display": "Arthritis", "category": "musculoskeletal"},
            "pneumonia": {"code": "233604007", "display": "Pneumonia", "category": "respiratory"}
        }
        
        # Define observation codes with expanded coverage
        self.observation_codes = {
            "blood pressure": {"code": "85354-9", "display": "Blood pressure panel", "category": "vital_signs"},
            "temperature": {"code": "8310-5", "display": "Body temperature", "category": "vital_signs"},
            "heart rate": {"code": "8867-4", "display": "Heart rate", "category": "vital_signs"},
            "pulse": {"code": "8867-4", "display": "Heart rate", "category": "vital_signs"},
            "weight": {"code": "29463-7", "display": "Body weight", "category": "physical_measurement"},
            "glucose": {"code": "33747-0", "display": "Glucose measurement", "category": "laboratory"},
            "cholesterol": {"code": "14647-2", "display": "Cholesterol", "category": "laboratory"},
            "hemoglobin": {"code": "718-7", "display": "Hemoglobin", "category": "laboratory"},
            "oxygen saturation": {"code": "59408-5", "display": "Oxygen saturation", "category": "vital_signs"},
            "bmi": {"code": "39156-5", "display": "Body mass index", "category": "physical_measurement"}
        }
        
        # Define medication categories for better classification
        self.medication_categories = {
            "insulin": {"category": "antidiabetic", "therapeutic_class": "hormone"},
            "metformin": {"category": "antidiabetic", "therapeutic_class": "biguanide"},
            "lisinopril": {"category": "antihypertensive", "therapeutic_class": "ace_inhibitor"},
            "aspirin": {"category": "analgesic", "therapeutic_class": "nsaid"},
            "amoxicillin": {"category": "antibiotic", "therapeutic_class": "penicillin"},
            "ibuprofen": {"category": "analgesic", "therapeutic_class": "nsaid"},
            "albuterol": {"category": "bronchodilator", "therapeutic_class": "beta_agonist"}
        }
        
        # Define urgency keywords for sentiment/priority analysis
        self.urgency_keywords = {
            "emergency": 5,
            "urgent": 4,
            "severe": 4,
            "critical": 5,
            "pain": 3,
            "bleeding": 4,
            "difficulty breathing": 5,
            "chest pain": 5,
            "allergic reaction": 4,
            "fever": 3,
            "routine": 1,
            "follow-up": 2,
            "check-up": 1
        }
    
    def analyze_sentiment(self, query: str) -> Dict:
        """
        Analyze sentiment and urgency level of the query.
        Returns sentiment polarity, urgency score, and emotional indicators.
        """
        sentiment_data = {
            "polarity": 0.0,
            "urgency_score": 1,
            "emotional_indicators": [],
            "priority_level": "routine"
        }
        
        # Use TextBlob for sentiment analysis if available
        if TEXTBLOB_AVAILABLE:
            try:
                blob = TextBlob(query)
                sentiment_data["polarity"] = blob.sentiment.polarity
            except:
                pass
        
        # Analyze urgency based on keywords
        query_lower = query.lower()
        max_urgency = 1
        
        for keyword, urgency_level in self.urgency_keywords.items():
            if keyword in query_lower:
                sentiment_data["emotional_indicators"].append(keyword)
                max_urgency = max(max_urgency, urgency_level)
        
        sentiment_data["urgency_score"] = max_urgency
        
        # Determine priority level
        if max_urgency >= 5:
            sentiment_data["priority_level"] = "emergency"
        elif max_urgency >= 4:
            sentiment_data["priority_level"] = "urgent"
        elif max_urgency >= 3:
            sentiment_data["priority_level"] = "moderate"
        else:
            sentiment_data["priority_level"] = "routine"
        
        return sentiment_data

    def extract_entities_and_intent(self, query: str) -> Dict:
        """
        Enhanced entity extraction and intent determination using advanced NLP.
        Includes sentiment analysis, confidence scoring, and comprehensive entity recognition.
        """
        entities = {
            "conditions": [],
            "ages": [],
            "genders": [],
            "names": [],
            "patient_ids": [],
            "observations": [],
            "medications": [],
            "symptoms": [],
            "body_parts": [],
            "time_periods": [],
            "numbers": [],
            "severity_indicators": []
        }
        
        # Use spaCy for advanced entity extraction if available
        if self.nlp:
            doc = self.nlp(query.lower())
            
            # Extract named entities
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities["names"].append(ent.text.title())
                elif ent.label_ == "DATE":
                    entities["time_periods"].append(ent.text)
                elif ent.label_ == "CARDINAL":
                    if ent.text.isdigit():
                        entities["numbers"].append(int(ent.text))
                elif ent.label_ in ["ORG", "GPE"]:  # Organizations or locations
                    entities["body_parts"].append(ent.text)
            
            # Extract symptoms and body parts using dependency parsing
            for token in doc:
                # Look for symptoms (nouns that might indicate medical issues)
                if token.pos_ == "NOUN" and token.dep_ in ["dobj", "nsubj"]:
                    if any(symptom_word in token.text for symptom_word in ["pain", "ache", "swelling", "rash", "fever"]):
                        entities["symptoms"].append(token.text)
                
                # Extract body parts
                if token.text in ["head", "chest", "back", "leg", "arm", "stomach", "heart", "lung", "kidney", "liver"]:
                    entities["body_parts"].append(token.text)
        
        # Extract medical conditions with enhanced pattern matching
        for condition in self.condition_codes.keys():
            if condition.lower() in query.lower():
                entities["conditions"].append(condition)
        
        # Extract observation types
        for obs_type in self.observation_codes.keys():
            if obs_type.lower() in query.lower():
                entities["observations"].append(obs_type)
        
        # Extract medications
        for medication in self.medication_categories.keys():
            if medication.lower() in query.lower():
                entities["medications"].append(medication)
        
        # Enhanced symptom extraction
        symptom_patterns = [
            r'\b(pain|ache|hurt|sore|tender)\b',
            r'\b(fever|temperature|hot|cold)\b',
            r'\b(nausea|dizzy|tired|fatigue)\b',
            r'\b(cough|sneeze|runny nose)\b',
            r'\b(headache|migraine|head pain)\b',
            r'\b(shortness of breath|difficulty breathing)\b'
        ]
        
        for pattern in symptom_patterns:
            matches = re.findall(pattern, query.lower())
            entities["symptoms"].extend(matches)
        
        # Extract severity indicators
        severity_patterns = [
            r'\b(severe|mild|moderate|chronic|acute)\b',
            r'\b(intense|sharp|dull|throbbing)\b',
            r'\b(persistent|occasional|frequent)\b'
        ]
        
        for pattern in severity_patterns:
            matches = re.findall(pattern, query.lower())
            entities["severity_indicators"].extend(matches)
        
        # Extract age information using regex
        age_patterns = [
            r'over\s+(\d+)',
            r'above\s+(\d+)',
            r'(\d+)\s+years?\s*old',
            r'age\s+(\d+)',
            r'aged\s+(\d+)'
        ]
        
        for pattern in age_patterns:
            matches = re.findall(pattern, query.lower())
            entities["ages"].extend([int(match) for match in matches])
        
        # Extract gender
        if re.search(r'\bmale\b', query.lower()) and not re.search(r'\bfemale\b', query.lower()):
            entities["genders"].append("male")
        elif re.search(r'\bfemale\b', query.lower()):
            entities["genders"].append("female")
        
        # Extract patient IDs
        patient_id_matches = re.findall(r'patient\s+([a-zA-Z0-9-]+)', query.lower())
        entities["patient_ids"].extend(patient_id_matches)
        
        # Extract names using regex if spaCy didn't find any
        if not entities["names"]:
            name_match = re.search(r'named?\s+([a-zA-Z\s]+)', query, re.IGNORECASE)
            if name_match:
                entities["names"].append(name_match.group(1).strip().title())
        
        # Determine intent with enhanced classification
        intent = self._determine_intent_advanced(query)
        
        # Get sentiment analysis
        sentiment = self.analyze_sentiment(query)
        
        return {
            "intent": intent,
            "entities": entities,
            "sentiment": sentiment,
            "confidence": self._calculate_confidence_advanced(intent, entities, sentiment),
            "nlp_method": "spaCy Enhanced" if self.nlp else "regex",
            "query_complexity": self._assess_query_complexity(entities),
            "medical_specialty": self._identify_medical_specialty(entities)
        }
    
    def _determine_intent_advanced(self, query: str) -> str:
        """Enhanced intent determination with better accuracy."""
        query_lower = query.lower()
        
        # Emergency/urgent intents
        if any(word in query_lower for word in ["emergency", "urgent", "critical", "severe pain", "difficulty breathing"]):
            return "emergency_query"
        
        # Symptom reporting intents
        if any(word in query_lower for word in ["feel", "experiencing", "having", "suffering"]) and \
           any(word in query_lower for word in ["pain", "ache", "symptom", "problem"]):
            return "symptom_reporting"
        
        # Medication intents
        if any(word in query_lower for word in ["medication", "prescription", "drug", "pill", "dosage"]):
            if any(word in query_lower for word in ["find", "show", "get", "list"]):
                return "find_medications"
            else:
                return "medication_inquiry"
        
        # Check for specific resource types and action words
        if any(word in query_lower for word in ["find", "show", "get", "list", "search"]):
            if "patient" in query_lower:
                return "find_patients"
            elif any(word in query_lower for word in ["condition", "diagnosis", "disease"]) or any(cond in query_lower for cond in self.condition_codes.keys()):
                return "find_conditions"
            elif any(word in query_lower for word in ["observation", "vital", "measurement", "test", "result"]) or any(obs in query_lower for obs in self.observation_codes.keys()):
                return "find_observations"
            elif "appointment" in query_lower:
                return "find_appointments"
        
        # Appointment scheduling intents
        if any(word in query_lower for word in ["schedule", "book", "appointment", "visit"]):
            return "schedule_appointment"
        
        # General health information
        if any(word in query_lower for word in ["what is", "tell me about", "explain", "information"]):
            return "health_information"
        
        # Check for implicit patient queries (e.g., "diabetic patients")
        if any(cond in query_lower for cond in self.condition_codes.keys()) and "patient" in query_lower:
            return "find_patients"
        
        return "general_inquiry"
    
    def _calculate_confidence_advanced(self, intent: str, entities: Dict, sentiment: Dict) -> float:
        """Enhanced confidence calculation with multiple factors."""
        score = 0.2  # Base score
        
        # Intent confidence
        if intent != "general_inquiry":
            score += 0.3
        if intent in ["emergency_query", "symptom_reporting"]:
            score += 0.1  # Higher confidence for clear medical intents
        
        # Entity-based confidence
        entity_weights = {
            "conditions": 0.15,
            "observations": 0.15,
            "medications": 0.12,
            "symptoms": 0.10,
            "ages": 0.08,
            "genders": 0.05,
            "names": 0.08,
            "patient_ids": 0.15,
            "body_parts": 0.07,
            "severity_indicators": 0.05
        }
        
        for entity_type, entity_list in entities.items():
            if entity_list and entity_type in entity_weights:
                score += entity_weights[entity_type]
        
        # Sentiment/urgency confidence boost
        if sentiment["urgency_score"] > 3:
            score += 0.05
        
        # Complexity adjustment
        complexity_score = self._assess_query_complexity(entities)
        if complexity_score > 0.7:
            score += 0.05
        
        return min(score, 1.0)
    
    def _assess_query_complexity(self, entities: Dict) -> float:
        """Assess the complexity of the query based on entities found."""
        total_entities = sum(len(entity_list) for entity_list in entities.values())
        unique_entity_types = sum(1 for entity_list in entities.values() if entity_list)
        
        # Normalize complexity score
        complexity = (total_entities * 0.1) + (unique_entity_types * 0.15)
        return min(complexity, 1.0)
    
    def _identify_medical_specialty(self, entities: Dict) -> str:
        """Identify the most likely medical specialty based on entities."""
        specialty_indicators = {
            "cardiology": ["heart", "blood pressure", "chest pain", "heart rate", "cholesterol"],
            "endocrinology": ["diabetes", "glucose", "insulin", "hormone"],
            "respiratory": ["asthma", "breathing", "lung", "cough", "oxygen"],
            "neurology": ["migraine", "headache", "brain", "seizure"],
            "psychiatry": ["depression", "anxiety", "mental health"],
            "orthopedics": ["arthritis", "bone", "joint", "back pain"],
            "general_medicine": ["fever", "weight", "general", "routine"]
        }
        
        # Check conditions and symptoms against specialty indicators
        all_terms = []
        for entity_list in entities.values():
            all_terms.extend([str(item).lower() for item in entity_list])
        
        specialty_scores = {}
        for specialty, indicators in specialty_indicators.items():
            score = sum(1 for term in all_terms if any(indicator in term for indicator in indicators))
            if score > 0:
                specialty_scores[specialty] = score
        
        if specialty_scores:
            return max(specialty_scores, key=specialty_scores.get)
        return "general_medicine"
    
    def _determine_intent(self, query: str) -> str:
        """Determine the primary intent of the query."""
        query_lower = query.lower()
        
        # Check for specific resource types and action words
        if any(word in query_lower for word in ["find", "show", "get", "list", "search"]):
            if "patient" in query_lower:
                return "find_patients"
            elif any(word in query_lower for word in ["condition", "diagnosis", "disease"]) or any(cond in query_lower for cond in self.condition_codes.keys()):
                return "find_conditions"
            elif any(word in query_lower for word in ["observation", "vital", "measurement"]) or any(obs in query_lower for obs in self.observation_codes.keys()):
                return "find_observations"
            elif any(word in query_lower for word in ["medication", "prescription", "drug"]):
                return "find_medications"
            elif "appointment" in query_lower:
                return "find_appointments"
        
        # Check for implicit patient queries (e.g., "diabetic patients")
        if any(cond in query_lower for cond in self.condition_codes.keys()) and "patient" in query_lower:
            return "find_patients"
        
        return "unknown"
    
    def _calculate_confidence(self, intent: str, entities: Dict) -> float:
        """Calculate confidence score based on extracted entities and intent."""
        score = 0.3  # Base score
        
        if intent != "unknown":
            score += 0.4
        
        # Add points for each type of entity found
        entity_bonus = {
            "conditions": 0.15,
            "observations": 0.15,
            "ages": 0.1,
            "genders": 0.05,
            "names": 0.1,
            "patient_ids": 0.2
        }
        
        for entity_type, entity_list in entities.items():
            if entity_list and entity_type in entity_bonus:
                score += entity_bonus[entity_type]
        
        return min(score, 1.0)
    def process_patient_query(self, query: str) -> Dict:
        """
        Comprehensive patient query processing with advanced NLP analysis.
        Returns structured output with detailed medical understanding.
        """
        # Get comprehensive NLP analysis
        nlp_analysis = self.extract_entities_and_intent(query)
        
        # Generate FHIR query
        fhir_query = self._convert_nlp_to_fhir(query, nlp_analysis)
        
        # Create comprehensive response
        response = {
            "original_query": query,
            "processed_timestamp": datetime.now().isoformat(),
            "nlp_analysis": nlp_analysis,
            "fhir_query": fhir_query,
            "clinical_interpretation": self._generate_clinical_interpretation(nlp_analysis),
            "recommendations": self._generate_recommendations(nlp_analysis),
            "data_requirements": self._identify_data_requirements(nlp_analysis)
        }
        
        return response
    
    def _generate_clinical_interpretation(self, nlp_analysis: Dict) -> Dict:
        """Generate clinical interpretation of the query."""
        entities = nlp_analysis["entities"]
        intent = nlp_analysis["intent"]
        sentiment = nlp_analysis["sentiment"]
        
        interpretation = {
            "primary_concern": self._identify_primary_concern(entities, intent),
            "urgency_assessment": sentiment["priority_level"],
            "patient_demographics": self._extract_demographics(entities),
            "clinical_context": self._determine_clinical_context(entities),
            "potential_diagnoses": self._suggest_potential_diagnoses(entities),
            "required_assessments": self._identify_required_assessments(entities)
        }
        
        return interpretation
    
    def _generate_recommendations(self, nlp_analysis: Dict) -> List[str]:
        """Generate recommendations based on the query analysis."""
        recommendations = []
        entities = nlp_analysis["entities"]
        sentiment = nlp_analysis["sentiment"]
        
        # Urgency-based recommendations
        if sentiment["urgency_score"] >= 5:
            recommendations.append("Immediate medical attention required - contact emergency services")
        elif sentiment["urgency_score"] >= 4:
            recommendations.append("Urgent care needed - schedule appointment within 24 hours")
        elif sentiment["urgency_score"] >= 3:
            recommendations.append("Medical evaluation recommended within 48-72 hours")
        
        # Condition-specific recommendations
        if "diabetes" in entities.get("conditions", []):
            recommendations.append("Monitor blood glucose levels regularly")
            recommendations.append("Review medication adherence and dietary habits")
        
        if "hypertension" in entities.get("conditions", []):
            recommendations.append("Regular blood pressure monitoring recommended")
            recommendations.append("Consider lifestyle modifications (diet, exercise)")
        
        # Symptom-based recommendations
        if any(symptom in ["pain", "ache"] for symptom in entities.get("symptoms", [])):
            recommendations.append("Document pain levels and triggers")
            recommendations.append("Consider pain management consultation if persistent")
        
        return recommendations
    
    def _identify_data_requirements(self, nlp_analysis: Dict) -> Dict:
        """Identify what additional data might be needed."""
        entities = nlp_analysis["entities"]
        intent = nlp_analysis["intent"]
        
        requirements = {
            "patient_identification": [],
            "clinical_data": [],
            "temporal_data": [],
            "additional_context": []
        }
        
        # Patient identification needs
        if not entities.get("patient_ids") and not entities.get("names"):
            requirements["patient_identification"].append("Patient identifier or name required")
        
        # Clinical data needs
        if entities.get("conditions") and not entities.get("observations"):
            requirements["clinical_data"].append("Recent vital signs and lab results")
        
        if entities.get("symptoms") and not entities.get("severity_indicators"):
            requirements["clinical_data"].append("Symptom severity and duration details")
        
        # Temporal data needs
        if not entities.get("time_periods") and intent in ["find_observations", "find_conditions"]:
            requirements["temporal_data"].append("Time frame for data retrieval")
        
        return requirements
    
    def _identify_primary_concern(self, entities: Dict, intent: str) -> str:
        """Identify the primary medical concern from the query."""
        if entities.get("conditions"):
            return f"Medical condition: {', '.join(entities['conditions'])}"
        elif entities.get("symptoms"):
            return f"Reported symptoms: {', '.join(entities['symptoms'])}"
        elif entities.get("observations"):
            return f"Clinical measurements: {', '.join(entities['observations'])}"
        elif intent == "emergency_query":
            return "Emergency medical situation"
        else:
            return "General healthcare inquiry"
    
    def _extract_demographics(self, entities: Dict) -> Dict:
        """Extract patient demographic information."""
        demographics = {}
        
        if entities.get("ages"):
            demographics["age"] = entities["ages"][0]
        if entities.get("genders"):
            demographics["gender"] = entities["genders"][0]
        if entities.get("names"):
            demographics["name"] = entities["names"][0]
        
        return demographics
    
    def _determine_clinical_context(self, entities: Dict) -> str:
        """Determine the clinical context of the query."""
        if entities.get("conditions"):
            return "Chronic disease management"
        elif entities.get("symptoms"):
            return "Acute symptom assessment"
        elif entities.get("observations"):
            return "Clinical monitoring"
        else:
            return "General healthcare"
    
    def _suggest_potential_diagnoses(self, entities: Dict) -> List[str]:
        """Suggest potential diagnoses based on symptoms and conditions."""
        diagnoses = []
        
        # Use existing conditions as confirmed diagnoses
        diagnoses.extend(entities.get("conditions", []))
        
        # Suggest diagnoses based on symptom patterns
        symptoms = entities.get("symptoms", [])
        if "chest pain" in symptoms or "chest" in entities.get("body_parts", []):
            diagnoses.extend(["Possible cardiac condition", "Musculoskeletal chest pain"])
        
        if "headache" in symptoms or "head" in entities.get("body_parts", []):
            diagnoses.extend(["Tension headache", "Migraine"])
        
        return list(set(diagnoses))  # Remove duplicates
    
    def _identify_required_assessments(self, entities: Dict) -> List[str]:
        """Identify required clinical assessments."""
        assessments = []
        
        conditions = entities.get("conditions", [])
        symptoms = entities.get("symptoms", [])
        
        if "diabetes" in conditions:
            assessments.extend(["HbA1c test", "Blood glucose monitoring", "Diabetic foot exam"])
        
        if "hypertension" in conditions:
            assessments.extend(["Blood pressure measurement", "Cardiovascular risk assessment"])
        
        if "pain" in symptoms:
            assessments.extend(["Pain assessment scale", "Physical examination"])
        
        return assessments
    
    def parse_natural_language(self, query: str) -> Dict:
        """
        Parse natural language query and convert to FHIR API request.
        Uses NLP analysis for enhanced processing.
        """
        # First, get NLP analysis
        nlp_analysis = self.extract_entities_and_intent(query)
        
        # Convert based on intent and entities
        return self._convert_nlp_to_fhir(query, nlp_analysis)
    
    def _convert_nlp_to_fhir(self, query: str, nlp_analysis: Dict) -> Dict:
        """Convert NLP analysis to FHIR query."""
        intent = nlp_analysis["intent"]
        entities = nlp_analysis["entities"]
        
        if intent == "find_patients":
            return self._build_patient_query_from_nlp(entities, query)
        elif intent == "find_conditions":
            return self._build_condition_query_from_nlp(entities, query)
        elif intent == "find_observations":
            return self._build_observation_query_from_nlp(entities, query)
        elif intent == "find_medications":
            return self._build_medication_query_from_nlp(entities, query)
        elif intent == "find_appointments":
            return self._build_appointment_query_from_nlp(entities, query)
        else:
            # Fallback to original parsing
            query_lower = query.lower().strip()
            
            # Patient queries
            if "patient" in query_lower:
                return self._parse_patient_query(query_lower)
            # Observation queries
            elif "observation" in query_lower or "vital" in query_lower or "blood pressure" in query_lower:
                return self._parse_observation_query(query_lower)
            # Condition queries
            elif "condition" in query_lower or "diagnosis" in query_lower or "disease" in query_lower:
                return self._parse_condition_query(query_lower)
            # Medication queries
            elif "medication" in query_lower or "drug" in query_lower or "prescription" in query_lower:
                return self._parse_medication_query(query_lower)
            # Appointment queries
            elif "appointment" in query_lower or "schedule" in query_lower:
                return self._parse_appointment_query(query_lower)
            else:
                return {
                    "error": "Unable to parse query. Supported resources: Patient, Observation, Condition, Medication, Appointment"
                }
    
    def _build_patient_query_from_nlp(self, entities: Dict, query: str) -> Dict:
        """Build patient query from NLP-extracted entities."""
        fhir_query = {
            "resource_type": "Patient",
            "method": "GET",
            "url": f"{self.base_url}/Patient",
            "parameters": {}
        }
        
        if entities["names"]:
            fhir_query["parameters"]["name"] = entities["names"][0]
        
        if entities["genders"]:
            fhir_query["parameters"]["gender"] = entities["genders"][0]
        
        if entities["ages"]:
            age = entities["ages"][0]
            birth_year = self._calculate_birth_year(age)
            # Handle "over X" queries
            if "over" in query.lower() or "above" in query.lower():
                fhir_query["parameters"]["birthdate"] = f"le{birth_year}"
            else:
                fhir_query["parameters"]["birthdate"] = f"ap{birth_year}"
        
        # Handle condition-based patient queries (e.g., "diabetic patients")
        if entities["conditions"]:
            condition = entities["conditions"][0]
            if condition in self.condition_codes:
                # Use FHIR _has parameter to find patients with specific conditions
                fhir_query["parameters"]["_has:Condition:patient:code"] = self.condition_codes[condition]["code"]
        
        return fhir_query
    
    def _build_condition_query_from_nlp(self, entities: Dict, query: str) -> Dict:
        """Build condition query from NLP-extracted entities."""
        fhir_query = {
            "resource_type": "Condition",
            "method": "GET",
            "url": f"{self.base_url}/Condition",
            "parameters": {}
        }
        
        if entities["patient_ids"]:
            fhir_query["parameters"]["subject"] = f"Patient/{entities['patient_ids'][0]}"
        
        if entities["conditions"]:
            condition = entities["conditions"][0]
            if condition in self.condition_codes:
                fhir_query["parameters"]["code"] = self.condition_codes[condition]["code"]
        
        # Extract clinical status
        if "active" in query.lower():
            fhir_query["parameters"]["clinical-status"] = "active"
        elif "resolved" in query.lower():
            fhir_query["parameters"]["clinical-status"] = "resolved"
        
        return fhir_query
    
    def _build_observation_query_from_nlp(self, entities: Dict, query: str) -> Dict:
        """Build observation query from NLP-extracted entities."""
        fhir_query = {
            "resource_type": "Observation",
            "method": "GET",
            "url": f"{self.base_url}/Observation",
            "parameters": {}
        }
        
        if entities["patient_ids"]:
            fhir_query["parameters"]["subject"] = f"Patient/{entities['patient_ids'][0]}"
        
        if entities["observations"]:
            obs_type = entities["observations"][0]
            if obs_type in self.observation_codes:
                fhir_query["parameters"]["code"] = self.observation_codes[obs_type]["code"]
        
        # Extract date range
        if "last" in query.lower():
            days_match = re.search(r'last\s+(\d+)\s+days?', query.lower())
            if days_match:
                days = int(days_match.group(1))
                date_from = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
                fhir_query["parameters"]["date"] = f"ge{date_from}"
        
        return fhir_query
    
    def _build_medication_query_from_nlp(self, entities: Dict, query: str) -> Dict:
        """Build medication query from NLP-extracted entities."""
        fhir_query = {
            "resource_type": "MedicationRequest",
            "method": "GET",
            "url": f"{self.base_url}/MedicationRequest",
            "parameters": {}
        }
        
        if entities["patient_ids"]:
            fhir_query["parameters"]["subject"] = f"Patient/{entities['patient_ids'][0]}"
        
        # Extract status
        if "active" in query.lower():
            fhir_query["parameters"]["status"] = "active"
        
        return fhir_query
    
    def _build_appointment_query_from_nlp(self, entities: Dict, query: str) -> Dict:
        """Build appointment query from NLP-extracted entities."""
        fhir_query = {
            "resource_type": "Appointment",
            "method": "GET",
            "url": f"{self.base_url}/Appointment",
            "parameters": {}
        }
        
        if entities["patient_ids"]:
            fhir_query["parameters"]["actor"] = f"Patient/{entities['patient_ids'][0]}"
        
        # Extract date range
        if "today" in query.lower():
            today = datetime.now().strftime('%Y-%m-%d')
            fhir_query["parameters"]["date"] = f"ge{today}&date=lt{today}T23:59:59"
        elif "next week" in query.lower():
            next_week = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
            fhir_query["parameters"]["date"] = f"ge{next_week}"
        
        # Extract status
        if "scheduled" in query.lower():
            fhir_query["parameters"]["status"] = "booked"
        
        return fhir_query
    
    def _parse_patient_query(self, query: str) -> Dict:
        """Parse patient-related queries."""
        
        # Extract name if present
        name_match = re.search(r'named?\s+([a-zA-Z\s]+)', query)
        name = name_match.group(1).strip() if name_match else None
        
        # Extract gender
        gender = None
        if "male" in query and "female" not in query:
            gender = "male"
        elif "female" in query:
            gender = "female"
        
        # Extract age range
        age_match = re.search(r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*years?\s*old', query)
        
        # Build FHIR query
        fhir_query = {
            "resource_type": "Patient",
            "method": "GET",
            "url": f"{self.base_url}/Patient",
            "parameters": {}
        }
        
        if name:
            fhir_query["parameters"]["name"] = name
        if gender:
            fhir_query["parameters"]["gender"] = gender
        if age_match:
            if age_match.group(2):  # Age range
                fhir_query["parameters"]["birthdate"] = f"ge{self._calculate_birth_year(int(age_match.group(2)))}&birthdate=le{self._calculate_birth_year(int(age_match.group(1)))}"
            else:  # Single age
                birth_year = self._calculate_birth_year(int(age_match.group(1)))
                fhir_query["parameters"]["birthdate"] = f"ap{birth_year}"
        
        return fhir_query
    
    def _parse_observation_query(self, query: str) -> Dict:
        """Parse observation-related queries."""
        
        fhir_query = {
            "resource_type": "Observation",
            "method": "GET",
            "url": f"{self.base_url}/Observation",
            "parameters": {}
        }
        
        # Extract patient reference
        patient_match = re.search(r'patient\s+([a-zA-Z0-9-]+)', query)
        if patient_match:
            fhir_query["parameters"]["subject"] = f"Patient/{patient_match.group(1)}"
        
        # Extract observation type
        if "blood pressure" in query:
            fhir_query["parameters"]["code"] = "85354-9"  # Blood pressure panel
        elif "temperature" in query:
            fhir_query["parameters"]["code"] = "8310-5"   # Body temperature
        elif "heart rate" in query or "pulse" in query:
            fhir_query["parameters"]["code"] = "8867-4"   # Heart rate
        elif "weight" in query:
            fhir_query["parameters"]["code"] = "29463-7"  # Body weight
        
        # Extract date range
        if "last" in query:
            days_match = re.search(r'last\s+(\d+)\s+days?', query)
            if days_match:
                days = int(days_match.group(1))
                date_from = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
                fhir_query["parameters"]["date"] = f"ge{date_from}"
        
        return fhir_query
    
    def _parse_condition_query(self, query: str) -> Dict:
        """Parse condition-related queries."""
        
        fhir_query = {
            "resource_type": "Condition",
            "method": "GET",
            "url": f"{self.base_url}/Condition",
            "parameters": {}
        }
        
        # Extract patient reference
        patient_match = re.search(r'patient\s+([a-zA-Z0-9-]+)', query)
        if patient_match:
            fhir_query["parameters"]["subject"] = f"Patient/{patient_match.group(1)}"
        
        # Extract condition type
        if "diabetes" in query:
            fhir_query["parameters"]["code"] = "73211009"  # Diabetes mellitus
        elif "hypertension" in query:
            fhir_query["parameters"]["code"] = "38341003"  # Hypertensive disorder
        elif "asthma" in query:
            fhir_query["parameters"]["code"] = "195967001" # Asthma
        
        # Extract clinical status
        if "active" in query:
            fhir_query["parameters"]["clinical-status"] = "active"
        elif "resolved" in query:
            fhir_query["parameters"]["clinical-status"] = "resolved"
        
        return fhir_query
    
    def _parse_medication_query(self, query: str) -> Dict:
        """Parse medication-related queries."""
        
        fhir_query = {
            "resource_type": "MedicationRequest",
            "method": "GET",
            "url": f"{self.base_url}/MedicationRequest",
            "parameters": {}
        }
        
        # Extract patient reference
        patient_match = re.search(r'patient\s+([a-zA-Z0-9-]+)', query)
        if patient_match:
            fhir_query["parameters"]["subject"] = f"Patient/{patient_match.group(1)}"
        
        # Extract medication name
        med_match = re.search(r'(?:medication|drug)\s+([a-zA-Z]+)', query)
        if med_match:
            fhir_query["parameters"]["code"] = med_match.group(1)
        
        # Extract status
        if "active" in query:
            fhir_query["parameters"]["status"] = "active"
        
        return fhir_query
    
    def _parse_appointment_query(self, query: str) -> Dict:
        """Parse appointment-related queries."""
        
        fhir_query = {
            "resource_type": "Appointment",
            "method": "GET",
            "url": f"{self.base_url}/Appointment",
            "parameters": {}
        }
        
        # Extract patient reference
        patient_match = re.search(r'patient\s+([a-zA-Z0-9-]+)', query)
        if patient_match:
            fhir_query["parameters"]["actor"] = f"Patient/{patient_match.group(1)}"
        
        # Extract date range
        if "today" in query:
            today = datetime.now().strftime('%Y-%m-%d')
            fhir_query["parameters"]["date"] = f"ge{today}&date=lt{today}T23:59:59"
        elif "next week" in query:
            next_week = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
            fhir_query["parameters"]["date"] = f"ge{next_week}"
        
        # Extract status
        if "scheduled" in query:
            fhir_query["parameters"]["status"] = "booked"
        
        return fhir_query
    
    def _calculate_birth_year(self, age: int) -> str:
        """Calculate birth year from age."""
        return str(datetime.now().year - age)
    
    def format_fhir_request(self, parsed_query: Dict) -> str:
        """Format the parsed query into a readable FHIR API request."""
        
        if "error" in parsed_query:
            return f"Error: {parsed_query['error']}"
        
        url = parsed_query["url"]
        params = parsed_query.get("parameters", {})
        
        if params:
            param_string = "&".join([f"{k}={v}" for k, v in params.items()])
            full_url = f"{url}?{param_string}"
        else:
            full_url = url
        
        return f"""
FHIR API Request:
Method: {parsed_query['method']}
Resource: {parsed_query['resource_type']}
URL: {full_url}
"""

def demonstrate_enhanced_fhir_service():
    """Demonstrate the enhanced FHIR Query Service with comprehensive NLP capabilities."""
    
    service = FHIRQueryService()
    
    # Enhanced example queries demonstrating various capabilities
    test_queries = [
        "I'm experiencing severe chest pain and difficulty breathing - this is urgent!",
        "Show me all diabetic patients over 50 with recent glucose measurements",
        "Find blood pressure observations for patient John Smith from last 30 days",
        "I have persistent headaches and feel dizzy, what should I do?",
        "Schedule an appointment for medication review - I'm taking insulin",
        "Get active diabetes conditions with moderate severity",
        "List all female patients named Sarah with heart disease",
        "My elderly father has been having trouble breathing lately",
        "Show recent cholesterol and glucose lab results for patient 123",
        "I need information about my hypertension medication dosage"
    ]
    
    print("🏥 Enhanced FHIR AI-Powered Healthcare Query Service")
    print("=" * 70)
    print(f"🧠 NLP Engine: {'spaCy Enhanced' if service.nlp else 'Regex Patterns (Fallback)'}")
    print(f"📊 Features: Entity Extraction, Sentiment Analysis, Confidence Scoring")
    print(f"🔍 Medical Specialties: Auto-detection and Clinical Interpretation")
    print("=" * 70)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📋 Example {i}:")
        print(f"Query: '{query}'")
        print("-" * 50)
        
        # Get comprehensive patient query processing
        comprehensive_analysis = service.process_patient_query(query)
        
        print("🧠 NLP Analysis:")
        nlp = comprehensive_analysis["nlp_analysis"]
        print(f"  Intent: {nlp['intent']}")
        print(f"  Confidence: {nlp['confidence']:.2f}")
        print(f"  Medical Specialty: {nlp['medical_specialty']}")
        print(f"  Query Complexity: {nlp['query_complexity']:.2f}")
        
        print(f"\n💭 Sentiment Analysis:")
        sentiment = nlp["sentiment"]
        print(f"  Priority Level: {sentiment['priority_level']}")
        print(f"  Urgency Score: {sentiment['urgency_score']}/5")
        if sentiment["emotional_indicators"]:
            print(f"  Indicators: {', '.join(sentiment['emotional_indicators'])}")
        
        print(f"\n🏷️ Extracted Entities:")
        entities = nlp["entities"]
        for entity_type, entity_list in entities.items():
            if entity_list:
                print(f"  {entity_type.title()}: {entity_list}")
        
        print(f"\n🩺 Clinical Interpretation:")
        clinical = comprehensive_analysis["clinical_interpretation"]
        print(f"  Primary Concern: {clinical['primary_concern']}")
        print(f"  Clinical Context: {clinical['clinical_context']}")
        if clinical["potential_diagnoses"]:
            print(f"  Potential Diagnoses: {', '.join(clinical['potential_diagnoses'])}")
        
        if comprehensive_analysis["recommendations"]:
            print(f"\n💡 Recommendations:")
            for rec in comprehensive_analysis["recommendations"][:3]:  # Show top 3
                print(f"  • {rec}")
        
        # Show FHIR query
        fhir_query = comprehensive_analysis["fhir_query"]
        if "error" not in fhir_query:
            formatted = service.format_fhir_request(fhir_query)
            print(f"\n🔗 Generated FHIR Query:")
            print(formatted.strip())
        
        print("\n" + "="*70)

def demonstrate_fhir_service():
    """Original demonstration function for backward compatibility."""
    
    service = FHIRQueryService()
    
    # Example queries with expected mappings
    test_queries = [
        "Show me all diabetic patients over 50",
        "Find blood pressure observations for patient 123 from last 30 days",
        "Get active diabetes conditions for patient 456",
        "List all female patients named Sarah",
        "Show heart rate measurements for patient 789"
    ]
    
    print("🏥 FHIR AI-Powered Natural Language Query Service")
    print("=" * 60)
    print(f"NLP Engine: {'spaCy' if service.nlp else 'Regex Patterns (Fallback)'}")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📋 Example {i}:")
        print(f"Input: '{query}'")
        print("-" * 40)
        
        # Get NLP analysis
        nlp_analysis = service.extract_entities_and_intent(query)
        
        print("🧠 NLP Analysis:")
        print(f"  Intent: {nlp_analysis['intent']}")
        print(f"  Confidence: {nlp_analysis['confidence']:.2f}")
        print(f"  Method: {nlp_analysis['nlp_method']}")
        print(f"  Entities: {nlp_analysis['entities']}")
        
        # Parse to FHIR query
        parsed = service.parse_natural_language(query)
        formatted = service.format_fhir_request(parsed)
        
        print("\n🔗 FHIR API Request:")
        print(formatted)
        
        print("\n" + "="*60)

def main():
    """Main function to demonstrate the FHIR Query Service."""
    
    service = FHIRQueryService()
    
    # Quick example queries for basic testing
    example_queries = [
        "Find all patients named John Smith",
        "Get blood pressure observations for patient 123 from last 30 days", 
        "Show active diabetes conditions for patient 456",
        "List all medications for patient 789",
        "Find scheduled appointments for patient 101 today"
    ]
    
    print("FHIR Natural Language Query Service")
    print("=" * 50)
    
    for i, query in enumerate(example_queries, 1):
        print(f"\nExample {i}:")
        print(f"Input: {query}")
        
        parsed = service.parse_natural_language(query)
        formatted = service.format_fhir_request(parsed)
        
        print(formatted)
        print("-" * 30)

if __name__ == "__main__":
    # Run the enhanced demonstration showcasing comprehensive NLP capabilities
    demonstrate_enhanced_fhir_service()