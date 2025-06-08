'use client';

import { useState, useMemo } from 'react';
import { FHIRPatient } from '@/types/fhir';
import { formatDate, cn } from '@/lib/utils';
import { ChevronUpIcon, ChevronDownIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface PatientTableProps {
  patients: FHIRPatient[];
  className?: string;
  onPatientSelect?: (patient: FHIRPatient) => void;
  selectedPatientId?: string;
}

type SortField = 'name' | 'age' | 'gender' | 'birthDate' | 'conditions';
type SortDirection = 'asc' | 'desc';

export default function PatientTable({ 
  patients, 
  className, 
  onPatientSelect,
  selectedPatientId 
}: PatientTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredPatients = useMemo(() => {
    let filtered = patients;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(term) ||
        patient.gender.toLowerCase().includes(term) ||
        patient.conditions.some(condition => condition.toLowerCase().includes(term)) ||
        patient.id.toLowerCase().includes(term)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'age':
          aVal = a.age;
          bVal = b.age;
          break;
        case 'gender':
          aVal = a.gender;
          bVal = b.gender;
          break;
        case 'birthDate':
          aVal = new Date(a.birthDate).getTime();
          bVal = new Date(b.birthDate).getTime();
          break;
        case 'conditions':
          aVal = a.conditions.length;
          bVal = b.conditions.length;
          break;
        default:
          return 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [patients, sortField, sortDirection, searchTerm]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />;
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      default:
        return '⬥';
    }
  };

  const getConditionBadgeColor = (condition: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[condition.length % colors.length];
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200", className)}>
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Patient Data ({sortedAndFilteredPatients.length} patients)
          </h3>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-1">
                  Age
                  <SortIcon field="age" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('gender')}
              >
                <div className="flex items-center gap-1">
                  Gender
                  <SortIcon field="gender" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('birthDate')}
              >
                <div className="flex items-center gap-1">
                  Birth Date
                  <SortIcon field="birthDate" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('conditions')}
              >
                <div className="flex items-center gap-1">
                  Conditions
                  <SortIcon field="conditions" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredPatients.map((patient) => (
              <tr 
                key={patient.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors cursor-pointer",
                  selectedPatientId === patient.id && "bg-blue-50 border-l-4 border-l-blue-500"
                )}
                onClick={() => onPatientSelect?.(patient)}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {patient.age}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-lg">{getGenderIcon(patient.gender)}</span>
                    <span className="capitalize">{patient.gender}</span>
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {formatDate(patient.birthDate)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.slice(0, 3).map((condition, index) => (
                      <span
                        key={index}
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          getConditionBadgeColor(condition)
                        )}
                      >
                        {condition}
                      </span>
                    ))}
                    {patient.conditions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{patient.conditions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPatientSelect?.(patient);
                    }}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedAndFilteredPatients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No patients found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
