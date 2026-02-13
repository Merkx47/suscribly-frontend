import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertCircleIcon, CheckCircleIcon, BuildingIcon } from '@/app/components/icons/FinanceIcons';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { authApi, billingApi, getAccessToken } from '@/lib/api';
import type { BankResponse } from '@/lib/api/billing';

export function CustomerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

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
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
        loginContext: 'CUSTOMER',
      });

      if (response.mustChangePassword) {
        navigate('/customer/setup-password');
      } else {
        navigate(`/customer/${response.userId}/dashboard`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid email or password';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Customer Portal</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your subscriptions
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
                    placeholder="you@example.com"
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
                    className="w-4 h-4 rounded border-2 border-gray-300 bg-white text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer checked:bg-purple-600 checked:border-purple-600"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <Link to="/customer/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {errors.general && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need help?</span>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/customer/forgot-email">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    Forgot Email Address?
                  </Button>
                </Link>
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
          Your account is created by the business you subscribe with
        </p>
      </div>
    </div>
  );
}

// Password Setup (First-time from email link)
export function CustomerPasswordSetup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    try {
      // User must be logged in (they used their temp password to log in, got redirected here)
      await authApi.changePassword(
        '', // currentPassword is the temp password - already authenticated via JWT
        formData.password
      );
      const storedUser = authApi.getStoredUser();
      navigate(`/customer/${storedUser?.userId || 'me'}/dashboard`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Customer Portal</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
            <CardDescription className="text-center">
              Create a secure password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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


              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? 'Setting password...' : 'Set Password & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          After setting your password, you can access your subscriptions
        </p>
      </div>
    </div>
  );
}

// Forgot Password
export function CustomerForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setOtpStep(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.resetPassword(email, otpCode, newPassword);
      setResetSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <Card className="border-gray-200 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Reset!</CardTitle>
              <CardDescription>
                Your password has been reset successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/customer/login')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <Card className="border-gray-200 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Enter the OTP code sent to {email} and your new password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setOtpStep(false); setError(''); }}
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Didn't receive the code? Go back
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Customer Portal</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a password reset OTP
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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${error ? 'border-red-500' : ''}`}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/customer/login" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Forgot Email (Account Number + ₦500 Verification)
export function CustomerForgotEmail() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'account' | 'bank' | 'verify' | 'waiting' | 'success'>('account');
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankName: '',
  });
  const [error, setError] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [banksList, setBanksList] = useState<BankResponse[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);

  // Platform collection account details (configurable via env vars)
  const platformAccountName = import.meta.env.VITE_PLATFORM_ACCOUNT_NAME || 'Suscribly Technologies Ltd';
  const platformAccountNumber = import.meta.env.VITE_PLATFORM_ACCOUNT_NUMBER || '1000012345';
  const platformBankName = import.meta.env.VITE_PLATFORM_BANK_NAME || 'Rubies MFB';

  // Load banks from API
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const response = await billingApi.getBanks(0, 200);
        setBanksList(response.content || []);
      } catch (err) {
        console.error('Failed to load banks:', err);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (step !== 'waiting') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [step]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    { id: 'account', label: 'Account', number: 1 },
    { id: 'bank', label: 'Bank', number: 2 },
    { id: 'verify', label: 'Transfer', number: 3 },
    { id: 'waiting', label: 'Waiting', number: 4 },
    { id: 'success', label: 'Complete', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, index) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              index < currentStepIndex
                ? 'bg-green-500 text-white'
                : index === currentStepIndex
                  ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {index < currentStepIndex ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                s.number
              )}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${
              index <= currentStepIndex ? 'text-gray-700' : 'text-gray-400'
            }`}>
              {s.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 -mt-5 ${
              index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountNumber) {
      setError('Account number is required');
      return;
    }
    if (formData.accountNumber.length !== 10) {
      setError('Account number must be 10 digits');
      return;
    }
    setError('');
    setStep('bank');
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName) {
      setError('Please select your bank');
      return;
    }

    // Find bank code for the selected bank
    const selectedBank = banksList.find(b => b.bankName === formData.bankName);
    const bankCode = selectedBank?.bankCode;
    if (!bankCode) {
      setError('Could not find bank code. Please try another bank.');
      return;
    }

    setIsVerifyingAccount(true);
    setError('');
    try {
      const result = await billingApi.verifyBankAccount({
        bankCode,
        accountNumber: formData.accountNumber,
      });
      if (result.accountName) {
        setAccountName(result.accountName);
        setStep('verify');
      } else {
        setError('Could not verify account. Please check your details.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Account verification failed. Please check your details.');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Start waiting for NIBSS webhook
    setCountdown(600); // Reset to 10 minutes
    setStep('waiting');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <StepIndicator />

          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete</h2>
                <p className="text-gray-600 mb-6">
                  Your account has been verified successfully
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Check Your Email</p>
                    <p className="text-sm text-gray-600">
                      We've sent your login credentials and a secure access link to your registered email address.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">₦500.00 verification successful</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/customer/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <StepIndicator />

          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                {/* Animated waiting indicator */}
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-3 bg-purple-50 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-600 font-mono">
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Payment</h2>
                <p className="text-gray-600 mb-6">
                  We're waiting to confirm your ₦500 transfer
                </p>
              </div>

              {/* Transfer Details Reminder */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BuildingIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Transfer ₦500.00 to:</p>
                    <p className="text-sm text-gray-600">{platformAccountName}</p>
                    <p className="text-sm font-mono text-gray-800 font-medium">{platformAccountNumber} • {platformBankName}</p>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-amber-800">Listening for NIBSS confirmation...</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Transfer from account ****{formData.accountNumber.slice(-4)} at {formData.bankName}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setStep('verify')}
                  variant="outline"
                  className="w-full h-12"
                >
                  View Transfer Details
                </Button>
                <button
                  type="button"
                  onClick={() => setStep('account')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Cancel & Start Over
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-4">
            Verification typically completes within 1-2 minutes
          </p>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <StepIndicator />

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Verify Your Account</CardTitle>
              <CardDescription className="text-center">
                Complete the ₦500 transfer to verify ownership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerificationSubmit} className="space-y-5">
                {/* Your Account Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <BuildingIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{accountName}</p>
                      <p className="text-sm text-gray-500">{formData.bankName} • ****{formData.accountNumber.slice(-4)}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      Verified
                    </div>
                  </div>
                </div>

                {/* Payment Details Card */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-purple-200 text-sm font-medium">Transfer Details</span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded">
                      VERIFICATION
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-purple-200 text-xs mb-0.5">Account Name</p>
                      <p className="font-semibold">{platformAccountName}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-purple-200 text-xs mb-0.5">Account Number</p>
                        <p className="font-mono font-semibold text-lg tracking-wider">{platformAccountNumber}</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-xs mb-0.5">Bank</p>
                        <p className="font-semibold">{platformBankName}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-200 text-sm">Amount to Transfer</span>
                        <span className="text-2xl font-bold">₦500.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <AlertCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Transfer must be from your account <span className="font-semibold">****{formData.accountNumber.slice(-4)}</span> at {formData.bankName}. We'll auto-verify and send your email.
                  </p>
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base">
                  I've Made the Transfer
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('account')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  ← Start over
                </button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-4">
            Verification typically completes within 1-2 minutes
          </p>
        </div>
      </div>
    );
  }

  if (step === 'bank') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>

          <StepIndicator />

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Select Your Bank</CardTitle>
              <CardDescription className="text-center">
                Choose the bank for account <span className="font-mono font-medium">{formData.accountNumber}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bank" className="text-sm font-medium text-gray-700">Bank Name</Label>
                  <select
                    id="bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className={`w-full h-12 px-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 ${error ? 'border-red-500' : 'border-gray-200'}`}
                    disabled={isLoadingBanks}
                  >
                    <option value="">{isLoadingBanks ? 'Loading banks...' : 'Select your bank'}</option>
                    {banksList
                      .filter(b => b.bankName)
                      .sort((a, b) => (a.bankName || '').localeCompare(b.bankName || ''))
                      .map((bank) => (
                        <option key={bank.bankId} value={bank.bankName!}>{bank.bankName}</option>
                      ))}
                  </select>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base" disabled={isVerifyingAccount}>
                  {isVerifyingAccount ? 'Verifying account...' : 'Continue'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('account')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  ← Back
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-500">Customer Portal</p>
        </div>

        <StepIndicator />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Forgot Your Email?</CardTitle>
            <CardDescription className="text-center">
              Recover your account by verifying ownership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">
                  Linked Bank Account Number
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter 10-digit account number"
                  maxLength={10}
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className={`h-12 text-center font-mono text-lg tracking-widest ${error ? 'border-red-500' : ''}`}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* How it works section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-800 mb-3">How it works</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">1</div>
                    <p className="text-sm text-gray-600">Enter your linked bank account number</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">2</div>
                    <p className="text-sm text-gray-600">Select your bank and verify account ownership</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">3</div>
                    <p className="text-sm text-gray-600">Transfer ₦500 to confirm your identity</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm text-gray-600">Receive your registered email address</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base">
                Continue
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/customer/login" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Customers don't sign up - they're added by businesses
export function CustomerSignup() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Customer Accounts</CardTitle>
            <CardDescription>
              Customers don't sign up directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">
                  Your customer account is created when a business adds you to their subscription service.
                </p>
                <p className="text-sm text-blue-800 font-medium">
                  You'll receive a welcome email with instructions to set up your password.
                </p>
              </div>

              <Button 
                onClick={() => navigate('/customer/login')} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Login
              </Button>

              <div className="text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to portal selection
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
