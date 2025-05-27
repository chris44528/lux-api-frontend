import { useState, useEffect } from 'react';
import { UserGroup } from '../../types/user';
import { uiPermissionService, PermissionNode } from '../../services/uiPermissionService';
import * as userService from '../../services/userService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../../hooks/use-toast';
import { 
  Loader2, 
  Search, 
  Save, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';

interface PermissionTreeItemProps {
  node: PermissionNode;
  level: number;
  onToggle: (codename: string, granted: boolean) => void;
  searchQuery: string;
}

function PermissionTreeItem({ node, level, onToggle, searchQuery }: PermissionTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  // Highlight search matches
  const isMatch = searchQuery && (
    node.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${isMatch ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
      <div
        className={`flex items-center py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded`}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mr-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        
        <Checkbox
          id={node.codename}
          checked={node.is_granted || false}
          onCheckedChange={(checked) => onToggle(node.codename, checked as boolean)}
          className="mr-3"
        />
        
        <div className="flex-1">
          <Label
            htmlFor={node.codename}
            className="cursor-pointer flex items-center gap-2"
          >
            <span className="font-medium">{node.name}</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {node.codename}
            </code>
          </Label>
          {node.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {node.description}
            </p>
          )}
        </div>
        
        <div className="ml-2">
          {node.is_granted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-300" />
          )}
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <PermissionTreeItem
              key={child.codename}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function UIPermissionsManagement() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [modifiedPermissions, setModifiedPermissions] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFromGroup, setCopyFromGroup] = useState<string>('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadPermissionTree(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const groupData = await userService.getGroups();
      setGroups(groupData);
      if (groupData.length > 0) {
        setSelectedGroup(groupData[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load groups"
      });
    }
  };

  const loadPermissionTree = async (groupId: number) => {
    try {
      setLoading(true);
      const tree = await uiPermissionService.getPermissionTree(groupId);
      setPermissionTree(tree);
      setModifiedPermissions(new Map());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load permissions"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (codename: string, granted: boolean) => {
    setModifiedPermissions(prev => {
      const newMap = new Map(prev);
      newMap.set(codename, granted);
      return newMap;
    });

    // Update the tree to reflect the change
    const updateTree = (nodes: PermissionNode[]): PermissionNode[] => {
      return nodes.map(node => {
        if (node.codename === codename) {
          return { ...node, is_granted: granted };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };

    setPermissionTree(updateTree(permissionTree));
  };

  const handleSave = async () => {
    if (!selectedGroup || modifiedPermissions.size === 0) return;

    try {
      setSaving(true);
      
      // Get all current permissions and apply modifications
      const getAllPermissions = (nodes: PermissionNode[]): Array<{ codename: string; is_granted: boolean }> => {
        const perms: Array<{ codename: string; is_granted: boolean }> = [];
        
        nodes.forEach(node => {
          // Use modified value if exists, otherwise use current value
          const isGranted = modifiedPermissions.has(node.codename) 
            ? modifiedPermissions.get(node.codename)! 
            : node.is_granted || false;
            
          perms.push({
            codename: node.codename,
            is_granted: isGranted
          });
          
          if (node.children) {
            perms.push(...getAllPermissions(node.children));
          }
        });
        
        return perms;
      };

      const permissions = getAllPermissions(permissionTree);
      
      console.log('Permissions to save:', permissions);
      console.log('Group ID:', selectedGroup.id);

      await uiPermissionService.bulkUpdateGroupPermissions(selectedGroup.id, permissions);
      
      toast({
        title: "Success",
        description: `Updated permissions for ${selectedGroup.name}`
      });
      
      // Reload to get fresh data
      await loadPermissionTree(selectedGroup.id);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save permissions"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPermissions = async () => {
    if (!selectedGroup || !copyFromGroup) return;

    try {
      const fromGroupId = parseInt(copyFromGroup, 10);
      await uiPermissionService.copyPermissions(fromGroupId, selectedGroup.id);
      
      toast({
        title: "Success",
        description: "Permissions copied successfully"
      });
      
      // Reload to see copied permissions
      await loadPermissionTree(selectedGroup.id);
      setCopyFromGroup('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy permissions"
      });
    }
  };

  const handleReset = () => {
    if (selectedGroup) {
      loadPermissionTree(selectedGroup.id);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    let total = 0;
    let granted = 0;
    
    const countPermissions = (nodes: PermissionNode[]) => {
      nodes.forEach(node => {
        total++;
        if (node.is_granted) granted++;
        if (node.children) countPermissions(node.children);
      });
    };
    
    countPermissions(permissionTree);
    return { total, granted, denied: total - granted };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">UI Permissions Management</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={modifiedPermissions.size === 0}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={modifiedPermissions.size === 0 || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes ({modifiedPermissions.size})
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Permission Tree</CardTitle>
                <CardDescription>
                  Configure UI element visibility for the selected group
                </CardDescription>
              </div>
              <Select
                value={selectedGroup?.id.toString()}
                onValueChange={(value) => {
                  const group = groups.find(g => g.id.toString() === value);
                  setSelectedGroup(group || null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[500px] border rounded-lg p-4">
                  {permissionTree.map(node => (
                    <PermissionTreeItem
                      key={node.codename}
                      node={node}
                      level={0}
                      onToggle={handlePermissionToggle}
                      searchQuery={searchQuery}
                    />
                  ))}
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Permissions</span>
                  <span className="font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Granted</span>
                  <span className="font-bold text-green-600">{stats.granted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Denied</span>
                  <span className="font-bold text-red-600">{stats.denied}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Coverage</span>
                    <span className="font-bold">
                      {stats.total > 0 ? Math.round((stats.granted / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copy Permissions</CardTitle>
              <CardDescription>
                Copy all permissions from another group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={copyFromGroup}
                  onValueChange={setCopyFromGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter(g => g.id !== selectedGroup?.id)
                      .map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCopyPermissions}
                  disabled={!copyFromGroup}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Permissions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const toggleAllPermissions = (nodes: PermissionNode[], grant: boolean) => {
                      nodes.forEach(node => {
                        handlePermissionToggle(node.codename, grant);
                        if (node.children) {
                          toggleAllPermissions(node.children, grant);
                        }
                      });
                    };
                    toggleAllPermissions(permissionTree, true);
                  }}
                >
                  Grant All
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const toggleAllPermissions = (nodes: PermissionNode[], grant: boolean) => {
                      nodes.forEach(node => {
                        handlePermissionToggle(node.codename, grant);
                        if (node.children) {
                          toggleAllPermissions(node.children, grant);
                        }
                      });
                    };
                    toggleAllPermissions(permissionTree, false);
                  }}
                >
                  Deny All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}