/**
 * Auth Page Component
 * Login and signup with Supabase authentication
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Shield, User, KeyRound, AlertCircle, Fingerprint, Mail, UserPlus, WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
});

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isOffline } = useAuth();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Validate input
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      setLoginError(validation.error.errors[0].message);
      return;
    }

    setIsLoginLoading(true);

    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      toast.success(result.isOffline ? 'Offline Login' : 'Welcome back!', {
        description: result.isOffline 
          ? 'Logged in with cached credentials. Some features may be limited.'
          : 'You have been logged in successfully.',
      });
      navigate('/');
    } else {
      setLoginError(result.error || 'Login failed');
      toast.error('Login Failed', {
        description: result.error,
      });
    }

    setIsLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    // Validate input
    const validation = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      username: signupUsername,
      name: signupName,
    });
    
    if (!validation.success) {
      setSignupError(validation.error.errors[0].message);
      return;
    }

    setIsSignupLoading(true);

    // Always register as student - role upgrades require admin approval
    const result = await signUp(signupEmail, signupPassword, signupUsername, signupName, 'student');

    if (result.success) {
      toast.success('Account Created!', {
        description: 'Welcome to the Smart Locker System.',
      });
      navigate('/');
    } else {
      setSignupError(result.error || 'Signup failed');
      toast.error('Signup Failed', {
        description: result.error,
      });
    }

    setIsSignupLoading(false);
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
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                <Fingerprint size={40} className="text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription className="text-base">
                Sign in or create an account to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Offline indicator */}
              {isOffline && (
                <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                  <WifiOff className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600 dark:text-amber-400">
                    You're offline. Sign in with previously cached credentials, or connect to the internet for full access.
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className={`grid w-full mb-6 ${isOffline ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  {!isOffline && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2">
                        <Mail size={14} />
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2">
                        <KeyRound size={14} />
                        Password
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-11"
                      />
                    </div>

                    {loginError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-fade-in">
                        <AlertCircle size={16} />
                        {loginError}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={isLoginLoading}>
                      {isLoginLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <User size={18} className="mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail size={14} />
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <KeyRound size={14} />
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="flex items-center gap-2">
                        <User size={14} />
                        Username
                      </Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a username"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        required
                        autoComplete="username"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        autoComplete="name"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Role</Label>
                      <Select value={signupRole} onValueChange={(value: UserRole) => setSignupRole(value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {signupError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-fade-in">
                        <AlertCircle size={16} />
                        {signupError}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={isSignupLoading}>
                      {isSignupLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} className="mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
