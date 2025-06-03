import React from 'react';
import { FormElement } from './FormBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface ElementPropertiesProps {
  element: FormElement;
  elements: FormElement[];
  onUpdate: (updates: Partial<FormElement>) => void;
  onDelete: () => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({
  element,
  elements,
  onUpdate,
  onDelete
}) => {
  const updateValidation = (key: string, value: any) => {
    onUpdate({
      validation: {
        ...element.validation,
        [key]: value
      }
    });
  };

  const updateOption = (index: number, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(element.options || []), `Option ${(element.options?.length || 0) + 1}`];
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!element.options) return;
    const newOptions = element.options.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  const addCondition = () => {
    const newConditions = [
      ...(element.conditionalLogic?.conditions || []),
      { field: '', operator: 'equals', value: '' }
    ];
    onUpdate({
      conditionalLogic: {
        ...element.conditionalLogic,
        enabled: true,
        conditions: newConditions,
        action: element.conditionalLogic?.action || 'show'
      }
    });
  };

  const updateCondition = (index: number, updates: any) => {
    if (!element.conditionalLogic?.conditions) return;
    const newConditions = [...element.conditionalLogic.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({
      conditionalLogic: {
        ...element.conditionalLogic,
        conditions: newConditions
      }
    });
  };

  const removeCondition = (index: number) => {
    if (!element.conditionalLogic?.conditions) return;
    const newConditions = element.conditionalLogic.conditions.filter((_, i) => i !== index);
    onUpdate({
      conditionalLogic: {
        ...element.conditionalLogic,
        conditions: newConditions
      }
    });
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Element Properties</CardTitle>
        <p className="text-sm text-gray-500">{element.type}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {/* Label */}
            <div>
              <Label>Label</Label>
              <Input
                value={element.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Field label"
              />
            </div>
            
            {/* Name */}
            <div>
              <Label>Field Name</Label>
              <Input
                value={element.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="field_name"
                pattern="[a-z0-9_]+"
              />
              <p className="text-xs text-gray-500 mt-1">Use lowercase letters, numbers, and underscores</p>
            </div>
            
            {/* Placeholder */}
            {['text', 'email', 'phone', 'number', 'textarea'].includes(element.type) && (
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={element.placeholder}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Placeholder text"
                />
              </div>
            )}
            
            {/* Help Text */}
            <div>
              <Label>Help Text</Label>
              <Input
                value={element.help_text}
                onChange={(e) => onUpdate({ help_text: e.target.value })}
                placeholder="Additional instructions"
              />
            </div>
            
            {/* Required */}
            <div className="flex items-center justify-between">
              <Label>Required Field</Label>
              <Switch
                checked={element.required}
                onCheckedChange={(checked) => onUpdate({ required: checked })}
              />
            </div>
            
            {/* Options for select, radio, checkbox */}
            {['select', 'radio', 'checkbox'].includes(element.type) && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {element.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                      >
                        ❌
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="validation" className="space-y-4">
            {/* Number validation */}
            {element.type === 'number' && (
              <>
                <div>
                  <Label>Minimum Value</Label>
                  <Input
                    type="number"
                    value={element.validation?.min || ''}
                    onChange={(e) => updateValidation('min', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <Label>Maximum Value</Label>
                  <Input
                    type="number"
                    value={element.validation?.max || ''}
                    onChange={(e) => updateValidation('max', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
              </>
            )}
            
            {/* Text validation */}
            {['text', 'textarea'].includes(element.type) && (
              <>
                <div>
                  <Label>Minimum Length</Label>
                  <Input
                    type="number"
                    value={element.validation?.min_length || ''}
                    onChange={(e) => updateValidation('min_length', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <Label>Maximum Length</Label>
                  <Input
                    type="number"
                    value={element.validation?.max_length || ''}
                    onChange={(e) => updateValidation('max_length', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
                <div>
                  <Label>Pattern (Regex)</Label>
                  <Input
                    value={element.validation?.pattern || ''}
                    onChange={(e) => updateValidation('pattern', e.target.value)}
                    placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
                  />
                </div>
              </>
            )}
            
            {/* Email validation */}
            {element.type === 'email' && (
              <div className="text-sm text-gray-500">
                Email validation is automatically applied
              </div>
            )}
            
            {/* Phone validation */}
            {element.type === 'phone' && (
              <div>
                <Label>Phone Format</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={element.validation?.pattern || ''}
                  onChange={(e) => updateValidation('pattern', e.target.value)}
                >
                  <option value="">Any format</option>
                  <option value="^[0-9]{11}$">UK (11 digits)</option>
                  <option value="^\+44[0-9]{10}$">UK International</option>
                  <option value="^[0-9]{10}$">US (10 digits)</option>
                </select>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logic" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label>Enable Conditional Logic</Label>
              <Switch
                checked={element.conditionalLogic?.enabled || false}
                onCheckedChange={(checked) => onUpdate({
                  conditionalLogic: {
                    ...element.conditionalLogic,
                    enabled: checked,
                    conditions: element.conditionalLogic?.conditions || [],
                    action: element.conditionalLogic?.action || 'show'
                  }
                })}
              />
            </div>
            
            {element.conditionalLogic?.enabled && (
              <>
                <div>
                  <Label>Action</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={element.conditionalLogic.action}
                    onChange={(e) => onUpdate({
                      conditionalLogic: {
                        ...element.conditionalLogic,
                        action: e.target.value as 'show' | 'hide'
                      }
                    })}
                  >
                    <option value="show">Show this field when</option>
                    <option value="hide">Hide this field when</option>
                  </select>
                </div>
                
                <div>
                  <Label>Conditions</Label>
                  <div className="space-y-2 mt-2">
                    {element.conditionalLogic.conditions.map((condition, index) => (
                      <div key={index} className="p-3 border rounded-md space-y-2">
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={condition.field}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                        >
                          <option value="">Select field</option>
                          {elements
                            .filter(el => el.id !== element.id)
                            .map(el => (
                              <option key={el.id} value={el.name}>
                                {el.label}
                              </option>
                            ))}
                        </select>
                        
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value })}
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="not_contains">Does Not Contain</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="is_empty">Is Empty</option>
                          <option value="is_not_empty">Is Not Empty</option>
                        </select>
                        
                        {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            placeholder="Value"
                          />
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCondition(index)}
                          className="w-full"
                        >
                          Remove Condition
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addCondition}
                      className="w-full"
                    >
                      Add Condition
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 pt-6 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            Delete Element
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementProperties;