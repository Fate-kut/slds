/**
 * Auth Page Component
 * Login page with username and PIN authentication
 * Simulates RFID/biometric authentication behavior
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, KeyRound, AlertCircle, Fingerprint, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Auth Component
 * Renders the login form and handles authentication
 */
const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  
  // Form state
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   * Validates credentials and redirects based on user role
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication delay (RFID/biometric processing)
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = login({ username, pin });

    if (result.success) {
      toast.success('Authentication Successful', {
        description: 'Welcome to the Smart Locker System',
      });
      // Navigation will be handled by App.tsx based on currentUser
      navigate('/');
    } else {
      setError(result.error || 'Authentication failed');
      toast.error('Authentication Failed', {
        description: result.error,
      });
    }

    setIsLoading(false);
  };

  /**
   * Quick login for demo purposes
   */
  const handleDemoLogin = (type: 'student' | 'teacher') => {
    if (type === 'student') {
      setUsername('john.doe');
      setPin('1234');
    } else {
      setUsername('prof.anderson');
      setPin('9999');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="container mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="text-primary-foreground" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Smart Locker System</h1>
            <p className="text-xs text-muted-foreground">Classroom Access Control</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          {/* Login card */}
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              {/* Authentication icon */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                <Fingerprint size={40} className="text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Authentication Required</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials or use simulated RFID/biometric
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User size={14} />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-11"
                  />
                </div>

                {/* PIN field */}
                <div className="space-y-2">
                  <Label htmlFor="pin" className="flex items-center gap-2">
                    <KeyRound size={14} />
                    PIN / Password
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm animate-fade-in">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} className="mr-2" />
                      Authenticate
                    </>
                  )}
                </Button>
              </form>

              {/* Demo login buttons */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDemoLogin('student')}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <User size={18} />
                    <span className="text-xs">Student Demo</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDemoLogin('teacher')}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <Shield size={18} />
                    <span className="text-xs">Teacher Demo</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help text */}
          <p className="text-center text-sm text-muted-foreground">
            This is a simulation. No real RFID or biometric hardware is required.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
