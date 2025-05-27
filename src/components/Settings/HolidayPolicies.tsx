import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Copy, AlertCircle } from 'lucide-react';
import { holidayService, HolidayType, HolidayPolicy } from '@/services/holidayService';

interface Department {
  id: number;
  name: string;
}

export default function HolidayPolicies() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedHolidayType, setSelectedHolidayType] = useState<string>('');
  const [policy, setPolicy] = useState<HolidayPolicy | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Policy form state
  const [formData, setFormData] = useState({
    default_annual_entitlement: 25,
    pro_rata_calculation: true,
    carry_over_days: 5,
    carry_over_expiry_months: 3,
    min_notice_days: 14,
    max_consecutive_days: 20,
    max_advance_booking_days: 365,
    allow_negative_balance: false,
    auto_approve_threshold_days: 2,
    require_manager_approval: true,
    require_hr_approval_over_days: 10,
    blackout_periods_enabled: false,
    is_global_policy: false,
    effective_from: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedHolidayType) {
      loadPolicy();
    }
  }, [selectedDepartment, selectedHolidayType]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [typesData, deptsData] = await Promise.all([
        holidayService.getHolidayTypes(),
        holidayService.getDepartments()
      ]);

      setHolidayTypes(typesData.results.filter(ht => ht.is_active));
      setDepartments(deptsData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPolicy = async () => {
    try {
      const policies = await holidayService.getPolicies({
        department_id: selectedDepartment === 'global' ? null : parseInt(selectedDepartment),
        holiday_type_id: parseInt(selectedHolidayType)
      });

      if (policies.results.length > 0) {
        const existingPolicy = policies.results[0];
        setPolicy(existingPolicy);
        setFormData({
          default_annual_entitlement: existingPolicy.default_annual_entitlement,
          pro_rata_calculation: existingPolicy.pro_rata_calculation,
          carry_over_days: existingPolicy.carry_over_days,
          carry_over_expiry_months: existingPolicy.carry_over_expiry_months,
          min_notice_days: existingPolicy.min_notice_days,
          max_consecutive_days: existingPolicy.max_consecutive_days,
          max_advance_booking_days: existingPolicy.max_advance_booking_days,
          allow_negative_balance: existingPolicy.allow_negative_balance,
          auto_approve_threshold_days: existingPolicy.auto_approve_threshold_days,
          require_manager_approval: existingPolicy.require_manager_approval,
          require_hr_approval_over_days: existingPolicy.require_hr_approval_over_days || 10,
          blackout_periods_enabled: existingPolicy.blackout_periods_enabled,
          is_global_policy: existingPolicy.is_global_policy,
          effective_from: existingPolicy.effective_from
        });
      } else {
        setPolicy(null);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = {
        ...formData,
        department_id: selectedDepartment === 'global' ? null : parseInt(selectedDepartment),
        holiday_type_id: parseInt(selectedHolidayType),
        is_global_policy: selectedDepartment === 'global'
      };

      if (policy) {
        await holidayService.updatePolicy(policy.id, data);
        setSuccess('Policy updated successfully');
      } else {
        await holidayService.createPolicy(data);
        setSuccess('Policy created successfully');
      }

      loadPolicy();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToOtherDepartments = async () => {
    if (!policy) return;

    try {
      await holidayService.copyPolicy(policy.id, {
        department_ids: departments.filter(d => d.id.toString() !== selectedDepartment).map(d => d.id)
      });
      setSuccess('Policy copied to all other departments');
    } catch (error) {
      setError('Failed to copy policy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Holiday Policies</h2>
        <p className="text-muted-foreground mt-1">
          Configure holiday policies for different departments and holiday types
        </p>
      </div>

      {/* Selectors */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (All Departments)</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Holiday Type</Label>
              <Select value={selectedHolidayType} onValueChange={setSelectedHolidayType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent>
                  {holidayTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Policy Configuration */}
      {selectedDepartment && selectedHolidayType && (
        <Card>
          <CardHeader>
            <CardTitle>Policy Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entitlements" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entitlements">Entitlements</TabsTrigger>
                <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                <TabsTrigger value="approval">Approval</TabsTrigger>
              </TabsList>

              <TabsContent value="entitlements" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default Annual Entitlement (days)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.default_annual_entitlement}
                      onChange={(e) => setFormData({
                        ...formData,
                        default_annual_entitlement: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>Carry Over Days</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.carry_over_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        carry_over_days: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Carry Over Expiry (months)</Label>
                    <Input
                      type="number"
                      value={formData.carry_over_expiry_months}
                      onChange={(e) => setFormData({
                        ...formData,
                        carry_over_expiry_months: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      checked={formData.pro_rata_calculation}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        pro_rata_calculation: checked
                      })}
                    />
                    <Label>Pro-rata calculation for part-time/new starters</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="restrictions" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Notice Days</Label>
                    <Input
                      type="number"
                      value={formData.min_notice_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        min_notice_days: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>Max Consecutive Days</Label>
                    <Input
                      type="number"
                      value={formData.max_consecutive_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_consecutive_days: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Advance Booking Days</Label>
                    <Input
                      type="number"
                      value={formData.max_advance_booking_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_advance_booking_days: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      checked={formData.allow_negative_balance}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        allow_negative_balance: checked
                      })}
                    />
                    <Label>Allow negative balance</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.blackout_periods_enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      blackout_periods_enabled: checked
                    })}
                  />
                  <Label>Enable blackout periods</Label>
                </div>
              </TabsContent>

              <TabsContent value="approval" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Auto-approve threshold (days)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.auto_approve_threshold_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        auto_approve_threshold_days: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label>Require HR approval over (days)</Label>
                    <Input
                      type="number"
                      value={formData.require_hr_approval_over_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        require_hr_approval_over_days: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.require_manager_approval}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      require_manager_approval: checked
                    })}
                  />
                  <Label>Require manager approval</Label>
                </div>

                <div>
                  <Label>Effective From</Label>
                  <Input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({
                      ...formData,
                      effective_from: e.target.value
                    })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6">
              <div>
                {policy && selectedDepartment !== 'global' && (
                  <Button
                    variant="outline"
                    onClick={handleCopyToOtherDepartments}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Other Departments
                  </Button>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : (policy ? 'Update Policy' : 'Create Policy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}