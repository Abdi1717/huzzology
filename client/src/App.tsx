/**
 * Huzzology Main App Component
 * 
 * This is the root component that sets up routing and global state management.
 */

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-foreground">
                🧠 Huzzology
              </h1>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Input 
                placeholder="Search archetypes..." 
                className="w-64"
              />
              <Button variant="outline">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Map the Evolution of Culture
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover and explore the evolving landscape of women's pop culture archetypes through interactive data visualization
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="px-8">
              Start Exploring
            </Button>
            <Button variant="outline" size="lg">
              View Trending
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <CardTitle className="text-xl">Discover</CardTitle>
              <CardDescription>
                Explore trending archetypes and cultural movements as they emerge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Clean Girl</Badge>
                <Badge variant="outline">Dark Academia</Badge>
                <Badge variant="outline">Cottagecore</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🕸️</span>
              </div>
              <CardTitle className="text-xl">Visualize</CardTitle>
              <CardDescription>
                See how archetypes connect and influence each other in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Relationships</Badge>
                <Badge variant="outline">Evolution</Badge>
                <Badge variant="outline">Networks</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <CardTitle className="text-xl">Track</CardTitle>
              <CardDescription>
                Follow the evolution of trends over time with detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Timeline</Badge>
                <Badge variant="outline">Metrics</Badge>
                <Badge variant="outline">Insights</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-huzzology-50 to-pink-50 border-huzzology-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-huzzology-800">
              Ready to dive into the cultural zeitgeist?
            </CardTitle>
            <CardDescription className="text-huzzology-600">
              Join thousands of users mapping the evolution of pop culture
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" className="bg-huzzology-600 hover:bg-huzzology-700">
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App; 