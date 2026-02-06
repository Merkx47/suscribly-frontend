import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, BuildingIcon, AlertCircleIcon, CheckCircleIcon } from '@/app/components/icons/FinanceIcons';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { authApi, clearTokens } from '@/lib/api';

export function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Password change prompt state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changeErrors, setChangeErrors] = useState<{ newPassword?: string; confirmNewPassword?: string; general?: string }>({});

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [sendingForgotPassword, setSendingForgotPassword] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    // Clear any stale tokens to prevent race conditions
    clearTokens();
    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      if (!response.roles?.includes('ADMIN')) {
        setErrors({ general: 'Access denied. Admin privileges required.' });
        return;
      }

      if (response.mustChangePassword) {
        setShowChangePassword(true);
        return;
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid credentials';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof changeErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }
    if (newPassword === formData.password) {
      newErrors.newPassword = 'New password must be different from temporary password';
    }

    setChangeErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setChangingPassword(true);
    try {
      await authApi.changePassword(formData.password, newPassword);
      setShowChangePassword(false);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to change password';
      setChangeErrors({ general: message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotPasswordEmail || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      return;
    }

    setSendingForgotPassword(true);
    try {
      await authApi.forgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordSent(true);
    } catch (err: any) {
      // Still show success to avoid email enumeration
      setForgotPasswordSent(true);
    } finally {
      setSendingForgotPassword(false);
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
            <p className="text-gray-600">Admin Portal</p>
          </div>
          <Card className="border-gray-200 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Change Your Password</CardTitle>
              <CardDescription className="text-center">
                You're using a temporary password. Please create a new password to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {changeErrors.general && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{changeErrors.general}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <LockIcon className="w-5 h-5" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      className={`pl-10 pr-10 ${changeErrors.newPassword ? 'border-red-500' : ''}`}
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {changeErrors.newPassword && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{changeErrors.newPassword}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <LockIcon className="w-5 h-5" />
                    </div>
                    <Input
                      id="confirmNewPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
                      className={`pl-10 ${changeErrors.confirmNewPassword ? 'border-red-500' : ''}`}
                      disabled={changingPassword}
                    />
                  </div>
                  {changeErrors.confirmNewPassword && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{changeErrors.confirmNewPassword}</span>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={changingPassword}>
                  {changingPassword ? 'Changing Password...' : 'Change Password & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-sm text-gray-600 mt-4">
            Suscribly Platform Admin Portal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Admin Portal</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@suscribly.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {errors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to portal selection
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          Suscribly Platform Admin Portal • Secure Access
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          {!forgotPasswordSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={sendingForgotPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sendingForgotPassword}>
                  {sendingForgotPassword ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Check your email</p>
                  <p className="mt-1">If an account exists with that email, we've sent password reset instructions.</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordSent(false);
                    setForgotPasswordEmail('');
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
