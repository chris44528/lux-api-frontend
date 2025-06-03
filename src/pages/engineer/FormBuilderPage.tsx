import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Save, Eye, Trash2, GripVertical, Copy, 
  FileText, CheckSquare, Calendar, Type, Hash,
  ListOrdered, Radio, Square, Upload, MapPin
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import engineerService from '@/services/engineerService';

interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'date' | 'textarea' | 'photo' | 'signature' | 'location';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  type: 'pre_visit' | 'post_visit' | 'general';
  fields: FormField[];
  created_date: string;
  updated_date: string;
  is_active: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'select', label: 'Dropdown', icon: ListOrdered },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio Button', icon: Radio },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'photo', label: 'Photo Upload', icon: Upload },
  { value: 'signature', label: 'Signature', icon: Square },
  { value: 'location', label: 'Location', icon: MapPin },
];

// Sortable Field Component
const SortableField: React.FC<{
  field: FormField;
  onEdit: (field: FormField) => void;
  onDelete: (id: string) => void;
}> = ({ field, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldType = FIELD_TYPES.find(t => t.value === field.type);
  const Icon = fieldType?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium">{field.label}</h4>
            {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{fieldType?.label}</p>
          
          {field.placeholder && (
            <p className="text-xs text-gray-500 mb-2">Placeholder: {field.placeholder}</p>
          )}
          
          {field.options && field.options.length > 0 && (
            <div className="text-xs text-gray-500 mb-2">
              Options: {field.options.join(', ')}
            </div>
          )}
          
          {field.conditionalLogic && (
            <Badge variant="outline" className="text-xs">
              Conditional: Show if {field.conditionalLogic.showIf} {field.conditionalLogic.operator} {field.conditionalLogic.value}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(field)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FormBuilderPage: React.FC = () => {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  const { toast } = useToast();

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'pre_visit' | 'post_visit' | 'general'>('general');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Field modal state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FormField['type']>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>(['']);

  // Load forms from API
  useEffect(() => {
    const loadForms = async () => {
      try {
        const response = await engineerService.getFormTemplates();
        const formTemplates = response.results || response;
        
        // Transform API response to match our interface
        const transformedForms = formTemplates.map((template: any) => ({
          id: template.id.toString(),
          name: template.name,
          description: template.description || '',
          type: template.form_type || 'general',
          fields: template.schema?.elements || [],
          created_date: template.created_at,
          updated_date: template.updated_at,
          is_active: template.is_active !== false,
        }));
        
        setForms(transformedForms);
      } catch (error) {
        console.error('Failed to load form templates:', error);
        toast({
          title: "Error",
          description: "Failed to load form templates",
          variant: "destructive",
        });
      }
    };
    
    loadForms();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormFields((fields) => {
        const oldIndex = fields.findIndex(f => f.id === active.id);
        const newIndex = fields.findIndex(f => f.id === over.id);
        return arrayMove(fields, oldIndex, newIndex);
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedForm(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormDescription('');
    setFormType('general');
    setFormFields([]);
    setActiveTab('editor');
  };

  const handleSelectForm = (form: FormTemplate) => {
    setSelectedForm(form);
    setIsCreatingNew(false);
    setFormName(form.name);
    setFormDescription(form.description);
    setFormType(form.type);
    setFormFields(form.fields);
    setActiveTab('editor');
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldPlaceholder('');
    setFieldRequired(false);
    setFieldOptions(['']);
    setIsFieldModalOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldPlaceholder(field.placeholder || '');
    setFieldRequired(field.required);
    setFieldOptions(field.options || ['']);
    setIsFieldModalOpen(true);
  };

  const handleSaveField = () => {
    const field: FormField = {
      id: editingField?.id || `field-${Date.now()}`,
      type: fieldType,
      label: fieldLabel,
      placeholder: fieldPlaceholder,
      required: fieldRequired,
      options: ['select', 'radio', 'checkbox'].includes(fieldType) ? fieldOptions.filter(o => o) : undefined,
    };

    if (editingField) {
      setFormFields(formFields.map(f => f.id === editingField.id ? field : f));
    } else {
      setFormFields([...formFields, field]);
    }

    setIsFieldModalOpen(false);
  };

  const handleDeleteField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const handleSaveForm = async () => {
    if (!formName || formFields.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a form name and at least one field",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateData = {
        name: formName,
        description: formDescription,
        form_type: formType,
        schema: {
          elements: formFields,
          settings: {
            require_signature: formType === 'post_visit',
            require_photo: formType === 'post_visit',
            require_gps_location: true,
          }
        },
        is_active: true,
      };

      let savedTemplate;
      if (selectedForm) {
        // Update existing template
        savedTemplate = await engineerService.updateFormTemplate(selectedForm.id, templateData);
      } else {
        // Create new template
        savedTemplate = await engineerService.createFormTemplate(templateData);
      }

      const transformedForm: FormTemplate = {
        id: savedTemplate.id.toString(),
        name: savedTemplate.name,
        description: savedTemplate.description || '',
        type: savedTemplate.form_type || 'general',
        fields: savedTemplate.schema?.elements || formFields,
        created_date: savedTemplate.created_at,
        updated_date: savedTemplate.updated_at,
        is_active: savedTemplate.is_active !== false,
      };

      if (selectedForm) {
        setForms(forms.map(f => f.id === selectedForm.id ? transformedForm : f));
      } else {
        setForms([...forms, transformedForm]);
      }

      toast({
        title: "Success",
        description: `Form "${formName}" saved successfully`,
      });

      setSelectedForm(transformedForm);
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Failed to save form template:', error);
      toast({
        title: "Error",
        description: "Failed to save form template",
        variant: "destructive",
      });
    }
  };

  const renderFieldModal = () => {
    if (!isFieldModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{editingField ? 'Edit Field' : 'Add Field'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="Enter field label"
              />
            </div>

            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={fieldType} onValueChange={(value) => setFieldType(value as FormField['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {['text', 'number', 'textarea'].includes(fieldType) && (
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {['select', 'radio', 'checkbox'].includes(fieldType) && (
              <div className="space-y-2">
                <Label>Options</Label>
                {fieldOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...fieldOptions];
                        newOptions[index] = e.target.value;
                        setFieldOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {fieldOptions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFieldOptions(fieldOptions.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFieldOptions([...fieldOptions, ''])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={fieldRequired}
                onCheckedChange={setFieldRequired}
              />
              <Label>Required Field</Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFieldModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveField}
                disabled={!fieldLabel}
                className="flex-1"
              >
                Save Field
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFormPreview = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{formName || 'Untitled Form'}</h3>
        <p className="text-gray-600">{formDescription}</p>
        
        <div className="space-y-4 border rounded-lg p-4">
          {formFields.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No fields added yet. Switch to the Editor tab to add fields.
            </p>
          ) : (
            formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'text' && (
                  <Input placeholder={field.placeholder} disabled />
                )}
                
                {field.type === 'number' && (
                  <Input type="number" placeholder={field.placeholder} disabled />
                )}
                
                {field.type === 'textarea' && (
                  <Textarea placeholder={field.placeholder} disabled />
                )}
                
                {field.type === 'date' && (
                  <Input type="date" disabled />
                )}
                
                {field.type === 'select' && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </Select>
                )}
                
                {field.type === 'checkbox' && field.options && (
                  <div className="space-y-2">
                    {field.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input type="checkbox" disabled />
                        <label>{option}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {field.type === 'radio' && field.options && (
                  <div className="space-y-2">
                    {field.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input type="radio" name={field.id} disabled />
                        <label>{option}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {field.type === 'photo' && (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Click to upload photo</p>
                  </div>
                )}
                
                {field.type === 'signature' && (
                  <div className="border rounded-lg p-4 h-32 bg-gray-50">
                    <p className="text-sm text-gray-500 text-center">Signature pad</p>
                  </div>
                )}
                
                {field.type === 'location' && (
                  <div className="border rounded-lg p-4">
                    <MapPin className="h-5 w-5 inline mr-2" />
                    <span className="text-sm text-gray-500">Current location will be captured</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Form Builder</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Forms List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {forms.map(form => (
              <div
                key={form.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedForm?.id === form.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelectForm(form)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{form.name}</h4>
                    <p className="text-xs text-gray-500">{form.fields.length} fields</p>
                  </div>
                  <Badge variant={form.type === 'pre_visit' ? 'default' : form.type === 'post_visit' ? 'secondary' : 'outline'}>
                    {form.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Form Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {isCreatingNew ? 'Create New Form' : selectedForm ? `Edit: ${selectedForm.name}` : 'Select a Form'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isCreatingNew || selectedForm) && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4">
                  {/* Form Details */}
                  <div className="space-y-4 border-b pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Form Name</Label>
                        <Input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Enter form name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Form Type</Label>
                        <Select value={formType} onValueChange={(value) => setFormType(value as typeof formType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre_visit">Pre-visit</SelectItem>
                            <SelectItem value="post_visit">Post-visit</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Enter form description"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Form Fields</h3>
                      <Button onClick={handleAddField} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Field
                      </Button>
                    </div>

                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={formFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {formFields.map(field => (
                            <SortableField
                              key={field.id}
                              field={field}
                              onEdit={handleEditField}
                              onDelete={handleDeleteField}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {formFields.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-gray-500">No fields added yet</p>
                        <Button variant="link" onClick={handleAddField}>
                          Add your first field
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveForm}
                      disabled={!formName || formFields.length === 0}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Form
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  {renderFormPreview()}
                </TabsContent>
              </Tabs>
            )}
            
            {!isCreatingNew && !selectedForm && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a form to edit or create a new one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {renderFieldModal()}
    </div>
  );
};

export default FormBuilderPage;