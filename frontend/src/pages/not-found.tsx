import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-muted/40 dark:bg-stone-900 p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-amber-700 dark:text-amber-600">404</h1>
          <h2 className="text-3xl font-bold text-foreground dark:text-white mt-4">Page Not Found</h2>
        </div>
        
        <p className="text-muted-foreground dark:text-muted-foreground/50 mb-8 text-lg">
          Oops! The page you're looking for doesn't exist or may have been moved.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-md transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Return Home
          </Link>
          
          <div className="mt-8 pt-6 border-t border-border dark:border-stone-700">
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Need help?</h3>
            <ul className="space-y-2 text-muted-foreground dark:text-muted-foreground/50">
              <li>Check the URL for typos</li>
              <li>Go back to the previous page</li>
              <li>Visit our homepage for navigation options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;