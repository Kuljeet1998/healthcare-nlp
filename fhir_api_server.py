#!/usr/bin/env python3
"""
FHIR Query API Server
Flask-based REST API server that wraps the FHIR Query Service
for communication with the React frontend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import traceback
from datetime import datetime
import uuid
import random

# Import our FHIR Query Service
from fhir_query_service import FHIRQueryService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize the FHIR service
fhir_service = FHIRQueryService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "FHIR Query API",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/api/query', methods=['POST'])
def process_query():
    """Process natural language query and return FHIR results"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' parameter"}), 400
        
        query = data['query']
        logger.info(f"Processing query: {query}")
        
        # Process the query using our FHIR service
        result = fhir_service.process_patient_query(query)
        
        # Format response for frontend compatibility
        response = {
            "success": True,
            "query": query,
            "nlp_analysis": {
                "intent": result.get('nlp_analysis', {}).get('intent', 'unknown'),
                "entities": result.get('nlp_analysis', {}).get('entities', {}),
                "confidence": result.get('nlp_analysis', {}).get('confidence', 0.8),
                "sentiment": {
                    "urgency_score": result.get('nlp_analysis', {}).get('sentiment', {}).get('urgency_score', 0.3),
                    "polarity": result.get('nlp_analysis', {}).get('sentiment', {}).get('polarity', 'neutral')
                }
            },
            "fhir_query": result.get('fhir_query', {}),
            "formatted_url": result.get('formatted_url', ''),
            "clinical_interpretation": {
                "summary": f"Query analysis for: {query}",
                "urgency_level": determine_urgency_level(result),
                "priority_level": determine_priority_level(result),
                "recommendations": generate_recommendations(result)
            },
            "simulated_results": generate_simulated_results(result, query)
        }
        
        logger.info(f"Query processed successfully: {query}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

def determine_urgency_level(fhir_result):
    """Determine urgency level based on NLP analysis"""
    urgency_keywords = ['emergency', 'urgent', 'critical', 'severe']
    nlp_analysis = fhir_result.get('nlp_analysis', {})
    entities = nlp_analysis.get('entities', {})
    
    # Check for urgency keywords in entities
    for entity_type, entity_list in entities.items():
        if isinstance(entity_list, list):
            for entity in entity_list:
                if any(keyword in str(entity).lower() for keyword in urgency_keywords):
                    return 'high'
    
    return 'medium'

def determine_priority_level(fhir_result):
    """Determine priority level based on query complexity"""
    fhir_query = fhir_result.get('fhir_query', {})
    
    # More complex queries get higher priority
    if len(fhir_query) > 3:
        return 'high'
    elif len(fhir_query) > 1:
        return 'medium'
    else:
        return 'low'

def generate_recommendations(fhir_result):
    """Generate clinical recommendations based on query analysis"""
    recommendations = []
    nlp_analysis = fhir_result.get('nlp_analysis', {})
    entities = nlp_analysis.get('entities', {})
    
    # Generate recommendations based on entities
    if 'conditions' in entities:
        recommendations.append("Consider reviewing recent lab results and vital signs")
        recommendations.append("Monitor patient for symptom progression")
    
    if 'medications' in entities:
        recommendations.append("Check for drug interactions and allergies")
        recommendations.append("Verify medication dosage and administration schedule")
    
    if 'observations' in entities:
        recommendations.append("Compare with historical trends and normal ranges")
        recommendations.append("Consider additional diagnostic tests if abnormal")
    
    # Default recommendations if none generated
    if not recommendations:
        recommendations = [
            "Review complete patient history",
            "Consider consultation with specialist if needed",
            "Follow up with patient within appropriate timeframe"
        ]
    
    return recommendations

def generate_simulated_results(fhir_result, original_query):
    """Generate simulated FHIR results based on the query analysis"""
    nlp_analysis = fhir_result.get('nlp_analysis', {})
    entities = nlp_analysis.get('entities', {})
    
    # Extract relevant information
    conditions = entities.get('conditions', [])
    ages = entities.get('ages', [])
    genders = entities.get('genders', [])
    medications = entities.get('medications', [])
    
    # Generate mock patients
    patients = []
    patient_count = random.randint(3, 8)
    
    # Sample names for mock patients
    sample_names = [
        "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis",
        "David Wilson", "Jessica Garcia", "Robert Miller", "Ashley Rodriguez",
        "Christopher Martinez", "Amanda Anderson", "Matthew Taylor", "Jennifer Thomas"
    ]
    
    for i in range(patient_count):
        patient_id = f"patient-{uuid.uuid4().hex[:8]}"
        
        # Determine patient characteristics
        patient_age = ages[0] + random.randint(-10, 10) if ages else random.randint(25, 75)
        patient_gender = random.choice(genders) if genders else random.choice(['male', 'female'])
        patient_conditions = conditions if conditions else ['hypertension', 'diabetes']
        
        patient = {
            "id": patient_id,
            "name": random.choice(sample_names),
            "age": max(18, patient_age),
            "gender": patient_gender,
            "birthDate": f"{2024 - patient_age}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "conditions": patient_conditions[:2],  # Limit to 2 conditions
            "medications": medications[:3] if medications else ["aspirin", "lisinopril"],
            "lastVisit": f"2024-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "mrn": f"MRN{random.randint(100000, 999999)}",
            "status": random.choice(["active", "inactive"]),
            "contactInfo": {
                "phone": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                "email": f"patient{i+1}@example.com"
            }
        }
        patients.append(patient)
    
    # Generate chart data for visualizations
    chart_data = []
    
    # Age distribution
    age_groups = {'18-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '75+': 0}
    for patient in patients:
        age = patient['age']
        if age <= 30:
            age_groups['18-30'] += 1
        elif age <= 45:
            age_groups['31-45'] += 1
        elif age <= 60:
            age_groups['46-60'] += 1
        elif age <= 75:
            age_groups['61-75'] += 1
        else:
            age_groups['75+'] += 1
    
    for age_group, count in age_groups.items():
        if count > 0:
            chart_data.append({
                "name": age_group,
                "value": count,
                "color": f"#{''.join([hex(hash(age_group + str(i)))[-1] for i in range(6)])}"
            })
    
    # Gender distribution
    gender_counts = {'male': 0, 'female': 0}
    for patient in patients:
        gender_counts[patient['gender']] += 1
    
    gender_chart_data = []
    for gender, count in gender_counts.items():
        if count > 0:
            gender_chart_data.append({
                "name": gender.title(),
                "value": count,
                "color": "#3B82F6" if gender == 'male' else "#EF4444"
            })
    
    # Condition distribution
    condition_counts = {}
    for patient in patients:
        for condition in patient['conditions']:
            condition_counts[condition] = condition_counts.get(condition, 0) + 1
    
    condition_chart_data = []
    colors = ['#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']
    for i, (condition, count) in enumerate(condition_counts.items()):
        condition_chart_data.append({
            "name": condition.title(),
            "value": count,
            "color": colors[i % len(colors)]
        })
    
    return {
        "patients": patients,
        "totalCount": len(patients),
        "chartData": {
            "ageDistribution": chart_data,
            "genderDistribution": gender_chart_data,
            "conditionDistribution": condition_chart_data
        },
        "summary": {
            "avgAge": sum(p["age"] for p in patients) / len(patients) if patients else 0,
            "genderDistribution": gender_counts,
            "totalConditions": len(condition_counts),
            "activePatients": len([p for p in patients if p["status"] == "active"])
        },
        "queryInfo": {
            "originalQuery": original_query,
            "processedAt": datetime.now().isoformat(),
            "resultsGenerated": len(patients)
        }
    }

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    """Get autocomplete suggestions for queries"""
    suggestions = [
        "Show me all diabetic patients over 50",
        "Find blood pressure observations for recent patients",
        "Get active diabetes conditions",
        "List all female patients with hypertension",
        "Show heart rate measurements from last month",
        "Find patients with chest pain symptoms",
        "Get medication list for diabetes patients",
        "Show recent emergency room visits",
        "Find patients with abnormal lab results",
        "List hypertensive patients on ACE inhibitors",
        "Show pediatric patients with asthma",
        "Get cardiac patients over 65",
        "Find patients with depression diagnosis",
        "Show pregnant patients due this month",
        "Get patients with chronic kidney disease"
    ]
    
    # Optional: filter suggestions based on query parameter
    query = request.args.get('q', '').lower()
    if query:
        filtered_suggestions = [s for s in suggestions if query in s.lower()]
        return jsonify({"suggestions": filtered_suggestions[:10]})
    
    return jsonify({"suggestions": suggestions})

@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient_details(patient_id):
    """Get detailed information for a specific patient"""
    # This would typically query a real database
    # For now, return mock detailed patient data
    
    patient_details = {
        "id": patient_id,
        "name": "John Doe",
        "age": 45,
        "gender": "male",
        "birthDate": "1979-03-15",
        "mrn": f"MRN{random.randint(100000, 999999)}",
        "conditions": ["Type 2 Diabetes", "Hypertension"],
        "medications": [
            {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily"},
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"}
        ],
        "vitalSigns": {
            "bloodPressure": "140/90 mmHg",
            "heartRate": "72 bpm",
            "temperature": "98.6°F",
            "weight": "180 lbs",
            "height": "5'10\""
        },
        "recentVisits": [
            {
                "date": "2024-05-15",
                "type": "Regular Checkup",
                "provider": "Dr. Smith",
                "notes": "Blood pressure elevated, medication adjusted"
            },
            {
                "date": "2024-03-10",
                "type": "Lab Work",
                "provider": "Dr. Johnson",
                "notes": "HbA1c levels within target range"
            }
        ],
        "allergies": ["Penicillin", "Shellfish"],
        "emergencyContact": {
            "name": "Jane Doe",
            "relationship": "Spouse",
            "phone": "(555) 123-4567"
        }
    }
    
    return jsonify(patient_details)

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🏥 Starting FHIR Query API Server...")
    print("📡 Frontend can connect to: http://localhost:5001")
    print("🔍 Available endpoints:")
    print("   - GET  /api/health")
    print("   - POST /api/query")
    print("   - GET  /api/suggestions")
    print("   - GET  /api/patients/<patient_id>")
    print("🚀 Server starting...")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
