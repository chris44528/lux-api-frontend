import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  X,
  Home,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
} from "lucide-react";
import transferService, { PublicTransferData } from '@/services/transferService';
import { format } from 'date-fns';

interface DocumentUpload {
  id: string;
  file: File | null;
  type: string;
}

export default function PublicTransferForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  
  const [formData, setFormData] = useState<PublicTransferData>({
    sale_completion_date: '',
    legal_proprietor_1: '',
    legal_proprietor_2: '',
    legal_proprietor_3: '',
    phone_number: '',
    mobile_number: '',
    form_email: '',
    postal_address: '',
    evidence_document_type: '',
  });
  
  // Multiple document state
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: '1', file: null, type: '' }
  ]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);
      const response = await transferService.validateToken(token!);
      
      if (response.valid) {
        setIsValid(true);
        setSiteName(response.site_name || '');
        setSiteAddress(response.site_address || '');
        if (response.transfer) {
          setFormData(prev => ({ ...prev, ...response.transfer }));
        }
      } else {
        setIsValid(false);
        setErrorMessage(response.message || 'Invalid token');
        setContactEmail(response.contact_email || 'noreply@ashadegreener.co.uk');
      }
    } catch (error: any) {
      setIsValid(false);
      setErrorMessage('Unable to validate form. Please try again later.');
      setContactEmail('noreply@ashadegreener.co.uk');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PublicTransferData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const docId = documents[index].id;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors(prev => ({...prev, [docId]: 'File size must be less than 10MB'}));
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadErrors(prev => ({...prev, [docId]: 'Please upload a PDF, image (JPG/PNG), or Word document'}));
      return;
    }
    
    // Clear any previous errors for this document
    setUploadErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[docId];
      return newErrors;
    });
    
    // Update the document
    const newDocs = [...documents];
    newDocs[index] = {...newDocs[index], file};
    setDocuments(newDocs);
  };

  const handleDocumentTypeChange = (index: number, type: string) => {
    const newDocs = [...documents];
    newDocs[index] = {...newDocs[index], type};
    setDocuments(newDocs);
  };

  const addDocument = () => {
    if (documents.length < 6) {
      setDocuments([...documents, {
        id: Date.now().toString(),
        file: null,
        type: ''
      }]);
    }
  };

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      const docId = documents[index].id;
      const newDocs = documents.filter((_, i) => i !== index);
      setDocuments(newDocs);
      
      // Remove any associated errors
      setUploadErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[docId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) {
      return;
    }
    
    // Basic validation
    if (!formData.legal_proprietor_1) {
      toast({
        title: "Validation Error",
        description: "At least one legal proprietor is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.phone_number && !formData.mobile_number) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one contact number",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Upload documents first if provided
      const validDocs = documents.filter(doc => doc.file && doc.type);
      if (validDocs.length > 0) {
        setUploadProgress(30);
        for (let i = 0; i < validDocs.length; i++) {
          await transferService.uploadDocument(token!, validDocs[i].file!);
          setUploadProgress(30 + (30 * (i + 1) / validDocs.length));
        }
      }
      
      // Submit form data with the first document type (for backward compatibility)
      const submitData = {
        ...formData,
        evidence_document_type: documents[0]?.type || '',
      };
      setUploadProgress(80);
      await transferService.submitForm(token!, submitData);
      setUploadProgress(100);
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your transfer form has been submitted successfully.",
      });
      
      // Reset form
      setFormData({
        sale_completion_date: '',
        legal_proprietor_1: '',
        legal_proprietor_2: '',
        legal_proprietor_3: '',
        phone_number: '',
        mobile_number: '',
        form_email: '',
        postal_address: '',
        evidence_document_type: '',
      });
      setDocuments([{ id: '1', file: null, type: '' }]);
      setUploadErrors({});
      
      // Navigate to success page after a delay
      setTimeout(() => {
        navigate('/transfer/success');
      }, 3000);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.detail || "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Form Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Access Form</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                If you need assistance, please contact:
              </p>
              <a 
                href={`mailto:${contactEmail}`} 
                className="text-blue-600 hover:underline font-medium"
              >
                {contactEmail}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Home Owner Transfer Form
          </h1>
          <p className="text-gray-600">
            Please complete this form to transfer ownership of your solar PV system
          </p>
        </div>

        {/* Property Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Property Name:</span> {siteName}
              </div>
              <div>
                <span className="font-medium">Address:</span> {siteAddress}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                New Owner Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sale Completion Date */}
              <div>
                <Label htmlFor="sale_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sale Completion Date *
                </Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_completion_date}
                  onChange={(e) => handleInputChange('sale_completion_date', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Legal Proprietors */}
              <div className="space-y-3">
                <Label>Legal Proprietor(s) *</Label>
                <p className="text-sm text-gray-600">
                  Please enter the name(s) of all legal proprietors as shown on the title deed
                </p>
                <Input
                  placeholder="Legal Proprietor 1 (Required)"
                  value={formData.legal_proprietor_1}
                  onChange={(e) => handleInputChange('legal_proprietor_1', e.target.value)}
                  required
                />
                <Input
                  placeholder="Legal Proprietor 2 (Optional)"
                  value={formData.legal_proprietor_2}
                  onChange={(e) => handleInputChange('legal_proprietor_2', e.target.value)}
                />
                <Input
                  placeholder="Legal Proprietor 3 (Optional)"
                  value={formData.legal_proprietor_3}
                  onChange={(e) => handleInputChange('legal_proprietor_3', e.target.value)}
                />
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g., 01234 567890"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="e.g., 07123 456789"
                    value={formData.mobile_number}
                    onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Please provide at least one contact number
              </p>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.form_email}
                  onChange={(e) => handleInputChange('form_email', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Postal Address */}
              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Postal Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full postal address"
                  value={formData.postal_address}
                  onChange={(e) => handleInputChange('postal_address', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidence of Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc, index) => (
                <div key={doc.id} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Document {index + 1}</h4>
                    {documents.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor={`evidence_type_${index}`}>Document Type</Label>
                    <Select
                      value={doc.type}
                      onValueChange={(value) => handleDocumentTypeChange(index, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr1_form">TR1 Form</SelectItem>
                        <SelectItem value="title_deed">Title Deed</SelectItem>
                        <SelectItem value="solicitor_letter">Solicitor Letter</SelectItem>
                        <SelectItem value="land_registry">Land Registry Document</SelectItem>
                        <SelectItem value="completion_statement">Completion Statement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {doc.type && (
                    <div>
                      <Label htmlFor={`file_${index}`}>Upload Document</Label>
                      <div className="mt-1">
                        <Input
                          id={`file_${index}`}
                          type="file"
                          onChange={(e) => handleFileSelect(index, e)}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="cursor-pointer"
                        />
                      </div>
                      {uploadErrors[doc.id] && (
                        <p className="text-sm text-red-600 mt-1">{uploadErrors[doc.id]}</p>
                      )}
                      {doc.file && !uploadErrors[doc.id] && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {doc.file.name} ready to upload
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <p className="text-sm text-gray-600">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
              </p>
              
              {documents.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDocument}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Document
                </Button>
              )}
              
              {documents.length >= 6 && (
                <p className="text-sm text-gray-500 text-center">
                  Maximum of 6 documents allowed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className={`min-w-[150px] ${submitting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              onClick={(e) => {
                if (submitting) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {submitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Submitting... {uploadProgress > 0 && `(${uploadProgress}%)`}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            By submitting this form, you confirm that the information provided is accurate
            and that you are the legal owner of the property.
          </p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:noreply@ashadegreener.co.uk" className="text-blue-600 hover:underline">
              noreply@ashadegreener.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}