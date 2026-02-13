import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertCircleIcon, UserIcon, BuildingIcon, PhoneIcon } from '@/app/components/icons/FinanceIcons';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function BusinessLogin() {
  const navigate = useNavigate();
  const { login, clearSession, isAuthenticated, business } = useAuth();
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
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changeErrors, setChangeErrors] = useState<{ newPassword?: string; confirmNewPassword?: string; general?: string }>({});

  // Redirect if already authenticated - must be in useEffect
  useEffect(() => {
    if (isAuthenticated && business?.businessSlug && !showChangePassword) {
      navigate(`/business/${business.businessSlug}/dashboard`);
    }
  }, [isAuthenticated, business, navigate, showChangePassword]);

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

    try {
      const { businessSlug, mustChangePassword } = await login({ ...formData, loginContext: 'BUSINESS' });

      if (mustChangePassword) {
        setPendingSlug(businessSlug);
        setShowChangePassword(true);
        toast.info('Please change your temporary password to continue.');
        return;
      }

      toast.success('Login successful!');

      // Navigate directly using the returned businessSlug
      if (businessSlug) {
        navigate(`/business/${businessSlug}/dashboard`);
      } else {
        toast.error('No business associated with this account');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; responseMessage?: string }>;
      const message = axiosError.response?.data?.message || axiosError.response?.data?.responseMessage || 'Invalid email or password';
      setErrors({ general: message });
      toast.error(message);
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
      toast.success('Password changed successfully!');
      setShowChangePassword(false);

      if (pendingSlug) {
        navigate(`/business/${pendingSlug}/dashboard`);
      } else {
        toast.error('No business associated with this account');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'Failed to change password';
      setChangeErrors({ general: message });
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Show password change screen
  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
            <p className="text-gray-600">Business Dashboard</p>
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
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`pl-10 pr-10 ${changeErrors.newPassword ? 'border-red-500' : ''}`}
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
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
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
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

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={changingPassword}>
                  {changingPassword ? 'Changing Password...' : 'Change Password & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-600 mt-4">
            Secure • Compliant • Trusted by Nigerian Businesses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Business Dashboard</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your business account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.general}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@yourbusiness.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer checked:bg-green-600 checked:border-green-600"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm text-green-600 hover:text-green-700 hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to Suscribly?</span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => navigate('/business/signup')}
                >
                  Create Business Account
                </Button>
              </div>
            </div>

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
          Secure • Compliant • Trusted by Nigerian Businesses
        </p>
      </div>
    </div>
  );
}

export function BusinessSignup() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, business } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    businessName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Redirect if already authenticated - must be in useEffect
  useEffect(() => {
    if (isAuthenticated && business?.businessSlug) {
      navigate(`/business/${business.businessSlug}/dashboard`);
    }
  }, [isAuthenticated, business, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Create user account and business together
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
        phone: formData.phone || undefined,
      });

      toast.success('Account created! Please check your email to verify your account.');
      navigate('/business/verify-email', { state: { email: formData.email } });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; responseMessage?: string }>;
      const message = axiosError.response?.data?.message || axiosError.response?.data?.responseMessage || 'Failed to create account. Please try again.';
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Start Managing Subscriptions</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Set up your business account to start collecting payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.general}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <BuildingIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your Business Ltd"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`pl-10 ${errors.businessName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.businessName && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.businessName}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{errors.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{errors.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
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
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.phone}</span>
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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-2 border-gray-300 bg-white text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer checked:bg-green-600 checked:border-green-600"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                  I agree to the{' '}
                  <button type="button" className="text-green-600 hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-green-600 hover:underline">
                    Privacy Policy
                  </button>
                </label>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/business/login')}
                  className="text-green-600 hover:text-green-700 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
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
          Secure • Compliant • Trusted by Nigerian Businesses
        </p>
      </div>
    </div>
  );
}
