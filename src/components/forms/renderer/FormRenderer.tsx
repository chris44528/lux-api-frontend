import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormElement, FormSettings } from '../builder/FormBuilder';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';
import { useGeolocation } from '../../../hooks/useGeolocation';
import PhotoCapture from './PhotoCapture';
import SignatureCapture from './SignatureCapture';

interface FormRendererProps {
  formSettings: FormSettings;
  elements: FormElement[];
  onSubmit: (data: any) => void | Promise<void>;
  initialData?: Record<string, any>;
  isPreview?: boolean;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  formSettings,
  elements,
  onSubmit,
  initialData = {},
  isPreview = false
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initialData
  });
  
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set(elements.map(el => el.id)));
  
  const { location, error: locationError, getCurrentPosition } = useGeolocation();
  
  const watchedValues = watch();

  // Handle conditional logic
  useEffect(() => {
    const newVisibleElements = new Set<string>();
    
    elements.forEach(element => {
      if (!element.conditionalLogic?.enabled) {
        newVisibleElements.add(element.id);
        return;
      }
      
      const { conditions, action } = element.conditionalLogic;
      let conditionsMet = true;
      
      for (const condition of conditions) {
        const fieldValue = watchedValues[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            conditionsMet = fieldValue === condition.value;
            break;
          case 'not_equals':
            conditionsMet = fieldValue !== condition.value;
            break;
          case 'contains':
            conditionsMet = fieldValue?.includes(condition.value);
            break;
          case 'not_contains':
            conditionsMet = !fieldValue?.includes(condition.value);
            break;
          case 'greater_than':
            conditionsMet = Number(fieldValue) > Number(condition.value);
            break;
          case 'less_than':
            conditionsMet = Number(fieldValue) < Number(condition.value);
            break;
          case 'is_empty':
            conditionsMet = !fieldValue || fieldValue === '';
            break;
          case 'is_not_empty':
            conditionsMet = !!fieldValue && fieldValue !== '';
            break;
        }
        
        if (!conditionsMet) break;
      }
      
      if ((action === 'show' && conditionsMet) || (action === 'hide' && !conditionsMet)) {
        newVisibleElements.add(element.id);
      }
    });
    
    setVisibleElements(newVisibleElements);
  }, [watchedValues, elements]);

  const handleFormSubmit = async (data: any) => {
    // Add photos and signatures
    Object.entries(photos).forEach(([fieldName, photo]) => {
      data[fieldName] = photo;
    });
    
    Object.entries(signatures).forEach(([fieldName, signature]) => {
      data[fieldName] = signature;
    });
    
    // Add GPS location if required
    if (formSettings.require_gps_location) {
      if (!location) {
        await getCurrentPosition();
      }
      data._gps_location = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      } : null;
    }
    
    // Add metadata
    data._form_metadata = {
      form_name: formSettings.name,
      form_type: formSettings.form_type,
      submitted_at: new Date().toISOString(),
      is_offline: !navigator.onLine
    };
    
    await onSubmit(data);
  };

  const renderElement = (element: FormElement) => {
    if (!visibleElements.has(element.id)) return null;
    
    const fieldError = errors[element.name];
    
    switch (element.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={element.type}
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false,
                pattern: element.validation?.pattern ? {
                  value: new RegExp(element.validation.pattern),
                  message: 'Invalid format'
                } : undefined,
                minLength: element.validation?.min_length ? {
                  value: element.validation.min_length,
                  message: `Minimum ${element.validation.min_length} characters`
                } : undefined,
                maxLength: element.validation?.max_length ? {
                  value: element.validation.max_length,
                  message: `Maximum ${element.validation.max_length} characters`
                } : undefined
              })}
              placeholder={element.placeholder}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'number':
      case 'meter_reading':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false,
                valueAsNumber: true,
                min: element.validation?.min ? {
                  value: element.validation.min,
                  message: `Minimum value is ${element.validation.min}`
                } : undefined,
                max: element.validation?.max ? {
                  value: element.validation.max,
                  message: `Maximum value is ${element.validation.max}`
                } : undefined
              })}
              placeholder={element.placeholder}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {element.type === 'meter_reading' && (
              <div className="flex gap-2 mt-2">
                <PhotoCapture
                  onCapture={(photo) => setPhotos({ ...photos, [`${element.name}_photo`]: photo })}
                  label="Reading Photo"
                />
              </div>
            )}
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false
              })}
              placeholder={element.placeholder}
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false
              })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select {element.label}</option>
              {element.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map((option, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={option}
                    {...register(element.name, {
                      required: element.required ? `${element.label} is required` : false
                    })}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map((option, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={option}
                    {...register(`${element.name}.${idx}`)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false
              })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'time':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="time"
              {...register(element.name, {
                required: element.required ? `${element.label} is required` : false
              })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message}</p>
            )}
          </div>
        );
      
      case 'photo':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <PhotoCapture
              onCapture={(photo) => {
                setPhotos({ ...photos, [element.name]: photo });
                setValue(element.name, photo);
              }}
              required={element.required}
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
          </div>
        );
      
      case 'signature':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <SignatureCapture
              onCapture={(signature) => {
                setSignatures({ ...signatures, [element.name]: signature });
                setValue(element.name, signature);
              }}
              required={element.required}
            />
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
          </div>
        );
      
      case 'gps':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              {location ? (
                <div className="text-sm">
                  <p>📍 Location captured</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {location.coords.latitude.toFixed(6)}, 
                    Lng: {location.coords.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Accuracy: ±{location.coords.accuracy.toFixed(0)}m
                  </p>
                </div>
              ) : locationError ? (
                <div className="text-sm text-red-500">
                  ⚠️ {locationError}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  📍 Capturing location...
                </div>
              )}
            </div>
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
          </div>
        );
      
      case 'header':
        return (
          <h3 key={element.id} className="text-lg font-bold mt-4 mb-2">
            {element.label}
          </h3>
        );
      
      case 'paragraph':
        return (
          <p key={element.id} className="text-gray-600 dark:text-gray-400 mb-4">
            {element.label}
          </p>
        );
      
      case 'divider':
        return <hr key={element.id} className="my-4" />;
      
      case 'multi_input':
        return (
          <div key={element.id} className="space-y-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border rounded-lg p-4 space-y-4">
              {element.multiInputConfig?.questions.map((question, qIndex) => (
                <div key={qIndex} className="space-y-2">
                  <p className="text-sm font-medium">{question}</p>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="yes"
                        {...register(`${element.name}.${qIndex}.answer`, {
                          required: element.required ? `Please select Yes or No for "${question}"` : false,
                          validate: (value) => {
                            if (element.required && !value) {
                              return `Please select Yes or No for "${question}"`;
                            }
                            return true;
                          }
                        })}
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="no"
                        {...register(`${element.name}.${qIndex}.answer`, {
                          required: element.required ? `Please select Yes or No for "${question}"` : false,
                          validate: (value) => {
                            // Check if "No" is selected and comment is required
                            const answer = watch(`${element.name}.${qIndex}.answer`);
                            const comment = watch(`${element.name}.${qIndex}.comment`);
                            if (answer === 'no' && (!comment || comment.trim() === '')) {
                              // We'll validate this in the comment field
                              return true;
                            }
                            return true;
                          }
                        })}
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                  <textarea
                    {...register(`${element.name}.${qIndex}.comment`, {
                      validate: (value) => {
                        const answer = watch(`${element.name}.${qIndex}.answer`);
                        // Require comment when answer is "no"
                        if (answer === 'no' && (!value || value.trim() === '')) {
                          return 'Please provide details when selecting "No"';
                        }
                        return true;
                      }
                    })}
                    placeholder={watch(`${element.name}.${qIndex}.answer`) === 'no' ? "Please provide details (required)" : "Additional comments (optional)"}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  {errors[element.name]?.[qIndex]?.answer && (
                    <p className="text-sm text-red-500">{errors[element.name][qIndex].answer.message}</p>
                  )}
                  {errors[element.name]?.[qIndex]?.comment && (
                    <p className="text-sm text-red-500">{errors[element.name][qIndex].comment.message}</p>
                  )}
                </div>
              ))}
            </div>
            {element.help_text && (
              <p className="text-sm text-gray-500">{element.help_text}</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{formSettings.name}</h2>
        {formSettings.description && (
          <p className="text-gray-600 dark:text-gray-400">{formSettings.description}</p>
        )}
      </div>

      {/* Offline Indicator */}
      {!navigator.onLine && formSettings.offline_capable && (
        <Alert>
          <p className="text-sm">
            📱 You're offline. This form will be saved and submitted when you're back online.
          </p>
        </Alert>
      )}

      {/* Form Elements */}
      <div className="space-y-6">
        {elements.map(renderElement)}
      </div>

      {/* Required Fields Note */}
      {elements.some(el => el.required && visibleElements.has(el.id)) && (
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> Required fields
        </p>
      )}

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          type="submit"
          disabled={isSubmitting || isPreview}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : isPreview ? 'Submit (Preview Mode)' : 'Submit Form'}
        </Button>
      </div>
    </form>
  );
};

export default FormRenderer;