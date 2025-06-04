import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Filter } from 'lucide-react';
import { holidayService, HolidayRequest, PublicHoliday } from '@/services/holidayService';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'holiday' | 'public';
    status?: string;
    color: string;
    request?: HolidayRequest;
    publicHoliday?: PublicHoliday;
  };
}

export default function HolidayCalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [holidayTypes, setHolidayTypes] = useState<any[]>([]);

  useEffect(() => {
    loadCalendarData();
  }, [date, filterDepartment, filterType]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [deptResponse, typeResponse] = await Promise.all([
        holidayService.getDepartments(),
        holidayService.getHolidayTypes()
      ]);
      setDepartments(deptResponse.results || []);
      setHolidayTypes(typeResponse.results || []);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startOfMonth = moment(date).startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
      const endOfMonth = moment(date).endOf('month').add(7, 'days').format('YYYY-MM-DD');

      const [holidayData, publicHolidays] = await Promise.all([
        holidayService.getCalendarData({
          start_date: startOfMonth,
          end_date: endOfMonth,
          ...(filterDepartment !== 'all' && { department_id: parseInt(filterDepartment) })
        }),
        holidayService.getUpcomingPublicHolidays()
      ]);

      const holidayEvents: CalendarEvent[] = holidayData.map((request: HolidayRequest) => ({
        id: `holiday-${request.id}`,
        title: `${request.user.full_name} - ${request.holiday_type.name}`,
        start: new Date(request.start_date),
        end: new Date(request.end_date),
        resource: {
          type: 'holiday',
          status: request.status,
          color: request.holiday_type.color,
          request
        }
      }));

      const publicHolidayEvents: CalendarEvent[] = publicHolidays
        .filter((ph: PublicHoliday) => {
          const phDate = moment(ph.date);
          return phDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
        })
        .map((ph: PublicHoliday) => ({
          id: `public-${ph.id}`,
          title: ph.name,
          start: new Date(ph.date),
          end: new Date(ph.date),
          resource: {
            type: 'public',
            color: '#9CA3AF',
            publicHoliday: ph
          }
        }));

      setEvents([...holidayEvents, ...publicHolidayEvents]);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    navigate('/holidays/request/new', {
      state: {
        startDate: moment(start).format('YYYY-MM-DD'),
        endDate: moment(end).subtract(1, 'day').format('YYYY-MM-DD')
      }
    });
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource.type === 'holiday' && event.resource.request) {
      navigate(`/holidays/request/${event.resource.request.id}`);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: event.resource.color,
      borderRadius: '5px',
      opacity: event.resource.status === 'REJECTED' ? 0.5 : 0.9,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    return { style };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.date.setMonth(toolbar.date.getMonth() - 1);
      toolbar.onNavigate('prev');
    };

    const goToNext = () => {
      toolbar.date.setMonth(toolbar.date.getMonth() + 1);
      toolbar.onNavigate('next');
    };

    const goToToday = () => {
      const now = new Date();
      toolbar.date.setMonth(now.getMonth());
      toolbar.date.setYear(now.getFullYear());
      toolbar.onNavigate('current');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return <span className="text-lg font-semibold dark:text-gray-100">{date.format('MMMM YYYY')}</span>;
    };

    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToBack}>Previous</Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={goToNext}>Next</Button>
          <div className="ml-4">{label()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: View) => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month" className="dark:text-gray-100 dark:hover:bg-gray-700">Month</SelectItem>
              <SelectItem value="week" className="dark:text-gray-100 dark:hover:bg-gray-700">Week</SelectItem>
              <SelectItem value="day" className="dark:text-gray-100 dark:hover:bg-gray-700">Day</SelectItem>
              <SelectItem value="agenda" className="dark:text-gray-100 dark:hover:bg-gray-700">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Holiday Calendar</h1>
        <Button onClick={() => navigate('/holidays/request/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Request Holiday
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div style={{ height: '600px' }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    eventPropGetter={eventStyleGetter}
                    components={{
                      toolbar: CustomToolbar
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Department</label>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-700">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()} className="dark:text-gray-100 dark:hover:bg-gray-700">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Holiday Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-700">All Types</SelectItem>
                    {holidayTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()} className="dark:text-gray-100 dark:hover:bg-gray-700">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
                <span className="text-sm dark:text-gray-300">Annual Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF9800' }}></div>
                <span className="text-sm dark:text-gray-300">Sick Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9CA3AF' }}></div>
                <span className="text-sm dark:text-gray-300">Public Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded opacity-50" style={{ backgroundColor: '#000' }}></div>
                <span className="text-sm dark:text-gray-300">Rejected</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => navigate('/holidays/my-requests')}>
                My Requests
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/holidays/entitlements')}>
                My Entitlements
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/holidays/team')}>
                Team View
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}