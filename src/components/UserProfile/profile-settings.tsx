import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { JobFilters } from '../JobManagement/job-filter'

interface ProfileSettingsProps {
  userId: string
  username: string
  email: string
}

export function ProfileSettings({ userId, username, email }: ProfileSettingsProps) {
  const [savedFilters, setSavedFilters] = useState<JobFilters | null>(null)
  const [useDefaultFilters, setUseDefaultFilters] = useState(false)
  
  // Load saved filters on component mount
  useEffect(() => {
    const loadSavedFilters = () => {
      try {
        const filtersJson = localStorage.getItem('jobFilters')
        if (filtersJson) {
          const filters = JSON.parse(filtersJson)
          setSavedFilters(filters)
          
          // Check if user has opted to use default filters
          const useDefaults = localStorage.getItem('useDefaultJobFilters')
          setUseDefaultFilters(useDefaults === 'true')
        }
      } catch (error) {
        console.error('Error loading saved filters', error)
      }
    }
    
    loadSavedFilters()
  }, [])
  
  // Handle toggle for using default filters
  const handleToggleDefaultFilters = (checked: boolean) => {
    setUseDefaultFilters(checked)
    localStorage.setItem('useDefaultJobFilters', checked.toString())
  }
  
  // Clear saved filters
  const handleClearFilters = () => {
    localStorage.removeItem('jobFilters')
    setSavedFilters(null)
    
    // If we're clearing filters, also disable using defaults
    setUseDefaultFilters(false)
    localStorage.setItem('useDefaultJobFilters', 'false')
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-2">
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <div className="rounded-md border px-3 py-2 text-sm" id="username">
            {username}
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <div className="rounded-md border px-3 py-2 text-sm" id="email">
            {email}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Job Management Preferences</h3>
        <p className="text-sm text-gray-500">
          Configure your default job view and filters.
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="use-default-filters" 
              checked={useDefaultFilters}
              onCheckedChange={handleToggleDefaultFilters}
              disabled={!savedFilters}
            />
            <Label htmlFor="use-default-filters">
              Use my default filters when opening the job board
            </Label>
          </div>
          
          {savedFilters ? (
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-sm font-medium mb-2">Your saved filters:</div>
              <div className="space-y-2 text-sm">
                {savedFilters.status.length > 0 && (
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    {savedFilters.status.map(s => s.replace('-', ' ')).join(', ')}
                  </div>
                )}
                
                {savedFilters.priority.length > 0 && (
                  <div>
                    <span className="font-medium">Priority:</span>{' '}
                    {savedFilters.priority.join(', ')}
                  </div>
                )}
                
                {savedFilters.assignedTo.length > 0 && (
                  <div>
                    <span className="font-medium">Assigned to:</span>{' '}
                    {savedFilters.assignedTo.map(id => id === 'unassigned' ? 'Unassigned' : id).join(', ')}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="mt-2"
                >
                  Clear saved filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No default filters saved. Set up filters in the job board and select "Save as my default view".
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 