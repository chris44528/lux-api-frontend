import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { CalendarIcon, AlertCircle, Info } from 'lucide-react';
import { holidayService, HolidayType, HolidayRequest } from '@/services/holidayService';
import moment from 'moment';
import { useAuth } from '@/hooks/useAuth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

interface Department {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
}

interface HolidayRequestFormProps {
  requestId?: number;
  onSuccess?: () => void;
}

export default function HolidayRequestForm({ requestId, onSuccess }: HolidayRequestFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    holiday_type_id: '',
    department_id: '',
    start_date: location.state?.startDate || '',
    end_date: location.state?.endDate || '',
    start_half_day: false,
    end_half_day: false,
    reason: ''
  });

  const [workingDays, setWorkingDays] = useState(0);

  useEffect(() => {
    loadHolidayTypes();
    loadDepartments();
    if (requestId) {
      loadExistingRequest();
    }
  }, [requestId]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      calculateWorkingDays();
      checkConflicts();
    }
  }, [formData.start_date, formData.end_date, formData.start_half_day, formData.end_half_day]);

  const loadHolidayTypes = async () => {
    try {
      const response = await holidayService.getHolidayTypes();
      setHolidayTypes(response.results.filter(ht => ht.is_active));
    } catch (error) {
      console.error('Failed to load holiday types:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/departments/', {
        headers: { Authorization: `Token ${token}` }
      });
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadExistingRequest = async () => {
    if (!requestId) return;
    try {
      const request = await holidayService.getHolidayRequest(requestId);
      setFormData({
        holiday_type_id: request.holiday_type.id.toString(),
        department_id: request.department?.id?.toString() || '',
        start_date: request.start_date,
        end_date: request.end_date,
        start_half_day: request.start_half_day,
        end_half_day: request.end_half_day,
        reason: request.reason
      });
    } catch (error) {
      console.error('Failed to load request:', error);
    }
  };

  const calculateWorkingDays = () => {
    if (!formData.start_date || !formData.end_date) return;

    const start = moment(formData.start_date);
    const end = moment(formData.end_date);
    let days = 0;

    const current = start.clone();
    while (current.isSameOrBefore(end)) {
      if (current.day() !== 0 && current.day() !== 6) { // Not weekend
        days++;
      }
      current.add(1, 'day');
    }

    // Adjust for half days
    if (formData.start_half_day) days -= 0.5;
    if (formData.end_half_day) days -= 0.5;

    setWorkingDays(days);
  };

  const checkConflicts = async () => {
    if (!formData.start_date || !formData.end_date) return;
    
    try {
      // Check for job conflicts
      const conflicts = await holidayService.checkJobConflicts(requestId || 0);
      setConflicts(conflicts);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    setValidationErrors([]);

    try {
      let request: HolidayRequest;
      
      if (requestId) {
        request = await holidayService.updateHolidayRequest(requestId, {
          ...formData,
          department_id: parseInt(formData.department_id),
          holiday_type_id: parseInt(formData.holiday_type_id)
        });
      } else {
        request = await holidayService.createHolidayRequest({
          ...formData,
          holiday_type_id: parseInt(formData.holiday_type_id),
          department_id: parseInt(formData.department_id)
        });
      }

      if (!isDraft) {
        await holidayService.submitHolidayRequest(request.id);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/holidays/my-requests');
      }
    } catch (error: any) {
      if (error.response?.data) {
        // Handle different error response formats
        if (error.response.data.errors) {
          setValidationErrors(error.response.data.errors);
        } else if (error.response.data.department) {
          setValidationErrors(error.response.data.department);
        } else if (typeof error.response.data === 'object') {
          // Convert object errors to array of strings
          const errors = Object.entries(error.response.data).map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          });
          setValidationErrors(errors);
        } else {
          setValidationErrors(['Failed to save holiday request']);
        }
      } else {
        setValidationErrors(['Failed to save holiday request']);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedHolidayType = holidayTypes.find(ht => ht.id.toString() === formData.holiday_type_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{requestId ? 'Edit' : 'New'} Holiday Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="holiday_type">Holiday Type</Label>
            <Select
              value={formData.holiday_type_id}
              onValueChange={(value) => setFormData({ ...formData, holiday_type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select holiday type">
                  {formData.holiday_type_id && selectedHolidayType && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: selectedHolidayType.color }}
                      />
                      {selectedHolidayType.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {holidayTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                      {type.max_days_per_year && (
                        <span className="text-muted-foreground text-sm ml-2">
                          (Max {type.max_days_per_year} days/year)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department_id}
              onValueChange={(value) => setFormData({ ...formData, department_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    <div className="flex items-center gap-2">
                      {dept.icon && <span>{dept.icon}</span>}
                      <span>{dept.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <div className="w-full">
                <DatePicker
                  selected={formData.start_date ? new Date(formData.start_date) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData({ ...formData, start_date: format(date, 'yyyy-MM-dd') });
                    }
                  }}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select start date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="mt-2">
                <Checkbox
                  id="start_half_day"
                  checked={formData.start_half_day}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, start_half_day: checked as boolean })
                  }
                />
                <Label htmlFor="start_half_day" className="ml-2 text-sm">
                  Start on afternoon
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <div className="w-full">
                <DatePicker
                  selected={formData.end_date ? new Date(formData.end_date) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData({ ...formData, end_date: format(date, 'yyyy-MM-dd') });
                    }
                  }}
                  minDate={formData.start_date ? new Date(formData.start_date) : new Date()}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select end date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div className="mt-2">
                <Checkbox
                  id="end_half_day"
                  checked={formData.end_half_day}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, end_half_day: checked as boolean })
                  }
                />
                <Label htmlFor="end_half_day" className="ml-2 text-sm">
                  End at lunch
                </Label>
              </div>
            </div>
          </div>

          {workingDays > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Total working days: <strong>{workingDays}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for leave..."
              rows={4}
            />
          </div>

          {selectedHolidayType?.code === 'SL' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Sick leave may require a medical certificate for extended periods.
              </AlertDescription>
            </Alert>
          )}

          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conflicts detected:</strong>
                <ul className="list-disc list-inside mt-2">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>{conflict.description}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.holiday_type_id || !formData.department_id || !formData.start_date || !formData.end_date}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !formData.holiday_type_id || !formData.department_id || !formData.start_date || !formData.end_date}
          >
            Submit Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}