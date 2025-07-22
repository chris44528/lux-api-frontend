import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Phone,
  Home,
  Copy,
} from 'lucide-react';

interface ValidationCheck {
  passed: boolean;
  severity: 'error' | 'warning' | 'ok';
  message: string;
  [key: string]: any;
}

interface ValidationData {
  overall_score: number;
  is_valid: boolean;
  checks: {
    [key: string]: ValidationCheck;
  };
  issues: string[];
  warnings: string[];
  timestamp: string;
}

interface ValidationReportProps {
  validation: ValidationData;
}

export default function ValidationReport({ validation }: ValidationReportProps) {
  const getCheckIcon = (check: ValidationCheck) => {
    if (check.passed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (check.severity === 'error') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-orange-600" />;
  };

  const getCheckBadge = (check: ValidationCheck) => {
    if (check.passed) {
      return <Badge variant="success">Passed</Badge>;
    }
    if (check.severity === 'error') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="warning">Warning</Badge>;
  };

  const checkDetails = {
    completeness: {
      title: 'Form Completeness',
      icon: FileText,
      description: 'Verifies all required fields are filled',
    },
    name_consistency: {
      title: 'Name Consistency',
      icon: User,
      description: 'Checks for consistency in proprietor names',
    },
    address_match: {
      title: 'Address Verification',
      icon: Home,
      description: 'Compares provided address with site records',
    },
    date_validity: {
      title: 'Date Validation',
      icon: Calendar,
      description: 'Ensures sale date is valid and reasonable',
    },
    contact_validity: {
      title: 'Contact Information',
      icon: Phone,
      description: 'Validates email and phone number formats',
    },
    document_check: {
      title: 'Document Upload',
      icon: FileText,
      description: 'Checks for required supporting documents',
    },
    duplicate_check: {
      title: 'Duplicate Check',
      icon: Copy,
      description: 'Searches for duplicate submissions',
    },
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={validation.is_valid ? 'border-green-500' : 'border-orange-500'}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Validation Summary</span>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                validation.is_valid ? 'text-green-600' : 'text-orange-600'
              }`}>
                {validation.overall_score.toFixed(0)}%
              </div>
              <Badge variant={validation.is_valid ? 'success' : 'warning'}>
                {validation.is_valid ? 'Valid' : 'Needs Review'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={validation.overall_score} 
            className="h-3"
          />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(validation.checks).filter(c => c.passed).length}
              </p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {validation.warnings.length}
              </p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {validation.issues.length}
              </p>
              <p className="text-sm text-muted-foreground">Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Checks */}
      <div className="grid gap-4">
        {Object.entries(validation.checks).map(([key, check]) => {
          const detail = checkDetails[key as keyof typeof checkDetails];
          if (!detail) return null;

          const Icon = detail.icon;

          return (
            <Card key={key} className={check.passed ? '' : 'border-orange-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      check.passed ? 'bg-green-100' : 
                      check.severity === 'error' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        check.passed ? 'text-green-600' : 
                        check.severity === 'error' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{detail.title}</h3>
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCheckIcon(check)}
                    {getCheckBadge(check)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${
                  check.passed ? 'text-green-600' : 
                  check.severity === 'error' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {check.message}
                </p>

                {/* Additional details for specific checks */}
                {key === 'completeness' && check.missing_fields && check.missing_fields.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                    {check.missing_fields.map((field: string) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                )}

                {key === 'address_match' && check.similarity_score !== undefined && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Similarity score: {(check.similarity_score * 100).toFixed(0)}%</p>
                    {check.postcode_match !== undefined && (
                      <p>Postcode match: {check.postcode_match ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                )}

                {key === 'duplicate_check' && check.duplicate_count > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Found {check.duplicate_count} potential duplicate(s)
                  </p>
                )}

                {key === 'document_check' && check.document_count !== undefined && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Documents uploaded: {check.document_count}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Issues and Warnings Summary */}
      {(validation.issues.length > 0 || validation.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Summary of Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.issues.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Critical Issues</h4>
                <ul className="space-y-1">
                  {validation.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-600 mb-2">Warnings</h4>
                <ul className="space-y-1">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}