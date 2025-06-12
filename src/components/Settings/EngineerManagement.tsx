import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../../hooks/use-toast';
import engineerService from '../../services/engineerService';
import { User, Plus, Phone, MapPin, Award, Clock, Loader2 } from 'lucide-react';

interface UserWithoutProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
}

interface Engineer {
  id: number;
  employee_id: string;
  technician: {
    id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    full_name: string;
  };
  phone_number?: string;
  specialization?: string;
  skills: string[];
  certifications: {
    name: string;
    expiry: string;
  }[];
  status: 'available' | 'busy' | 'offline';
  home_address?: string;
  home_latitude?: number;
  home_longitude?: number;
  created_at: string;
}

const SKILLS_OPTIONS = [
  'electrical',
  'solar',
  'maintenance',
  'troubleshooting',
  'installation',
  'commissioning',
  'testing',
  'repair'
];

const EngineerManagement: React.FC = () => {
  const [usersWithoutProfiles, setUsersWithoutProfiles] = useState<UserWithoutProfile[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithoutProfile | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    phone_number: '',
    specialization: '',
    skills: [] as string[],
    certifications: [] as { name: string; expiry: string }[],
    status: 'available' as 'available' | 'busy' | 'offline',
    home_address: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users without engineer profiles
      const usersResponse = await engineerService.getUsersWithoutProfiles();
      setUsersWithoutProfiles(usersResponse.users || []);
      
      // Fetch existing engineers
      const engineersResponse = await engineerService.getEngineers();
      setEngineers(engineersResponse.results || engineersResponse);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load engineer data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = (user: UserWithoutProfile) => {
    setSelectedUser(user);
    setFormData({
      employee_id: `ENG-${user.id.toString().padStart(4, '0')}`,
      phone_number: '',
      specialization: '',
      skills: [],
      certifications: [],
      status: 'available',
      home_address: ''
    });
    setShowCreateDialog(true);
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAddCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', expiry: '' }]
    }));
  };

  const handleCertificationChange = (index: number, field: 'name' | 'expiry', value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleCreateEngineer = async () => {
    if (!selectedUser) return;
    
    setCreating(true);
    try {
      await engineerService.createEngineerFromUser({
        user_id: selectedUser.id,
        ...formData
      });
      
      toast({
        title: "Success",
        description: `Engineer profile created for ${selectedUser.full_name}`
      });
      
      setShowCreateDialog(false);
      setSelectedUser(null);
      fetchData(); // Refresh the lists
    } catch (error) {
      console.error('Failed to create engineer:', error);
      toast({
        title: "Error",
        description: "Failed to create engineer profile",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users without profiles */}
      {usersWithoutProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users Requiring Engineer Setup</CardTitle>
            <CardDescription>
              These users are in the Engineers group but don't have engineer profiles yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithoutProfiles.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "success" : "secondary"}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => handleCreateClick(user)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Existing engineers */}
      <Card>
        <CardHeader>
          <CardTitle>Active Engineers</CardTitle>
          <CardDescription>
            Manage existing engineer profiles and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {engineers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No engineers configured yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Home Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map(engineer => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">{engineer.employee_id}</TableCell>
                    <TableCell>{engineer.technician.full_name}</TableCell>
                    <TableCell>{engineer.specialization || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {engineer.skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(engineer.status)}>
                        {engineer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {engineer.home_address || '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Engineer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Engineer Profile</DialogTitle>
            <DialogDescription>
              Create an engineer profile for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="ENG-0001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+44..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="home_address">
                <MapPin className="h-4 w-4 inline mr-1" />
                Home Address
              </Label>
              <Input
                id="home_address"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                placeholder="123 Main Street, London, SW1A 1AA"
              />
              <p className="text-sm text-gray-500">
                This address will be geocoded and used as the start/end point for route planning
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="Solar Panel Installation"
              />
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_OPTIONS.map(skill => (
                  <Badge
                    key={skill}
                    variant={formData.skills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  <Award className="h-4 w-4 inline mr-1" />
                  Certifications
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddCertification}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Certification
                </Button>
              </div>
              <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Certification name"
                      value={cert.name}
                      onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="Expiry date"
                      value={cert.expiry}
                      onChange={(e) => handleCertificationChange(index, 'expiry', e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCertification(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'available' | 'busy' | 'offline') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEngineer}
              disabled={creating || !formData.employee_id || !formData.phone_number}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Engineer Profile'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EngineerManagement;