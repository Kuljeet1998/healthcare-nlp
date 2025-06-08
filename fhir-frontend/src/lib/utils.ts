import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'emergency':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'urgent':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'routine':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'severe':
      return 'text-red-600 bg-red-100';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-100';
    case 'mild':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateMockPatientId(): string {
  return `patient-${Math.random().toString(36).substr(2, 9)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseQueryForSuggestions(query: string): string[] {
  const keywords = query.toLowerCase().split(/\s+/);
  const medicalTerms = [
    'diabetes', 'hypertension', 'asthma', 'heart disease', 'cancer',
    'depression', 'anxiety', 'migraine', 'arthritis', 'pneumonia',
    'blood pressure', 'glucose', 'cholesterol', 'temperature', 'weight',
    'patient', 'condition', 'medication', 'observation', 'vital signs'
  ];
  
  return medicalTerms.filter(term => 
    keywords.some(keyword => term.includes(keyword) || keyword.includes(term))
  );
}
