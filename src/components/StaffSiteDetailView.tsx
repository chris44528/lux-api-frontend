import StaffSiteDetailPage from './StaffSiteDetail/StaffSiteDetailPage';
import EcotricityStaffSiteDetailPage from './StaffSiteDetail/EcotricityStaffSiteDetailPage';
import useEcotricityUser from '../hooks/useEcotricityUser';

const StaffSiteDetailView = (props: any) => {
  const { isEcotricityUser, loading } = useEcotricityUser();
  
  // Show loading while checking user permissions
  if (loading) {
    return (
      <div className="bg-white text-black dark:bg-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Render different view based on user's group
  return (
    <div className="bg-white text-black dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {isEcotricityUser ? (
        <EcotricityStaffSiteDetailPage {...props} />
      ) : (
        <StaffSiteDetailPage {...props} />
      )}
    </div>
  );
};

export default StaffSiteDetailView; 