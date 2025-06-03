import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { holidayService, PublicHoliday } from '@/services/holidayService';
import { format } from 'date-fns';

export default function PublicHolidays() {
  const [loading, setLoading] = useState(false);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    is_recurring: false,
    country: 'UK',
    applies_to_all: true
  });

  useEffect(() => {
    loadPublicHolidays();
  }, []);

  const loadPublicHolidays = async () => {
    setLoading(true);
    try {
      const data = await holidayService.getPublicHolidays();
      setPublicHolidays(data.results);
    } catch (error) {
      console.error('Failed to load public holidays:', error);
      setError('Failed to load public holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (holiday?: PublicHoliday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date,
        is_recurring: holiday.is_recurring,
        country: holiday.country,
        applies_to_all: holiday.applies_to_all
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: '',
        is_recurring: false,
        country: 'UK',
        applies_to_all: true
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: '',
      is_recurring: false,
      country: 'UK',
      applies_to_all: true
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingHoliday) {
        await holidayService.updatePublicHoliday(editingHoliday.id, formData);
      } else {
        await holidayService.createPublicHoliday(formData);
      }

      handleCloseModal();
      loadPublicHolidays();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save public holiday');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this public holiday?')) {
      try {
        await holidayService.deletePublicHoliday(id);
        loadPublicHolidays();
      } catch (error) {
        console.error('Failed to delete public holiday:', error);
        setError('Failed to delete public holiday');
      }
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Public Holidays</h2>
          <p className="text-muted-foreground">Manage public holidays that apply to all employees</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Public Holiday
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Public Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Public Holidays</CardTitle>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicHolidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No public holidays found
                    </TableCell>
                  </TableRow>
                ) : (
                  publicHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>{format(new Date(holiday.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Switch checked={holiday.is_recurring} disabled />
                      </TableCell>
                      <TableCell>{holiday.country}</TableCell>
                      <TableCell>
                        {holiday.applies_to_all ? 'All Employees' : 'Selected Groups'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(holiday)}
                          className="mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(holiday.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHoliday ? 'Edit Public Holiday' : 'Add Public Holiday'}
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
              <Label htmlFor="name">Holiday Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Christmas Day"
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label htmlFor="recurring">Recurring Annual Holiday</Label>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="EU">European Union</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="applies_to_all"
                checked={formData.applies_to_all}
                onCheckedChange={(checked) => setFormData({ ...formData, applies_to_all: checked })}
              />
              <Label htmlFor="applies_to_all">Applies to All Employees</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingHoliday ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}