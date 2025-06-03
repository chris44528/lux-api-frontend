import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginatedUserSelect } from '@/components/ui/paginated-user-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { holidayService, HolidayType, HolidayEntitlement } from '@/services/holidayService';

interface User {
  id: number;
  username: string;
  full_name: string;
  department: string;
}

export default function HolidayEntitlements() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [entitlements, setEntitlements] = useState<HolidayEntitlement[]>([]);
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntitlement, setEditingEntitlement] = useState<HolidayEntitlement | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    holiday_type_id: '',
    total_days: '',
    year: selectedYear
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entitlementsData, typesData] = await Promise.all([
        holidayService.getEntitlements({ year: selectedYear }),
        holidayService.getHolidayTypes()
      ]);

      setEntitlements(entitlementsData.results);
      setHolidayTypes(typesData.results.filter(ht => ht.is_active));
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (entitlement?: HolidayEntitlement) => {
    if (entitlement) {
      setEditingEntitlement(entitlement);
      setFormData({
        user_id: entitlement.user.id.toString(),
        holiday_type_id: entitlement.holiday_type.id.toString(),
        total_days: entitlement.total_days.toString(),
        year: entitlement.year
      });
    } else {
      setEditingEntitlement(null);
      setFormData({
        user_id: '',
        holiday_type_id: '',
        total_days: '',
        year: selectedYear
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntitlement(null);
    setFormData({
      user_id: '',
      holiday_type_id: '',
      total_days: '',
      year: selectedYear
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const data = {
        user_id: parseInt(formData.user_id),
        holiday_type_id: parseInt(formData.holiday_type_id),
        total_days: parseFloat(formData.total_days),
        year: formData.year
      };

      if (editingEntitlement) {
        await holidayService.updateEntitlement(editingEntitlement.id, data);
      } else {
        await holidayService.createEntitlement(data);
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save entitlement');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entitlement?')) {
      try {
        await holidayService.deleteEntitlement(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete entitlement:', error);
        setError('Failed to delete entitlement');
      }
    }
  };

  const filteredEntitlements = entitlements.filter(entitlement => {
    const user = entitlement.user;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.full_name.toLowerCase().includes(searchLower) ||
      user.department.toLowerCase().includes(searchLower) ||
      entitlement.holiday_type.name.toLowerCase().includes(searchLower)
    );
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Holiday Entitlements</h2>
          <p className="text-muted-foreground mt-1">
            Manage user holiday entitlements and balances
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entitlement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative flex items-center">
                <Search className="absolute left-3 pointer-events-none z-10 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by user, department, or holiday type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Entitlements Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Holiday Type</TableHead>
                <TableHead className="text-center">Total Days</TableHead>
                <TableHead className="text-center">Used</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">Remaining</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEntitlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No entitlements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntitlements.map((entitlement) => (
                  <TableRow key={entitlement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entitlement.user.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entitlement.user.username}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{entitlement.user.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entitlement.holiday_type.color }}
                        />
                        {entitlement.holiday_type.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {entitlement.total_days}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{entitlement.days_taken}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{entitlement.days_pending}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={entitlement.days_remaining > 0 ? "default" : "destructive"}
                      >
                        {entitlement.days_remaining}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(entitlement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entitlement.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntitlement ? 'Edit Entitlement' : 'Add Entitlement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User</Label>
              <PaginatedUserSelect
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                disabled={!!editingEntitlement}
                placeholder="Select user"
              />
            </div>

            <div>
              <Label htmlFor="holiday_type">Holiday Type</Label>
              <Select
                value={formData.holiday_type_id}
                onValueChange={(value) => setFormData({ ...formData, holiday_type_id: value })}
                disabled={!!editingEntitlement}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent>
                  {holidayTypes.map((type) => (
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

            <div>
              <Label htmlFor="total_days">Total Days</Label>
              <Input
                id="total_days"
                type="number"
                step="0.5"
                value={formData.total_days}
                onChange={(e) => setFormData({ ...formData, total_days: e.target.value })}
                placeholder="e.g., 25"
              />
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                disabled={!!editingEntitlement}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.user_id || !formData.holiday_type_id || !formData.total_days}
            >
              {editingEntitlement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}