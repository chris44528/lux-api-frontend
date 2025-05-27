import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Trash, PlusCircle, Filter, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

import api from '../../services/api';

// API service functions using the authenticated api service
const getGroups = async () => {
  try {
    const response = await api.get('/groups/');
    // Ensure we return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      // Handle paginated response
      return data.results;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Failed to fetch groups');
  }
};

const getGroupDataFilters = async (groupId: string) => {
  try {
    const response = await api.get(`/users/group-data-filters/?group_id=${groupId}`);
    // Ensure we return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      // Handle paginated response
      return data.results;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Failed to fetch data filters');
  }
};

const getAvailableFilterTypes = async () => {
  try {
    const response = await api.get('/users/group-data-filters/available_filter_types/');
    const data = response.data;
    return data || {};
  } catch (error) {
    return {};
  }
};

const addGroupDataFilter = async (filter: {
  group: string;
  filter_type: string;
  filter_value: string;
  is_inclusive: boolean;
}) => {
  try {
    const response = await api.post('/users/group-data-filters/', filter);
    return response.data;
  } catch (error) {
    throw new Error('Failed to add data filter');
  }
};

const deleteGroupDataFilter = async (filterId: string) => {
  try {
    await api.delete(`/users/group-data-filters/${filterId}/`);
    return true;
  } catch (error) {
    throw new Error('Failed to delete data filter');
  }
};

// Get FCO values for the filter dropdown
const getFcoValues = async () => {
  try {
    const response = await api.get('/get-fco-list/');
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.fcos)) {
      return data.fcos;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

interface Group {
  id: string;
  name: string;
}

interface DataFilter {
  id: string;
  group: string;
  group_name?: string;
  filter_type: string;
  filter_type_display: string;
  filter_value: string;
  is_inclusive: boolean;
}

export function GroupDataFilters() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [dataFilters, setDataFilters] = useState<DataFilter[]>([]);
  const [filterTypes, setFilterTypes] = useState<Record<string, string>>({});
  const [fcoValues, setFcoValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFilter, setNewFilter] = useState({
    group: '',
    filter_type: '',
    filter_value: '',
    is_inclusive: true,
  });
  const { toast } = useToast();

  // Load groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupsData, filterTypesData, fcoValuesData] = await Promise.all([
          getGroups(),
          getAvailableFilterTypes(),
          getFcoValues()
        ]);
        
        
        setGroups(groupsData);
        setFilterTypes(filterTypesData);
        setFcoValues(fcoValuesData);

        if (Array.isArray(groupsData) && groupsData.length > 0) {
          setSelectedGroup(groupsData[0].id);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load groups data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only run on mount

  // Load data filters when selected group changes
  useEffect(() => {
    const fetchFilters = async () => {
      if (!selectedGroup) return;

      try {
        setLoading(true);
        const filtersData = await getGroupDataFilters(selectedGroup);
        setDataFilters(filtersData);
        setNewFilter((prev) => ({ ...prev, group: selectedGroup }));
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data filters',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, [selectedGroup]); // Only depend on selectedGroup

  const handleAddFilter = async () => {
    try {
      setLoading(true);
      const result = await addGroupDataFilter(newFilter);
      setDataFilters(Array.isArray(dataFilters) ? [...dataFilters, result] : [result]);
      setDialogOpen(false);
      setNewFilter({
        group: selectedGroup,
        filter_type: '',
        filter_value: '',
        is_inclusive: true,
      });
      toast({
        title: 'Success',
        description: 'Data filter added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add data filter',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    try {
      setLoading(true);
      await deleteGroupDataFilter(filterId);
      setDataFilters(Array.isArray(dataFilters) ? dataFilters.filter((filter) => filter.id !== filterId) : []);
      toast({
        title: 'Success',
        description: 'Data filter deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete data filter',
      });
    } finally {
      setLoading(false);
    }
  };

  const inclusiveFilters = Array.isArray(dataFilters) ? dataFilters.filter((f) => f.is_inclusive) : [];
  const exclusiveFilters = Array.isArray(dataFilters) ? dataFilters.filter((f) => !f.is_inclusive) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Filter className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Filters</h2>
            <p className="text-gray-600 dark:text-gray-400">Control data access for user groups based on FCO and other criteria</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Users className="h-3 w-3 mr-1" />
            {Array.isArray(groups) ? groups.length : 0} Groups
          </Badge>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            <Filter className="h-3 w-3 mr-1" />
            {Array.isArray(dataFilters) ? dataFilters.length : 0} Filters
          </Badge>
        </div>
      </div>

      {/* Status Alert */}
      {Array.isArray(dataFilters) && dataFilters.length === 0 && selectedGroup && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data filters configured for this group. Users will have access to all data.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Filter className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span>Filter Configuration</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure data access restrictions for user groups
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Group selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Group</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select the group to configure data filters for</p>
              </div>
              {selectedGroup && Array.isArray(groups) && (
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {groups.find(g => g.id === selectedGroup)?.name}
                </Badge>
              )}
            </div>
            <Select
              value={selectedGroup}
              onValueChange={(value) => setSelectedGroup(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Choose a group to configure filters..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(groups) && groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{group.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters section with inclusive/exclusive tabs */}
          {selectedGroup ? (
            <Tabs defaultValue="inclusive" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="inclusive" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
                    <CheckCircle className="h-4 w-4" />
                    <span>Allow ({inclusiveFilters.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="exclusive" className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">
                    <AlertCircle className="h-4 w-4" />
                    <span>Block ({exclusiveFilters.length})</span>
                  </TabsTrigger>
                </TabsList>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Filter</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">Add Data Filter</DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Create a new filter rule for {Array.isArray(groups) ? groups.find(g => g.id === selectedGroup)?.name : 'selected group'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Filter Type</label>
                        <Select
                          value={newFilter.filter_type}
                          onValueChange={(value) => setNewFilter({ ...newFilter, filter_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select filter type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(filterTypes).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Filter Value</label>
                        {newFilter.filter_type === 'site_fco' ? (
                          <Select
                            value={newFilter.filter_value}
                            onValueChange={(value) => setNewFilter({ ...newFilter, filter_value: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select FCO value" />
                            </SelectTrigger>
                            <SelectContent>
                              {fcoValues.map((fco) => (
                                <SelectItem key={fco} value={fco}>
                                  {fco}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={newFilter.filter_value}
                            onChange={(e) => setNewFilter({ ...newFilter, filter_value: e.target.value })}
                            placeholder="Enter filter value"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Filter Mode</label>
                        <Select
                          value={newFilter.is_inclusive ? 'inclusive' : 'exclusive'}
                          onValueChange={(value) =>
                            setNewFilter({ ...newFilter, is_inclusive: value === 'inclusive' })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inclusive">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Allow access (show only these)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="exclusive">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span>Block access (hide these)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddFilter} 
                        disabled={!newFilter.filter_type || !newFilter.filter_value || loading}
                      >
                        {loading ? 'Adding...' : 'Add Filter'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Inclusive filters tab */}
              <TabsContent value="inclusive" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Allow Access Rules
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Users in this group will ONLY see records matching these filters
                  </p>
                </div>

                {loading ? (
                  <div className="text-center p-4">Loading filters...</div>
                ) : inclusiveFilters.length > 0 ? (
                  <div className="space-y-2">
                    {inclusiveFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{filter.filter_type_display}</span>
                              <Badge variant="outline" className="bg-white dark:bg-gray-700 border-green-300 dark:border-green-600 text-green-700 dark:text-green-400">
                                {filter.filter_value}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Show only records where {filter.filter_type_display.toLowerCase()} equals "{filter.filter_value}"</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No allow rules configured</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Users can see all data (no restrictions)</p>
                  </div>
                )}
              </TabsContent>

              {/* Exclusive filters tab */}
              <TabsContent value="exclusive" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Block Access Rules
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Users in this group will NOT see records matching these filters
                  </p>
                </div>

                {loading ? (
                  <div className="text-center p-4">Loading filters...</div>
                ) : exclusiveFilters.length > 0 ? (
                  <div className="space-y-2">
                    {exclusiveFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{filter.filter_type_display}</span>
                              <Badge variant="outline" className="bg-white dark:bg-gray-700 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400">
                                {filter.filter_value}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Hide records where {filter.filter_type_display.toLowerCase()} equals "{filter.filter_value}"</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No block rules configured</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">No data is being hidden from users</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No group selected</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Choose a group to configure data filters</p>
            </div>
          )}

          {/* Help section */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              How Data Filters Work
            </h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Allow filters:</strong> Users only see records matching these criteria (whitelist approach)
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Block filters:</strong> Users don't see records matching these criteria (blacklist approach)
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Filter className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>FCO filtering:</strong> Control access to sites based on their FCO (First Contact Officer) value
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GroupDataFilters;