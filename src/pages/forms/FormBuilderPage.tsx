import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import engineerService from '../../services/engineerService';
import FormBuilder from '../../components/forms/builder/FormBuilder';

interface FormBuilderPageProps {
  isIssueReport?: boolean;
}

const FormBuilderPage: React.FC<FormBuilderPageProps> = ({ isIssueReport }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formId } = useParams();
  
  // Get initial data from location state (for new forms)
  const locationState = location.state as any;

  // Fetch existing template if editing
  const { data: template, isLoading } = useQuery(
    ['formTemplate', formId],
    () => engineerService.getFormTemplate(formId!),
    {
      enabled: !!formId
    }
  );

  const handleSave = (savedTemplate: any) => {
    // If this is a new form with specific type, render it immediately
    if (locationState?.formType) {
      navigate('/engineer/forms/render', {
        state: {
          template: savedTemplate,
          ...locationState
        }
      });
    } else {
      // Otherwise go back to forms list
      navigate('/engineer/forms');
    }
  };

  if (formId && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form template...</p>
        </div>
      </div>
    );
  }

  return (
    <FormBuilder
      onSave={handleSave}
      initialTemplate={template}
      isIssueReport={isIssueReport}
    />
  );
};

export default FormBuilderPage;