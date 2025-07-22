import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { TempRemoval } from '../../services/tempRemovalService';

interface TempRemovalFormProps {
  initialData?: TempRemoval;
  onSubmit: (data: Omit<TempRemoval, 'id'>) => void;
  onCancel: () => void;
}

const TempRemovalForm: React.FC<TempRemovalFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    removal_date: initialData?.removal_date || format(new Date(), 'yyyy-MM-dd'),
    refit_date: initialData?.refit_date || '',
    job_number: initialData?.job_number || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    
    if (!formData.removal_date) {
      newErrors.removal_date = 'Removal date is required';
    }
    
    if (formData.refit_date && formData.removal_date) {
      const removalDate = new Date(formData.removal_date);
      const refitDate = new Date(formData.refit_date);
      
      if (refitDate < removalDate) {
        newErrors.refit_date = 'Refit date must be after removal date';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit
    onSubmit({
      removal_date: formData.removal_date,
      refit_date: formData.refit_date || null,
      job_number: formData.job_number,
      notes: formData.notes,
      site: initialData?.site || 0, // Will be set by parent
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Removal Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="removal_date"
            value={formData.removal_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 ${
              errors.removal_date ? 'border-red-500' : ''
            }`}
            required
          />
          {errors.removal_date && (
            <p className="text-red-500 text-sm mt-1">{errors.removal_date}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Refit Date
          </label>
          <input
            type="date"
            name="refit_date"
            value={formData.refit_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 ${
              errors.refit_date ? 'border-red-500' : ''
            }`}
          />
          {errors.refit_date && (
            <p className="text-red-500 text-sm mt-1">{errors.refit_date}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Job Number
        </label>
        <input
          type="text"
          name="job_number"
          value={formData.job_number}
          onChange={handleChange}
          placeholder="Enter job number (optional)"
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Enter any additional notes (optional)"
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Add'} Removal Record
        </Button>
      </div>
    </form>
  );
};

export default TempRemovalForm;