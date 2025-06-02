/**
 * Huzzology Main App Component
 * 
 * This is the root component that sets up routing and global state management.
 */

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🧠 Huzzology
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                Real-time visual mapping of women's pop culture
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to Huzzology
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Discover and explore the evolving landscape of women's pop culture archetypes
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Discover</h3>
                <p className="text-gray-600">
                  Explore trending archetypes and cultural movements
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🕸️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Visualize</h3>
                <p className="text-gray-600">
                  See how archetypes connect and influence each other
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Track</h3>
                <p className="text-gray-600">
                  Follow the evolution of trends over time
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 