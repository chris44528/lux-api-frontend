import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import userService from '@/services/userService';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  full_name: string;
  department?: string;
}

interface PaginatedUserSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PaginatedUserSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select user",
  className
}: PaginatedUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load initial user if value is provided
  useEffect(() => {
    if (value && !selectedUser) {
      loadSingleUser(parseInt(value));
    }
  }, [value]);

  // Load users when search changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setUsers([]);
      loadUsers(1, true);
    }
  }, [debouncedSearch, isOpen]);

  const loadSingleUser = async (userId: number) => {
    try {
      const user = await userService.getUser(userId);
      setSelectedUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadUsers = async (page: number, reset: boolean = false) => {
    if (loading || loadingMore) return;
    
    const isFirstLoad = page === 1;
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: any = { page };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const response = await userService.getUsers(page, params);
      
      if (reset) {
        setUsers(response.results);
      } else {
        setUsers(prev => [...prev, ...response.results]);
      }
      
      // Calculate total pages from count
      const pageSize = response.results.length > 0 ? 
        Math.ceil(response.count / response.results.length) : 1;
      setTotalPages(Math.ceil(response.count / pageSize));
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadUsers(currentPage + 1);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    onValueChange(user.id.toString());
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between",
          !selectedUser && "text-muted-foreground"
        )}
      >
        {selectedUser ? (
          <span className="truncate">
            {selectedUser.full_name} ({selectedUser.username})
          </span>
        ) : (
          placeholder
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md">
          <div className="p-2 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] bg-white dark:bg-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              <>
                <div className="p-1">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        "hover:bg-accent hover:text-accent-foreground",
                        value === user.id.toString() && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.username} {user.department && `• ${user.department}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {currentPage < totalPages && (
                  <div className="border-t p-2 bg-white dark:bg-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load more (Page ${currentPage + 1} of ${totalPages})`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}