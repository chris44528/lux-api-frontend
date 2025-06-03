import React, { useState } from 'react';
import { FormElement, FormSettings } from './FormBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import FormRenderer from '../renderer/FormRenderer';

interface FormPreviewProps {
  formSettings: FormSettings;
  elements: FormElement[];
  onClose: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formSettings,
  elements,
  onClose
}) => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted with data:', data);
    alert('Form submitted successfully! (Preview mode)');
  };

  const getDeviceClasses = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
        return 'max-w-4xl mx-auto';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">Device:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={device === 'mobile' ? 'default' : 'outline'}
                onClick={() => setDevice('mobile')}
              >
                📱 Mobile
              </Button>
              <Button
                size="sm"
                variant={device === 'tablet' ? 'default' : 'outline'}
                onClick={() => setDevice('tablet')}
              >
                📱 Tablet
              </Button>
              <Button
                size="sm"
                variant={device === 'desktop' ? 'default' : 'outline'}
                onClick={() => setDevice('desktop')}
              >
                💻 Desktop
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4">
          <div className={getDeviceClasses()}>
            <Card>
              <CardContent className="p-0">
                <FormRenderer
                  formSettings={formSettings}
                  elements={elements}
                  onSubmit={handleSubmit}
                  initialData={formData}
                  isPreview={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormPreview;