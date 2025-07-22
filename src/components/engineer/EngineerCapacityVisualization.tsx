import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import engineerService from '../../services/engineerService';

interface CapacityData {
  date: string;
  dailyCapacityPercentage: number;
  hoursAllocated: number;
  hoursAvailable: number;
  jobCount: number;
  isInArea: boolean;
  nearbyJobsCount: number;
  travelSavingsMinutes: number;
  overbookingRecommended: boolean;
}

interface EngineerCapacityVisualizationProps {
  engineerId: number | null;
  selectedDate: Date | null;
  jobLocation?: { latitude: number; longitude: number };
  estimatedJobHours?: number;
  onDateSelect?: (date: Date) => void;
}

const EngineerCapacityVisualization: React.FC<EngineerCapacityVisualizationProps> = ({
  engineerId,
  selectedDate,
  jobLocation,
  estimatedJobHours = 0,
  onDateSelect
}) => {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }));
  const [capacityData, setCapacityData] = useState<CapacityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(40);

  useEffect(() => {
    if (engineerId) {
      fetchCapacityData();
    }
  }, [engineerId, weekStart, jobLocation]);

  const fetchCapacityData = async () => {
    if (!engineerId) return;

    setLoading(true);
    try {
      // Generate dates for the week
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      const capacityPromises = weekDates.map(async (date) => {
        try {
          // Fetch route data for the date
          const dateStr = format(date, 'yyyy-MM-dd');
          const routeResponse = await engineerService.getRoutes({
            engineer: engineerId,
            date: dateStr
          });

          const route = routeResponse.results?.[0];
          let dailyData: CapacityData = {
            date: dateStr,
            dailyCapacityPercentage: 0,
            hoursAllocated: 0,
            hoursAvailable: 8,
            jobCount: 0,
            isInArea: false,
            nearbyJobsCount: 0,
            travelSavingsMinutes: 0,
            overbookingRecommended: false
          };

          if (route) {
            const durationHours = (route.estimated_duration_minutes || 0) / 60;
            dailyData.hoursAllocated = Math.round(durationHours * 10) / 10;
            dailyData.dailyCapacityPercentage = Math.round((durationHours / 8) * 100);
            dailyData.jobCount = route.route_jobs?.length || 0;
          }

          // Check if engineer will be in the area (if job location provided)
          if (jobLocation && route && route.optimized_order) {
            const jobsInArea = route.optimized_order.filter((job: any) => {
              if (!job.latitude || !job.longitude) return false;
              const distance = calculateDistance(
                jobLocation.latitude,
                jobLocation.longitude,
                job.latitude,
                job.longitude
              );
              return distance <= 10; // 10km radius
            });

            dailyData.isInArea = jobsInArea.length > 0;
            dailyData.nearbyJobsCount = jobsInArea.length;
            
            // Simple travel savings calculation
            if (dailyData.isInArea) {
              dailyData.travelSavingsMinutes = 30; // Estimated average
            }
          }

          // Determine if overbooking is recommended
          if (dailyData.isInArea && dailyData.dailyCapacityPercentage < 80) {
            dailyData.overbookingRecommended = true;
          }

          return dailyData;
        } catch (error) {
          console.error(`Error fetching capacity for date ${date}:`, error);
          return {
            date: format(date, 'yyyy-MM-dd'),
            dailyCapacityPercentage: 0,
            hoursAllocated: 0,
            hoursAvailable: 8,
            jobCount: 0,
            isInArea: false,
            nearbyJobsCount: 0,
            travelSavingsMinutes: 0,
            overbookingRecommended: false
          };
        }
      });

      const results = await Promise.all(capacityPromises);
      setCapacityData(results);
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCapacityColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getCapacityTextColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(current => addDays(current, direction === 'next' ? 7 : -7));
  };

  const calculateWeeklyTotal = (): number => {
    return capacityData.reduce((sum, day) => sum + day.hoursAllocated, 0);
  };

  const isToday = (dateStr: string): boolean => {
    return isSameDay(new Date(dateStr), new Date());
  };

  const isSelected = (dateStr: string): boolean => {
    return selectedDate ? isSameDay(new Date(dateStr), selectedDate) : false;
  };

  if (!engineerId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Select an engineer to view capacity
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weekly Capacity Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading capacity data...</div>
        ) : (
          <>
            {/* Daily capacity bars */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {capacityData.map((day, index) => {
                const date = new Date(day.date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const effectiveCapacity = estimatedJobHours > 0 && isSelected(day.date)
                  ? Math.min(100, day.dailyCapacityPercentage + (estimatedJobHours / 8 * 100))
                  : day.dailyCapacityPercentage;

                return (
                  <div
                    key={day.date}
                    className={`relative cursor-pointer transition-all ${
                      isWeekend ? 'opacity-50' : ''
                    }`}
                    onClick={() => !isWeekend && onDateSelect?.(date)}
                  >
                    <div className="text-center mb-1">
                      <div className={`text-xs font-medium ${
                        isToday(day.date) ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {format(date, 'EEE')}
                      </div>
                      <div className={`text-sm ${
                        isSelected(day.date) ? 'font-bold text-blue-600' : ''
                      }`}>
                        {format(date, 'd')}
                      </div>
                    </div>
                    
                    {/* Capacity bar */}
                    <div className="h-24 bg-gray-100 rounded relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 right-0 transition-all ${
                          getCapacityColor(day.dailyCapacityPercentage)
                        }`}
                        style={{ height: `${day.dailyCapacityPercentage}%` }}
                      />
                      
                      {/* New job preview if selected */}
                      {estimatedJobHours > 0 && isSelected(day.date) && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-blue-300 opacity-60"
                          style={{
                            height: `${estimatedJobHours / 8 * 100}%`,
                            bottom: `${day.dailyCapacityPercentage}%`
                          }}
                        />
                      )}
                      
                      {/* Capacity percentage */}
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        getCapacityTextColor(effectiveCapacity)
                      } font-semibold text-xs`}>
                        {Math.round(effectiveCapacity)}%
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="mt-1 flex justify-center gap-1">
                      {day.isInArea && (
                        <MapPin className="h-3 w-3 text-green-600" title="Already in area" />
                      )}
                      {day.overbookingRecommended && (
                        <CheckCircle className="h-3 w-3 text-blue-600" title="Recommended" />
                      )}
                      {effectiveCapacity > 100 && (
                        <AlertTriangle className="h-3 w-3 text-orange-600" title="Overtime" />
                      )}
                    </div>
                    
                    {/* Job count */}
                    <div className="text-center mt-1">
                      <span className="text-xs text-gray-500">
                        {day.jobCount} job{day.jobCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Weekly summary */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Weekly Total:</span>
                  <span className="ml-2 font-medium">
                    {calculateWeeklyTotal().toFixed(1)} / {maxWeeklyHours}h
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Weekly Utilization:</span>
                  <span className={`ml-2 font-medium ${
                    getCapacityTextColor((calculateWeeklyTotal() / maxWeeklyHours) * 100)
                  }`}>
                    {Math.round((calculateWeeklyTotal() / maxWeeklyHours) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Location-based insights */}
              {capacityData.some(d => d.isInArea) && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Engineer scheduled in area on{' '}
                    {capacityData.filter(d => d.isInArea).length} day(s) this week
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EngineerCapacityVisualization;