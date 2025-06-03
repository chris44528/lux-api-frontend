import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Plus, Edit2, Trash2, AlertCircle, Ban } from 'lucide-react';
import { holidayService, BlackoutPeriod } from '@/services/holidayService';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function BlackoutPeriods() {
  const [loading, setLoading] = useState(false);
  const [blackoutPeriods, setBlackoutPeriods] = useState<BlackoutPeriod[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BlackoutPeriod | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    reason: '',
    department_id: '',
    applies_to_all: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [periodsData, deptsData] = await Promise.all([
        holidayService.getBlackoutPeriods(),
        holidayService.getDepartments()
      ]);
      setBlackoutPeriods(periodsData.results);
      setDepartments(deptsData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load blackout periods');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (period?: BlackoutPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setFormData({
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        reason: period.reason || '',
        department_id: period.department_id?.toString() || '',
        applies_to_all: period.applies_to_all
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        reason: '',
        department_id: '',
        applies_to_all: false
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPeriod(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      reason: '',
      department_id: '',
      applies_to_all: false
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const data = {
        ...formData,
        department_id: formData.applies_to_all ? null : (formData.department_id ? parseInt(formData.department_id) : null)
      };

      if (editingPeriod) {
        await holidayService.updateBlackoutPeriod(editingPeriod.id, data);
      } else {
        await holidayService.createBlackoutPeriod(data);
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save blackout period');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this blackout period?')) {
      try {
        await holidayService.deleteBlackoutPeriod(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete blackout period:', error);
        setError('Failed to delete blackout period');
      }
    }
  };


  const isActive = (period: BlackoutPeriod) => {
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Blackout Periods</h2>
          <p className="text-muted-foreground">Define periods when holiday requests are restricted</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Blackout Period
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Blackout Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blackout Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blackoutPeriods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No blackout periods found
                    </TableCell>
                  </TableRow>
                ) : (
                  blackoutPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-destructive" />
                          {period.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(period.start_date), 'dd MMM yyyy')} - {format(new Date(period.end_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {period.applies_to_all ? 'All Departments' : (period.department?.name || 'Specific Department')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {period.reason || '-'}
                      </TableCell>
                      <TableCell>
                        {isActive(period) ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(period)}
                          className="mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(period.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? 'Edit Blackout Period' : 'Add Blackout Period'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="name">Period Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Year End Freeze"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="applies_to">Applies To</Label>
              <Select 
                value={formData.applies_to_all ? 'all' : formData.department_id} 
                onValueChange={(value) => {
                  if (value === 'all') {
                    setFormData({ ...formData, applies_to_all: true, department_id: '' });
                  } else {
                    setFormData({ ...formData, applies_to_all: false, department_id: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain why this period is blocked..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPeriod ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}