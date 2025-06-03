import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface ElementType {
  type: string;
  label: string;
  icon: string;
  category: string;
}

interface DraggableElementProps {
  elementType: ElementType;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ elementType }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${elementType.type}`,
    data: {
      isNew: true,
      elementType
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white dark:bg-gray-800 border rounded-lg cursor-move hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{elementType.icon}</span>
        <span className="text-sm font-medium">{elementType.label}</span>
      </div>
    </div>
  );
};

const ElementPalette: React.FC = () => {
  const elementTypes: ElementType[] = [
    // Input Elements
    { type: 'text', label: 'Text Input', icon: '📝', category: 'Input' },
    { type: 'number', label: 'Number', icon: '🔢', category: 'Input' },
    { type: 'email', label: 'Email', icon: '📧', category: 'Input' },
    { type: 'phone', label: 'Phone', icon: '📱', category: 'Input' },
    { type: 'textarea', label: 'Text Area', icon: '📄', category: 'Input' },
    { type: 'date', label: 'Date Picker', icon: '📅', category: 'Input' },
    { type: 'time', label: 'Time Picker', icon: '⏰', category: 'Input' },
    { type: 'datetime', label: 'Date & Time', icon: '📆', category: 'Input' },
    
    // Selection Elements
    { type: 'select', label: 'Dropdown', icon: '📋', category: 'Selection' },
    { type: 'radio', label: 'Radio Buttons', icon: '⚪', category: 'Selection' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️', category: 'Selection' },
    { type: 'toggle', label: 'Toggle Switch', icon: '🎚️', category: 'Selection' },
    
    // Media Elements
    { type: 'photo', label: 'Photo Upload', icon: '📷', category: 'Media' },
    { type: 'signature', label: 'Signature', icon: '✍️', category: 'Media' },
    { type: 'file', label: 'File Upload', icon: '📎', category: 'Media' },
    
    // Location Elements
    { type: 'gps', label: 'GPS Location', icon: '📍', category: 'Location' },
    { type: 'address', label: 'Address', icon: '🏠', category: 'Location' },
    
    // Specialized Elements
    { type: 'meter_reading', label: 'Meter Reading', icon: '⚡', category: 'Specialized' },
    { type: 'rating', label: 'Rating', icon: '⭐', category: 'Specialized' },
    { type: 'slider', label: 'Slider', icon: '🎚️', category: 'Specialized' },
    
    // Layout Elements
    { type: 'header', label: 'Header', icon: '📰', category: 'Layout' },
    { type: 'paragraph', label: 'Paragraph', icon: '📖', category: 'Layout' },
    { type: 'divider', label: 'Divider', icon: '➖', category: 'Layout' },
    { type: 'section', label: 'Section', icon: '📑', category: 'Layout' },
  ];

  const groupedElements = elementTypes.reduce((acc, element) => {
    if (!acc[element.category]) {
      acc[element.category] = [];
    }
    acc[element.category].push(element);
    return acc;
  }, {} as Record<string, ElementType[]>);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Form Elements</CardTitle>
        <p className="text-sm text-gray-500">Drag elements to the form</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {Object.entries(groupedElements).map(([category, elements]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {elements.map((elementType) => (
                  <DraggableElement
                    key={elementType.type}
                    elementType={elementType}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementPalette;