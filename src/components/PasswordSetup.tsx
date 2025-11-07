import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { 
  Shield, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Lock,
  User,
  Building
} from 'lucide-react';

interface PasswordSetupProps {
  customerData: {
    name: string;
    email: string;
    company: string;
    plan: string;
    token: string;
  };
  onPasswordSet: (newPassword: string) => void;
}

export function PasswordSetup({ customerData, onPasswordSet }: PasswordSetupProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength validation
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
    { label: 'Contains special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  const getPasswordStrength = (password: string) => {
    const passedRequirements = passwordRequirements.filter(req => req.test(password)).length;
    if (passedRequirements < 2) return { score: 0, label: 'Weak', color: 'bg-red-500' };
    if (passedRequirements < 4) return { score: 1, label: 'Fair', color: 'bg-yellow-500' };
    if (passedRequirements < 5) return { score: 2, label: 'Good', color: 'bg-blue-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const isValidPassword = passwordRequirements.every(req => req.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPassword || !passwordsMatch) {
      return;
    }

    setIsLoading(true);
    
    // Simulate API call to verify current password and set new password
    setTimeout(() => {
      // In a real app, this would verify the temporary password and update it
      onPasswordSet(newPassword);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Contrezz</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome to Contrezz!</h2>
          <p className="text-gray-600">Please set up your account password to get started</p>
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{customerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customerData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-medium flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{customerData.company}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <Badge variant="secondary">{customerData.plan}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Set Your Password</span>
            </CardTitle>
            <CardDescription>
              Create a secure password for your Contrezz account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Temporary Password */}
              <div>
                <Label htmlFor="currentPassword">Temporary Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter the temporary password from your email"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This is the temporary password sent to your email
                </p>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${((passwordStrength.score + 1) / 4) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="space-y-1">
                      {passwordRequirements.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          {requirement.test(newPassword) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={requirement.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                            {requirement.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {confirmPassword && (
                  <div className="flex items-center space-x-2 mt-1">
                    {passwordsMatch ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Security Notice</p>
                    <p>Your password is encrypted and stored securely. We recommend using a unique password that you don't use for other accounts.</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!isValidPassword || !passwordsMatch || !currentPassword || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Up Your Account...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Set Password & Continue
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact our support team at support@contrezz.com</p>
        </div>
      </div>
    </div>
  );
}


