import React from 'react';
import { UserGroup } from '../types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Info } from 'lucide-react';

interface GroupAccessControlProps {
  group: UserGroup;
}

export function GroupAccessControl({ group }: GroupAccessControlProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Access Control</CardTitle>
        <CardDescription>
          Manage group access permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Access Control Information</p>
            <p>
              Access control for this group is managed through:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li><strong>Menu Permissions</strong> - Control which menu items are visible to this group</li>
              <li><strong>Data Filters</strong> - Control which data this group can access</li>
              <li><strong>View Types</strong> - Control whether the group sees staff or engineer views</li>
            </ul>
            <p className="mt-2">
              Please use the Menu Permissions and Data Filters tabs in the Security section to configure access for this group.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}