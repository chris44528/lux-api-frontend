import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormElement } from './FormBuilder';
import { Button } from '../../ui/button';

interface SortableElementProps {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SortableElement: React.FC<SortableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderPreview = () => {
    switch (element.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <input
            type={element.type}
            placeholder={element.placeholder || `Enter ${element.label.toLowerCase()}`}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
            disabled
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={element.placeholder || `Enter ${element.label.toLowerCase()}`}
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
            rows={3}
            disabled
          />
        );
      
      case 'select':
        return (
          <select className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" disabled>
            <option>Select {element.label}</option>
            {element.options?.map((opt, idx) => (
              <option key={idx}>{opt}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {element.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="radio" name={element.name} disabled />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {element.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="checkbox" disabled />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
            disabled
          />
        );
      
      case 'time':
        return (
          <input
            type="time"
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
            disabled
          />
        );
      
      case 'photo':
        return (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <span className="text-2xl">📷</span>
            <p className="text-sm text-gray-500 mt-1">Tap to take photo</p>
          </div>
        );
      
      case 'signature':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <span className="text-2xl">✍️</span>
            <p className="text-sm text-gray-500 mt-1">Tap to sign</p>
          </div>
        );
      
      case 'gps':
        return (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <span className="text-sm">Location will be captured automatically</span>
            </div>
          </div>
        );
      
      case 'meter_reading':
        return (
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Enter reading"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
              disabled
            />
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gray-100 rounded text-sm" disabled>
                📷 Photo
              </button>
              <button className="flex-1 py-2 bg-gray-100 rounded text-sm" disabled>
                📍 GPS
              </button>
            </div>
          </div>
        );
      
      case 'header':
        return <h3 className="text-lg font-bold">{element.label}</h3>;
      
      case 'paragraph':
        return <p className="text-gray-600 dark:text-gray-400">{element.label}</p>;
      
      case 'divider':
        return <hr className="my-2" />;
      
      default:
        return (
          <div className="text-center py-4 text-gray-500">
            {element.type} preview
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'border-green-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }
        ${isDragging ? 'shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-gray-400"
          >
            <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </div>

        {/* Element Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                title="Duplicate"
              >
                📋
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete"
              >
                🗑️
              </Button>
            </div>
          </div>
          
          {element.help_text && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {element.help_text}
            </p>
          )}
          
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default SortableElement;