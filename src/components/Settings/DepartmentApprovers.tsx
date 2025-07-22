import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Edit2, Trash2, AlertCircle, Users, Shield, Building } from 'lucide-react';
import { holidayService, DepartmentApprover } from '@/services/holidayService';
import { getUsers, User } from '@/services/userService';

interface Department {
  id: number;
  name: string;
}

interface FormData {
  department_id: string;
  approver_id: string;
  is_primary: boolean;
  can_approve_own_department: boolean;
  max_days_can_approve: string;
}

export default function DepartmentApprovers() {
  const [loading, setLoading] = useState(false);
  const [approvers, setApprovers] = useState<DepartmentApprover[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApprover, setEditingApprover] = useState<DepartmentApprover | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    department_id: '',
    approver_id: '',
    is_primary: false,
    can_approve_own_department: true,
    max_days_can_approve: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [approversData, deptsData, usersData] = await Promise.all([
        holidayService.getApprovers(),
        holidayService.getDepartments(),
        getUsers(1, { search: '' })
      ]);
      setApprovers(approversData.results);
      setDepartments(deptsData.results);
      setUsers(usersData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load department approvers');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = async (search: string) => {
    try {
      const usersData = await getUsers(1, { search });
      setUsers(usersData.results);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleOpenModal = (approver?: DepartmentApprover) => {
    if (approver) {
      setEditingApprover(approver);
      setFormData({
        department_id: approver.department.id.toString(),
        approver_id: approver.approver.id.toString(),
        is_primary: approver.is_primary || false,
        can_approve_own_department: approver.can_approve_own_department ?? true,
        max_days_can_approve: approver.max_days_can_approve?.toString() || ''
      });
    } else {
      setEditingApprover(null);
      setFormData({
        department_id: '',
        approver_id: '',
        is_primary: false,
        can_approve_own_department: true,
        max_days_can_approve: ''
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApprover(null);
    setFormData({
      department_id: '',
      approver_id: '',
      is_primary: false,
      can_approve_own_department: true,
      max_days_can_approve: ''
    });
    setError('');
    setSearchTerm('');
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.department_id || !formData.approver_id) {
      setError('Please select both department and approver');
      return;
    }

    // Check if this combination already exists (if not editing)
    if (!editingApprover) {
      const exists = approvers.some(
        a => a.department.id.toString() === formData.department_id && 
             a.approver.id.toString() === formData.approver_id
      );
      
      if (exists) {
        setError('This user is already an approver for this department');
        return;
      }
    }

    try {
      const data = {
        department_id: parseInt(formData.department_id),
        approver_id: parseInt(formData.approver_id),
        is_primary: formData.is_primary,
        can_approve_own_department: formData.can_approve_own_department,
        max_days_can_approve: formData.max_days_can_approve ? parseInt(formData.max_days_can_approve) : null
      };

      if (editingApprover) {
        // For update, we need to remove and re-add since the API doesn't support update
        await holidayService.removeApprover(editingApprover.id);
        await holidayService.addApprover(data);
      } else {
        await holidayService.addApprover(data);
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save approver');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this approver?')) {
      try {
        await holidayService.removeApprover(id);
        loadData();
      } catch (error) {
        console.error('Failed to remove approver:', error);
        setError('Failed to remove approver');
      }
    }
  };

  // Group approvers by department
  const approversByDepartment = approvers.reduce((acc, approver) => {
    const deptId = approver.department.id;
    if (!acc[deptId]) {
      acc[deptId] = {
        department: approver.department,
        approvers: []
      };
    }
    acc[deptId].approvers.push(approver);
    return acc;
  }, {} as Record<number, { department: Department; approvers: DepartmentApprover[] }>);

  // Find departments without approvers
  const departmentsWithoutApprovers = departments.filter(
    dept => !approversByDepartment[dept.id]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Department Approvers</h2>
          <p className="text-muted-foreground">Manage who can approve holiday requests for each department</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Approver
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warning for departments without approvers */}
      {departmentsWithoutApprovers.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> The following departments have no approvers: {' '}
            {departmentsWithoutApprovers.map(d => d.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Approvers by Department */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : Object.keys(approversByDepartment).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No department approvers configured. Click "Add Approver" to get started.
            </CardContent>
          </Card>
        ) : (
          Object.values(approversByDepartment).map(({ department, approvers }) => (
            <Card key={department.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {department.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Approver</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Max Days</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvers.map((approver) => (
                      <TableRow key={approver.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {approver.approver.username}
                            {approver.approver.first_name && approver.approver.last_name && (
                              <span className="text-muted-foreground">
                                ({approver.approver.first_name} {approver.approver.last_name})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {approver.is_primary ? (
                            <Badge variant="default">
                              <Shield className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          ) : (
                            <Badge variant="outline">Secondary</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {approver.can_approve_own_department ? (
                            <span className="text-green-600">Can approve own dept</span>
                          ) : (
                            <span className="text-orange-600">Cannot approve own dept</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {approver.max_days_can_approve || 'Unlimited'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(approver)}
                            className="mr-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(approver.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingApprover ? 'Edit Approver' : 'Add Department Approver'}
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
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                disabled={!!editingApprover}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approver">Approver *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.length > 2) {
                      loadMoreUsers(e.target.value);
                    }
                  }}
                  disabled={!!editingApprover}
                />
                <Select 
                  value={formData.approver_id} 
                  onValueChange={(value) => setFormData({ ...formData, approver_id: value })}
                  disabled={!!editingApprover}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username}
                        {user.first_name && user.last_name && (
                          <span className="text-muted-foreground ml-2">
                            ({user.first_name} {user.last_name})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_primary: checked as boolean })
                  }
                />
                <Label htmlFor="is_primary" className="font-normal cursor-pointer">
                  Primary approver for this department
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_approve_own"
                  checked={formData.can_approve_own_department}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, can_approve_own_department: checked as boolean })
                  }
                />
                <Label htmlFor="can_approve_own" className="font-normal cursor-pointer">
                  Can approve requests from own department
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="max_days">Maximum Days Can Approve (Optional)</Label>
              <Input
                id="max_days"
                type="number"
                value={formData.max_days_can_approve}
                onChange={(e) => setFormData({ ...formData, max_days_can_approve: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Limit the maximum number of consecutive days this approver can approve
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingApprover ? 'Update' : 'Add Approver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}