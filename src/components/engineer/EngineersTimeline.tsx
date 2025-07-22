import React from 'react';
import { Card } from '../ui/card';
import { Clock, Truck, Coffee, MapPin, Home } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineBlock {
  type: 'job' | 'travel' | 'break' | 'lunch' | 'empty' | 'home';
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  title?: string;
  location?: string;
  jobId?: number;
}

interface EngineerTimeline {
  engineerId: number;
  engineerName: string;
  area: string; // Postcode area
  blocks: TimelineBlock[];
}

interface EngineersTimelineProps {
  date: Date;
  engineers: EngineerTimeline[];
  startHour?: number; // Default 8
  endHour?: number; // Default 18
  onBlockClick?: (engineerId: number, block: TimelineBlock) => void;
}

const EngineersTimeline: React.FC<EngineersTimelineProps> = ({
  date,
  engineers,
  startHour = 8,
  endHour = 18,
  onBlockClick
}) => {
  const totalHours = endHour - startHour;
  const totalMinutes = totalHours * 60;
  
  // Create hour markers
  const hourMarkers = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);
  
  // Convert time string (HH:MM) to minutes from start
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours - startHour) * 60 + minutes;
  };
  
  // Get color and icon for block type
  const getBlockStyle = (type: TimelineBlock['type']) => {
    switch (type) {
      case 'job':
        return { 
          bg: 'bg-green-200 border-green-300', 
          icon: MapPin,
          iconColor: 'text-green-700'
        };
      case 'travel':
        return { 
          bg: 'bg-blue-100 border-blue-300', 
          icon: Truck,
          iconColor: 'text-blue-700'
        };
      case 'lunch':
        return { 
          bg: 'bg-orange-200 border-orange-300', 
          icon: Coffee,
          iconColor: 'text-orange-700'
        };
      case 'break':
        return { 
          bg: 'bg-yellow-200 border-yellow-300', 
          icon: Coffee,
          iconColor: 'text-yellow-700'
        };
      case 'home':
        return { 
          bg: 'bg-purple-200 border-purple-300', 
          icon: Home,
          iconColor: 'text-purple-700'
        };
      default:
        return { 
          bg: 'bg-gray-100 border-gray-200', 
          icon: Clock,
          iconColor: 'text-gray-500'
        };
    }
  };
  
  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Engineers Timeline - {format(date, 'EEEE, MMMM d, yyyy')}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with time markers */}
          <div className="flex border-b pb-2 mb-4">
            <div className="w-32 font-medium">Engineer</div>
            <div className="w-20 font-medium text-center">Area</div>
            <div className="flex-1 relative">
              <div className="flex justify-between text-sm text-gray-600">
                {hourMarkers.map(hour => (
                  <div key={hour} className="text-center" style={{ width: `${100 / totalHours}%` }}>
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Engineer rows */}
          {engineers.map((engineer) => (
            <div key={engineer.engineerId} className="flex items-center mb-3 min-h-[60px]">
              {/* Engineer name */}
              <div className="w-32 font-medium truncate pr-2">
                {engineer.engineerName}
              </div>
              
              {/* Area/Postcode */}
              <div className="w-20 text-center text-sm text-gray-600">
                {engineer.area}
              </div>
              
              {/* Timeline */}
              <div className="flex-1 relative h-12">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex">
                  {hourMarkers.slice(0, -1).map((_, i) => (
                    <div
                      key={i}
                      className="border-l border-gray-200"
                      style={{ width: `${100 / totalHours}%` }}
                    />
                  ))}
                </div>
                
                {/* Timeline blocks */}
                <div className="relative h-full flex items-center">
                  {engineer.blocks.map((block, index) => {
                    const startMinutes = timeToMinutes(block.startTime);
                    const left = (startMinutes / totalMinutes) * 100;
                    const width = (block.duration / totalMinutes) * 100;
                    const style = getBlockStyle(block.type);
                    const Icon = style.icon;
                    
                    return (
                      <div
                        key={index}
                        className={`absolute h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${style.bg}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: block.duration < 30 ? '40px' : 'auto'
                        }}
                        onClick={() => onBlockClick?.(engineer.engineerId, block)}
                        title={`${block.type}: ${block.startTime} - ${block.endTime}${block.title ? ` - ${block.title}` : ''}`}
                      >
                        <Icon className={`h-4 w-4 ${style.iconColor}`} />
                        {block.duration >= 60 && (
                          <span className="ml-1 text-xs font-medium">
                            {block.title || `${block.duration}m`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border-2 border-green-300 rounded-full" />
          <span>Job</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded-full" />
          <span>Travel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 border-2 border-orange-300 rounded-full" />
          <span>Lunch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-300 rounded-full" />
          <span>Break</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded-full" />
          <span>Available</span>
        </div>
      </div>
    </Card>
  );
};

export default EngineersTimeline;