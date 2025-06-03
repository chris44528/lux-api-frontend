import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableElement from './SortableElement';
import { FormElement } from './FormBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface FormCanvasProps {
  elements: FormElement[];
  selectedElement: FormElement | null;
  onElementSelect: (element: FormElement) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
}

const FormCanvas: React.FC<FormCanvasProps> = ({
  elements,
  selectedElement,
  onElementSelect,
  onElementDelete,
  onElementDuplicate
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Canvas</CardTitle>
        <p className="text-sm text-gray-500">
          {elements.length === 0 
            ? 'Drag elements here to build your form' 
            : `${elements.length} element${elements.length !== 1 ? 's' : ''}`}
        </p>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={`min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4 transition-colors
            ${isOver ? 'bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-500' : ''}`}
        >
          {elements.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 dark:text-gray-400">
                  Drag elements from the palette to start building your form
                </p>
              </div>
            </div>
          ) : (
            <SortableContext
              items={elements.map(el => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {elements.map((element) => (
                  <SortableElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    onSelect={() => onElementSelect(element)}
                    onDelete={() => onElementDelete(element.id)}
                    onDuplicate={() => onElementDuplicate(element.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormCanvas;