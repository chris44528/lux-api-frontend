import { useState, useEffect } from 'react';
import { User } from '../types/user';
import { isEcotricityUser } from '../utils/userPermissions';
import { getCurrentUser } from '../services/userService';

/**
 * Custom hook to check if the current logged-in user belongs to the Ecotricity group
 * @returns An object with isEcotricityUser flag and loading state
 */
// Cache for user data to prevent re-fetching on navigation
let cachedUser: User | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useEcotricityUser = () => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);
  const [isEcotricity, setIsEcotricity] = useState<boolean>(cachedUser ? isEcotricityUser(cachedUser) : false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      // Use cached data if available and not expired
      if (cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setUser(cachedUser);
        setIsEcotricity(isEcotricityUser(cachedUser));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        // Update cache
        cachedUser = currentUser;
        cacheTimestamp = Date.now();
        
        setUser(currentUser);
        setIsEcotricity(isEcotricityUser(currentUser));
      } catch (error) {
        setIsEcotricity(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { isEcotricityUser: isEcotricity, loading, user };
};

export default useEcotricityUser; 