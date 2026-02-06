import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { MailIcon, CheckCircleIcon, AlertCircleIcon } from '@/app/components/icons/FinanceIcons';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

// OTP input component with individual boxes
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return; // digits only
    const newOtp = value.split('');
    newOtp[index] = char;
    const joined = newOtp.join('').slice(0, OTP_LENGTH);
    onChange(joined);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100"
        />
      ))}
    </div>
  );
}

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Page shown after signup - OTP verification
export function VerifyEmailPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const returnTo = location.state?.returnTo || '/business/login';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_MINUTES * 60);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  // Expiry countdown
  useEffect(() => {
    if (expirySeconds <= 0 || verified) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verified]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    if (!email) {
      setError('Email not found. Please go back and try again.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await authApi.verifyEmail(email, otpCode);
      setVerified(true);
      toast.success('Email verified successfully!');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(message);
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await authApi.resendVerification(email);
      toast.success('New verification code sent!');
      setResendCooldown(60);
      setExpirySeconds(OTP_EXPIRY_MINUTES * 60);
      setOtpCode('');
      setError('');
    } catch {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otpCode.length === OTP_LENGTH && !isVerifying && !verified) {
      handleVerify();
    }
  }, [otpCode]);

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <SuscriblyLogo size="lg" showText={true} />
            </div>
          </div>
          <Card className="border-gray-200 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>
                Your account is now active. You can log in and start using Suscribly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate(returnTo)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isExpired = expirySeconds <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SuscriblyLogo size="lg" showText={true} />
          </div>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MailIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to
              {email && <span className="block font-medium text-gray-900 mt-1">{email}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Timer */}
            <div className="text-center">
              {isExpired ? (
                <span className="text-sm font-medium text-red-600">Code expired - request a new one</span>
              ) : (
                <span className={`text-sm font-medium ${expirySeconds < 120 ? 'text-orange-600' : 'text-gray-600'}`}>
                  Code expires in <span className="font-mono text-base">{formatTime(expirySeconds)}</span>
                </span>
              )}
            </div>

            {/* OTP Input */}
            <OtpInput value={otpCode} onChange={setOtpCode} disabled={isVerifying || isExpired} />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={otpCode.length !== OTP_LENGTH || isVerifying || isExpired}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </Button>

            {/* Resend */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {isResending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend Code'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => navigate(returnTo)}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Keep this export for backwards compatibility but redirect to the pending page
export function VerifyEmailCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/verify-email', { replace: true });
  }, [navigate]);

  return null;
}
