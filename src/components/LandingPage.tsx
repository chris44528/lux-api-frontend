import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="A Shade Greener Maintenance" 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Home
              </Link>
              <Link
                to="/login"
                className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Welcome to A Shade Greener
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Explore our solar panel solutions and energy savings.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  A Shade Greener
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Log in to view solar panel readings and site information
                </p>
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="inline-block bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-block bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md font-medium border border-gray-300 dark:border-gray-600"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <img
                src="/solar-panels.jpg"
                alt="Solar Panels"
                className="w-full h-auto rounded-lg shadow-lg dark:shadow-gray-700"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} A Shade Greener. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
