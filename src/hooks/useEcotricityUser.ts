import { useState, useEffect } from 'react';
import { User } from '../types/user';
import { isEcotricityUser } from '../utils/userPermissions';
import { getCurrentUser } from '../services/userService';

/**
 * Custom hook to check if the current logged-in user belongs to the Ecotricity group
 * @returns An object with isEcotricityUser flag and loading state
 */
export const useEcotricityUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEcotricity, setIsEcotricity] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsEcotricity(isEcotricityUser(currentUser));
      } catch (error) {
        console.error('Error fetching current user:', error);
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