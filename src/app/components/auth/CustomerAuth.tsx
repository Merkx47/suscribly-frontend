import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertCircleIcon, CheckCircleIcon, BuildingIcon } from '@/app/components/icons/FinanceIcons';
import { ReccurLogo } from '@/app/components/ReccurLogo';

export function CustomerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock authentication - in real app, call API
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ReccurLogo size="lg" showText={true} />
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

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Sign In
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
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) return 'weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength >= 3) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
  };

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
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

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(checkPasswordStrength(password));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock password setup - in real app, call API
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ReccurLogo size="lg" showText={true} />
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
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
                {formData.password && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                          passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                          'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-600' :
                      passwordStrength === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength === 'weak' ? 'Weak' :
                       passwordStrength === 'medium' ? 'Medium' :
                       'Strong'}
                    </span>
                  </div>
                )}
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

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-2">Password Requirements:</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className={`w-4 h-4 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className={`w-4 h-4 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className={`w-4 h-4 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`} />
                    One number
                  </li>
                </ul>
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Set Password & Continue
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }
    
    // Mock sending email - in real app, call API
    setEmailSent(true);
    setError('');
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ReccurLogo size="lg" showText={true} />
            </div>
          </div>

          <Card className="border-gray-200 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent password reset instructions to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>

                <Button 
                  onClick={() => navigate('/customer/login')} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Back to Login
                </Button>

                <div className="text-center">
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Didn't receive the email? Resend
                  </button>
                </div>
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
            <ReccurLogo size="lg" showText={true} />
          </div>
          <p className="text-gray-600">Customer Portal</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive password reset instructions
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

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Send Reset Link
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

  // Countdown timer effect
  React.useEffect(() => {
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

    // For demo: auto-verify after 5 seconds
    const demoTimer = setTimeout(() => {
      setStep('success');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(demoTimer);
    };
  }, [step]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const banks = [
    'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank',
    'Fidelity Bank', 'Union Bank', 'Sterling Bank', 'Stanbic IBTC',
    'Wema Bank', 'Polaris Bank', 'Ecobank', 'Keystone Bank', 'Rubies MFB'
  ];

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

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName) {
      setError('Please select your bank');
      return;
    }
    
    // Mock name enquiry - in real app, call API
    setAccountName('John Doe');
    setError('');
    setStep('verify');
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
              <ReccurLogo size="lg" showText={true} />
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
              <ReccurLogo size="lg" showText={true} />
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
                    <p className="text-sm text-gray-600">Reccur Technologies Ltd</p>
                    <p className="text-sm font-mono text-gray-800 font-medium">1000012345 • Rubies MFB</p>
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
              <ReccurLogo size="lg" showText={true} />
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
                      <p className="font-semibold">Reccur Technologies Ltd</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-purple-200 text-xs mb-0.5">Account Number</p>
                        <p className="font-mono font-semibold text-lg tracking-wider">1000012345</p>
                      </div>
                      <div>
                        <p className="text-purple-200 text-xs mb-0.5">Bank</p>
                        <p className="font-semibold">Rubies MFB</p>
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
              <ReccurLogo size="lg" showText={true} />
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
                  >
                    <option value="">Select your bank</option>
                    {banks.sort().map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircleIcon className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base">
                  Continue
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
            <ReccurLogo size="lg" showText={true} />
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
            <ReccurLogo size="lg" showText={true} />
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
