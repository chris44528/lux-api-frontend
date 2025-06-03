import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation } from '@tanstack/react-query';
import engineerService from '../../../services/engineerService';
import FormCanvas from './FormCanvas';
import ElementPalette from './ElementPalette';
import ElementProperties from './ElementProperties';
import FormPreview from './FormPreview';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Alert } from '../../ui/alert';

export interface FormElement {
  id: string;
  type: string;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    min_length?: number;
    max_length?: number;
  };
  options?: string[];
  conditionalLogic?: {
    enabled: boolean;
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    action: 'show' | 'hide';
  };
  defaultValue?: any;
  readonly?: boolean;
}

export interface FormSettings {
  name: string;
  form_type: string;
  description?: string;
  require_signature: boolean;
  require_photo: boolean;
  require_gps_location: boolean;
  offline_capable: boolean;
}

interface FormBuilderProps {
  onSave: (template: any) => void;
  initialTemplate?: any;
  isIssueReport?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ onSave, initialTemplate, isIssueReport }) => {
  const [elements, setElements] = useState<FormElement[]>(
    initialTemplate?.schema?.elements || []
  );
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formSettings, setFormSettings] = useState<FormSettings>({
    name: initialTemplate?.name || '',
    form_type: initialTemplate?.form_type || (isIssueReport ? 'issue_report' : 'pre_job'),
    description: initialTemplate?.description || '',
    require_signature: initialTemplate?.require_signature ?? false,
    require_photo: initialTemplate?.require_photo ?? false,
    require_gps_location: initialTemplate?.require_gps_location ?? true,
    offline_capable: initialTemplate?.offline_capable ?? true,
  });

  const saveMutation = useMutation(
    (templateData: any) => {
      if (initialTemplate?.id) {
        return engineerService.updateFormTemplate(initialTemplate.id, templateData);
      }
      return engineerService.createFormTemplate(templateData);
    },
    {
      onSuccess: (data) => {
        onSave(data);
      }
    }
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // If dragging from palette
    if (active.data.current?.isNew) {
      const elementType = active.data.current.elementType;
      const newElement = createNewElement(elementType);
      
      if (over.id === 'form-canvas') {
        // Add to end
        setElements([...elements, newElement]);
      } else {
        // Insert at specific position
        const overIndex = elements.findIndex(el => el.id === over.id);
        if (overIndex >= 0) {
          const newElements = [...elements];
          newElements.splice(overIndex, 0, newElement);
          setElements(newElements);
        }
      }
      setSelectedElement(newElement);
    } else {
      // Reordering existing elements
      if (active.id !== over.id) {
        const oldIndex = elements.findIndex(el => el.id === active.id);
        const newIndex = elements.findIndex(el => el.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          setElements(arrayMove(elements, oldIndex, newIndex));
        }
      }
    }
    
    setActiveId(null);
  };

  const createNewElement = (elementType: any): FormElement => {
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseElement: FormElement = {
      id,
      type: elementType.type,
      label: elementType.label,
      name: `field_${elements.length + 1}`,
      required: false,
      placeholder: '',
      help_text: '',
      validation: {},
    };

    // Add type-specific defaults
    switch (elementType.type) {
      case 'select':
      case 'radio':
      case 'checkbox':
        baseElement.options = ['Option 1', 'Option 2'];
        break;
      case 'number':
        baseElement.validation = { min: 0, max: 100 };
        break;
      case 'text':
      case 'textarea':
        baseElement.validation = { max_length: 255 };
        break;
      case 'meter_reading':
        baseElement.label = 'Meter Reading';
        baseElement.validation = { min: 0 };
        baseElement.placeholder = 'Enter current reading';
        break;
    }

    return baseElement;
  };

  const updateElement = useCallback((elementId: string, updates: Partial<FormElement>) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
    
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  }, [elements, selectedElement]);

  const deleteElement = useCallback((elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  }, [elements, selectedElement]);

  const duplicateElement = useCallback((elementId: string) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (elementToDuplicate) {
      const newElement = {
        ...elementToDuplicate,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${elementToDuplicate.name}_copy`
      };
      const index = elements.findIndex(el => el.id === elementId);
      const newElements = [...elements];
      newElements.splice(index + 1, 0, newElement);
      setElements(newElements);
    }
  }, [elements]);

  const saveTemplate = () => {
    if (!formSettings.name) {
      alert('Please enter a form name');
      return;
    }

    const templateData = {
      ...formSettings,
      schema: {
        elements: elements,
        settings: formSettings
      }
    };

    saveMutation.mutate(templateData);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <Input
                  value={formSettings.name}
                  onChange={(e) => setFormSettings({ ...formSettings, name: e.target.value })}
                  placeholder="Enter form name..."
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  <span className="mr-2">👁️</span>
                  Preview
                </Button>
                <Button
                  onClick={saveTemplate}
                  disabled={saveMutation.isLoading}
                >
                  {saveMutation.isLoading ? 'Saving...' : '💾 Save Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Element Palette */}
            <div className="col-span-3">
              <ElementPalette />
            </div>

            {/* Form Canvas */}
            <div className="col-span-6">
              <FormCanvas
                elements={elements}
                selectedElement={selectedElement}
                onElementSelect={setSelectedElement}
                onElementDelete={deleteElement}
                onElementDuplicate={duplicateElement}
              />
            </div>

            {/* Properties Panel */}
            <div className="col-span-3">
              {selectedElement ? (
                <ElementProperties
                  element={selectedElement}
                  elements={elements}
                  onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                  onDelete={() => deleteElement(selectedElement.id)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Form Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Form Type</Label>
                      <select
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={formSettings.form_type}
                        onChange={(e) => setFormSettings({ ...formSettings, form_type: e.target.value })}
                      >
                        <option value="pre_job">Pre-Job</option>
                        <option value="post_job">Post-Job</option>
                        <option value="meter_reading">Meter Reading</option>
                        <option value="site_inspection">Site Inspection</option>
                        <option value="issue_report">Issue Report</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        rows={3}
                        value={formSettings.description}
                        onChange={(e) => setFormSettings({ ...formSettings, description: e.target.value })}
                        placeholder="Brief description of this form..."
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Require Signature</Label>
                        <Switch
                          checked={formSettings.require_signature}
                          onCheckedChange={(checked) => 
                            setFormSettings({ ...formSettings, require_signature: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Require Photo</Label>
                        <Switch
                          checked={formSettings.require_photo}
                          onCheckedChange={(checked) => 
                            setFormSettings({ ...formSettings, require_photo: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Require GPS Location</Label>
                        <Switch
                          checked={formSettings.require_gps_location}
                          onCheckedChange={(checked) => 
                            setFormSettings({ ...formSettings, require_gps_location: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Offline Capable</Label>
                        <Switch
                          checked={formSettings.offline_capable}
                          onCheckedChange={(checked) => 
                            setFormSettings({ ...formSettings, offline_capable: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Save Error */}
        {saveMutation.isError && (
          <div className="fixed bottom-4 right-4">
            <Alert variant="destructive">
              <p>Failed to save form template. Please try again.</p>
            </Alert>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <FormPreview
            formSettings={formSettings}
            elements={elements}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>

      <DragOverlay>
        {activeId && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg opacity-80">
            Dragging element...
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default FormBuilder;