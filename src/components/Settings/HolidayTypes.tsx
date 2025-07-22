import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, AlertCircle, Calendar, Palette } from 'lucide-react';
import { holidayService } from '@/services/holidayService';

interface HolidayType {
  id: number;
  name: string;
  code: string;
  color: string;
  requires_approval: boolean;
  max_days_per_year?: number;
  is_active: boolean;
}

interface FormData {
  name: string;
  code: string;
  color: string;
  requires_approval: boolean;
  max_days_per_year: string;
  is_active: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export default function HolidayTypes() {
  const [loading, setLoading] = useState(false);
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<HolidayType | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    color: '#3B82F6',
    requires_approval: true,
    max_days_per_year: '',
    is_active: true
  });

  useEffect(() => {
    loadHolidayTypes();
  }, []);

  const loadHolidayTypes = async () => {
    setLoading(true);
    try {
      const response = await holidayService.getHolidayTypes();
      setHolidayTypes(response.results);
    } catch (error) {
      console.error('Failed to load holiday types:', error);
      setError('Failed to load holiday types');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: HolidayType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        code: type.code,
        color: type.color || '#3B82F6',
        requires_approval: type.requires_approval,
        max_days_per_year: type.max_days_per_year?.toString() || '',
        is_active: type.is_active
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        code: '',
        color: '#3B82F6',
        requires_approval: true,
        max_days_per_year: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      color: '#3B82F6',
      requires_approval: true,
      max_days_per_year: '',
      is_active: true
    });
    setError('');
  };

  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 10);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name || !formData.code) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if code already exists (if not editing or code changed)
    if (!editingType || editingType.code !== formData.code) {
      const exists = holidayTypes.some(t => t.code === formData.code);
      if (exists) {
        setError('A holiday type with this code already exists');
        return;
      }
    }

    try {
      const data = {
        name: formData.name,
        code: formData.code,
        color: formData.color,
        requires_approval: formData.requires_approval,
        max_days_per_year: formData.max_days_per_year ? parseInt(formData.max_days_per_year) : null,
        is_active: formData.is_active
      };

      if (editingType) {
        await holidayService.updateHolidayType(editingType.id, data);
      } else {
        await holidayService.createHolidayType(data);
      }

      handleCloseModal();
      loadHolidayTypes();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save holiday type');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this holiday type? This may affect existing policies and entitlements.')) {
      try {
        await holidayService.deleteHolidayType(id);
        loadHolidayTypes();
      } catch (error) {
        console.error('Failed to delete holiday type:', error);
        setError('Failed to delete holiday type. It may be in use.');
      }
    }
  };

  const handleToggleActive = async (type: HolidayType) => {
    try {
      await holidayService.updateHolidayType(type.id, {
        ...type,
        is_active: !type.is_active
      });
      loadHolidayTypes();
    } catch (error) {
      console.error('Failed to update holiday type:', error);
      setError('Failed to update holiday type');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Holiday Types</h2>
          <p className="text-muted-foreground">Configure different types of leave available to employees</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday Type
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Holiday Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
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
                  <TableHead>Code</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Approval Required</TableHead>
                  <TableHead>Max Days/Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidayTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No holiday types found. Click "Add Holiday Type" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  holidayTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: type.color }} />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{type.code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm text-muted-foreground">{type.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {type.requires_approval ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {type.max_days_per_year || 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={type.is_active}
                          onCheckedChange={() => handleToggleActive(type)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(type)}
                          className="mr-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          disabled={!type.is_active}
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
              {editingType ? 'Edit Holiday Type' : 'Add Holiday Type'}
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
              <Label htmlFor="name">Type Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    code: !editingType ? generateCode(e.target.value) : formData.code
                  });
                }}
                placeholder="e.g., Annual Leave, Sick Leave"
              />
            </div>

            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., ANNUAL, SICK"
                maxLength={10}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Unique identifier for this holiday type (max 10 characters)
              </p>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <div className="flex gap-1">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Used to visually distinguish this type in calendars and lists
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requires_approval">Requires Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Whether requests need manager approval
                </p>
              </div>
              <Switch
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, requires_approval: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="max_days">Maximum Days Per Year (Optional)</Label>
              <Input
                id="max_days"
                type="number"
                value={formData.max_days_per_year}
                onChange={(e) => setFormData({ ...formData, max_days_per_year: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum days an employee can take of this type per year
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive types cannot be used for new requests
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}