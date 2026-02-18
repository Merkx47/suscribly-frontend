import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/app/components/ui/command';
import {
  CheckIcon,
  SearchIcon,
  UploadIcon,
  ShieldIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
} from '@/app/components/icons/FinanceIcons';
import { kycApi, CommercialBankResponse, KycValidateResponse, NameMatchResponse, KycStatusResponse } from '@/lib/api/kyc';

type KycStep = 'kyc-details' | 'bank-account' | 'review-submit';

interface BusinessKycOnboardingProps {
  businessName: string;
  businessKycStatus?: string | null;
  onKycSubmitted?: () => void;
}

export function BusinessKycOnboarding({ businessName, businessKycStatus, onKycSubmitted }: BusinessKycOnboardingProps) {
  // If status is pending review / under review / rejected, show status page
  if (businessKycStatus === 'KYC_PENDING_REVIEW') return <KycPendingReview />;
  if (businessKycStatus === 'KYC_UNDER_REVIEW') return <KycUnderReview />;
  if (businessKycStatus === 'KYC_REJECTED') return <KycRejected onRetry={() => window.location.reload()} />;

  return <KycForm businessName={businessName} onKycSubmitted={onKycSubmitted} />;
}

// ============ Main KYC Form ============

function KycForm({ businessName, onKycSubmitted }: { businessName: string; onKycSubmitted?: () => void }) {
  const [step, setStep] = useState<KycStep>('kyc-details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: KYC Details
  const [kycType, setKycType] = useState<string>('RC');
  const [kycNumber, setKycNumber] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [kycResult, setKycResult] = useState<KycValidateResponse | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Step 2: Bank Account
  const [banks, setBanks] = useState<CommercialBankResponse[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [nameMatchResult, setNameMatchResult] = useState<NameMatchResponse | null>(null);

  // Load commercial banks
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const data = await kycApi.getCommercialBanks();
        setBanks(data);
      } catch {
        console.error('Failed to load banks');
      } finally {
        setIsLoadingBanks(false);
      }
    };
    loadBanks();
  }, []);

  // Auto name enquiry when account number is 10 digits
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      verifyAccount();
    }
  }, [accountNumber, bankCode]);

  const stepIndex = ['kyc-details', 'bank-account', 'review-submit'].indexOf(step);

  // Step 1: Validate KYC
  const handleValidateKyc = async () => {
    if (!kycNumber.trim()) return;
    setIsValidating(true);
    setError('');
    setKycResult(null);
    try {
      const result = await kycApi.validateKyc({ kycType, kycNumber: kycNumber.trim() });
      setKycResult(result);
      if (result.responseCode !== '00') {
        setError(result.responseMessage || 'Validation failed');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 1: Upload document
  const handleUploadDocument = async () => {
    if (!documentFile) return;
    setIsUploading(true);
    setError('');
    try {
      const { uploadUrl, fileKey } = await kycApi.getUploadUrl(documentFile.name);
      await kycApi.uploadToS3(uploadUrl, documentFile);
      setDocumentUrl(fileKey);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Verify bank account
  const verifyAccount = async () => {
    if (!bankCode || accountNumber.length !== 10) return;
    setIsVerifyingAccount(true);
    setNameMatchResult(null);
    setAccountName('');
    try {
      const result = await kycApi.verifyAccount(bankCode, accountNumber);
      setNameMatchResult(result);
      setAccountName(result.accountName || '');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Account verification failed');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  // Step 3: Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await kycApi.submitKyc({
        kycType,
        kycNumber: kycNumber.trim(),
        kycDocumentUrl: documentUrl,
        bankCode,
        accountNumber,
        accountName,
      });
      onKycSubmitted?.();
      window.location.reload();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = kycResult?.responseCode === '00' && kycResult?.isBusinessNameMatch && documentUrl;
  const canProceedStep2 = nameMatchResult?.isMatch && accountName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <ShieldIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Business</h1>
          <p className="text-gray-500 mt-1">Complete KYC verification to activate your {businessName} account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { label: 'KYC Details', id: 'kyc-details' },
            { label: 'Bank Account', id: 'bank-account' },
            { label: 'Review', id: 'review-submit' },
          ].map((s, i) => (
            <span key={s.id} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRightIcon className="h-4 w-4 text-gray-300" />}
              <span className={`flex items-center gap-1.5 ${step === s.id ? 'text-purple-600 font-medium' : ''}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s.id
                    ? 'bg-purple-600 text-white'
                    : stepIndex > i
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepIndex > i ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline text-sm">{s.label}</span>
              </span>
            </span>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
          </div>
        )}

        {/* Step 1: KYC Details */}
        {step === 'kyc-details' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Verification</CardTitle>
              <p className="text-sm text-muted-foreground">Validate your RC Number, CAC Number, or TIN</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* KYC Type */}
              <div className="space-y-2">
                <Label>Verification Type</Label>
                <div className="flex gap-2">
                  {['RC', 'CAC', 'TIN'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setKycType(type); setKycResult(null); setError(''); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        kycType === type
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {type} Number
                    </button>
                  ))}
                </div>
              </div>

              {/* KYC Number + Validate */}
              <div className="space-y-2">
                <Label>{kycType} Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={kycNumber}
                    onChange={(e) => { setKycNumber(e.target.value); setKycResult(null); }}
                    placeholder={`Enter your ${kycType} number`}
                    className="flex-1"
                  />
                  <Button onClick={handleValidateKyc} disabled={!kycNumber.trim() || isValidating}>
                    {isValidating ? <RefreshIcon className="h-4 w-4 animate-spin" /> : 'Validate'}
                  </Button>
                </div>
              </div>

              {/* Validation Result */}
              {kycResult && (
                <div className={`p-4 rounded-lg border ${kycResult.responseCode === '00' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {kycResult.responseCode === '00' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Verification Successful</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Legal Name:</span> <span className="font-medium">{kycResult.legalName}</span></p>
                        {kycResult.registrationNumber && <p><span className="text-gray-500">Reg Number:</span> {kycResult.registrationNumber}</p>}
                        {kycResult.companyType && <p><span className="text-gray-500">Type:</span> {kycResult.companyType}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-500">Name Match:</span>
                          <Badge variant={kycResult.isBusinessNameMatch ? 'default' : 'destructive'} className={kycResult.isBusinessNameMatch ? 'bg-green-600' : ''}>
                            {kycResult.businessNameMatch != null ? `${Math.round(kycResult.businessNameMatch * 100)}%` : 'N/A'}
                          </Badge>
                          {kycResult.isBusinessNameMatch
                            ? <span className="text-xs text-green-600">Matches your business name</span>
                            : <span className="text-xs text-red-600">Does not match (80% required)</span>
                          }
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      <span className="text-red-800">{kycResult.responseMessage || 'Validation failed'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Document Upload */}
              <div className="space-y-2">
                <Label>Supporting Document</Label>
                <p className="text-xs text-muted-foreground">Upload your {kycType} certificate (PDF or image, max 10MB)</p>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-purple-300 cursor-pointer transition-colors bg-white">
                    <UploadIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">
                      {documentFile ? documentFile.name : 'Choose file...'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setDocumentFile(file); setDocumentUrl(''); }
                      }}
                    />
                  </label>
                  {documentFile && !documentUrl && (
                    <Button onClick={handleUploadDocument} disabled={isUploading} size="sm">
                      {isUploading ? <RefreshIcon className="h-4 w-4 animate-spin" /> : 'Upload'}
                    </Button>
                  )}
                  {documentUrl && (
                    <Badge className="bg-green-600">
                      <CheckIcon className="h-3 w-3 mr-1" /> Uploaded
                    </Badge>
                  )}
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep('bank-account')} disabled={!canProceedStep1}>
                  Continue <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bank Account */}
        {step === 'bank-account' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bank Account</CardTitle>
              <p className="text-sm text-muted-foreground">Link a commercial bank account (no fintechs or PSBs)</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Bank Dropdown */}
              <div className="space-y-2">
                <Label>Bank</Label>
                <Popover open={bankOpen} onOpenChange={setBankOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={bankOpen} className="w-full justify-between font-normal">
                      {bankCode ? banks.find(b => b.bankCode === bankCode)?.bankName || 'Select bank' : (isLoadingBanks ? 'Loading banks...' : 'Select commercial bank')}
                      <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
                    <Command>
                      <CommandInput placeholder="Search bank..." />
                      <CommandList>
                        <CommandEmpty>No bank found.</CommandEmpty>
                        <CommandGroup>
                          {banks.map((bank) => (
                            <CommandItem
                              key={bank.bankCode}
                              value={bank.bankName || ''}
                              onSelect={() => {
                                setBankCode(bank.bankCode || '');
                                setBankName(bank.bankName || '');
                                setAccountName('');
                                setNameMatchResult(null);
                                setBankOpen(false);
                              }}
                            >
                              <CheckIcon className={`mr-2 h-4 w-4 ${bankCode === bank.bankCode ? 'opacity-100' : 'opacity-0'}`} />
                              {bank.bankName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setAccountNumber(val);
                    if (val.length < 10) { setAccountName(''); setNameMatchResult(null); }
                  }}
                  placeholder="0123456789"
                  maxLength={10}
                />
              </div>

              {/* Account Name / Verification Result */}
              {isVerifyingAccount && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RefreshIcon className="h-4 w-4 animate-spin" /> Verifying account...
                </div>
              )}

              {nameMatchResult && (
                <div className={`p-4 rounded-lg border ${nameMatchResult.isMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Account Name:</span> <span className="font-medium">{nameMatchResult.accountName}</span></p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Name Match:</span>
                      <Badge variant={nameMatchResult.isMatch ? 'default' : 'destructive'} className={nameMatchResult.isMatch ? 'bg-green-600' : ''}>
                        {Math.round(nameMatchResult.similarityScore * 100)}%
                      </Badge>
                      {nameMatchResult.isMatch
                        ? <span className="text-xs text-green-600">Matches your business name</span>
                        : <span className="text-xs text-red-600">Does not match (80% required)</span>
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('kyc-details')}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep('review-submit')} disabled={!canProceedStep2}>
                  Continue <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {step === 'review-submit' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review & Submit</CardTitle>
              <p className="text-sm text-muted-foreground">Confirm your details before submitting for review</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Info */}
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <h3 className="font-medium text-sm text-purple-800 mb-2">Business</h3>
                <p className="text-sm">{businessName}</p>
              </div>

              {/* KYC Info */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <h3 className="font-medium text-sm text-gray-800 mb-2">KYC Verification</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">Type:</span> {kycType} Number</p>
                  <p><span className="text-gray-500">Number:</span> {kycNumber}</p>
                  <p><span className="text-gray-500">Legal Name:</span> {kycResult?.legalName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Match:</span>
                    <Badge className="bg-green-600">{kycResult?.businessNameMatch != null ? `${Math.round(kycResult.businessNameMatch * 100)}%` : 'N/A'}</Badge>
                  </div>
                  <p><span className="text-gray-500">Document:</span> <Badge variant="outline" className="text-green-600 border-green-300"><CheckIcon className="h-3 w-3 mr-1" /> Uploaded</Badge></p>
                </div>
              </div>

              {/* Bank Info */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <h3 className="font-medium text-sm text-gray-800 mb-2">Bank Account</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">Bank:</span> {bankName}</p>
                  <p><span className="text-gray-500">Account:</span> {accountNumber}</p>
                  <p><span className="text-gray-500">Name:</span> {accountName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Match:</span>
                    <Badge className="bg-green-600">{nameMatchResult ? `${Math.round(nameMatchResult.similarityScore * 100)}%` : 'N/A'}</Badge>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('bank-account')}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                  {isSubmitting ? (
                    <><RefreshIcon className="h-4 w-4 animate-spin mr-1" /> Submitting...</>
                  ) : (
                    <><ShieldIcon className="h-4 w-4 mr-1" /> Submit for Review</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============ Status Pages ============

export function KycPendingReview() {
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);

  useEffect(() => {
    kycApi.getMyKycStatus().then(setKycStatus).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <RefreshIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Under Review</h2>
          <p className="text-gray-500 text-sm">
            Your KYC submission is being reviewed by our team.
            You'll receive an email once the review is complete.
          </p>
          {kycStatus && (
            <div className="text-left p-4 rounded-lg bg-gray-50 border text-sm space-y-1">
              <p><span className="text-gray-500">Type:</span> {kycStatus.kycType}</p>
              <p><span className="text-gray-500">Legal Name:</span> {kycStatus.kycLegalName}</p>
              <p><span className="text-gray-500">Submitted:</span> {kycStatus.kycSubmittedAt ? new Date(kycStatus.kycSubmittedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          )}
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            <RefreshIcon className="h-4 w-4 mr-1" /> Refresh Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function KycRejected({ onRetry }: { onRetry: () => void }) {
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);

  useEffect(() => {
    kycApi.getMyKycStatus().then(setKycStatus).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">KYC Not Approved</h2>
          <p className="text-gray-500 text-sm">
            Your KYC verification was not approved. Please review the feedback and try again.
          </p>
          {kycStatus?.kycReviewNotes && (
            <div className="text-left p-4 rounded-lg bg-red-50 border border-red-200 text-sm">
              <p className="font-medium text-red-800 mb-1">Reason:</p>
              <p className="text-red-700">{kycStatus.kycReviewNotes}</p>
            </div>
          )}
          <Button onClick={onRetry} className="bg-purple-600 hover:bg-purple-700 mt-4">
            Re-apply
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function KycUnderReview() {
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);

  useEffect(() => {
    kycApi.getMyKycStatus().then(setKycStatus).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
            <AlertCircleIcon className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Action Required</h2>
          <p className="text-gray-500 text-sm">
            Your submission has been returned for review. Please check the notes below and update your application.
          </p>
          {kycStatus?.kycReviewNotes && (
            <div className="text-left p-4 rounded-lg bg-orange-50 border border-orange-200 text-sm">
              <p className="font-medium text-orange-800 mb-1">Reviewer Notes:</p>
              <p className="text-orange-700">{kycStatus.kycReviewNotes}</p>
            </div>
          )}
          <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700 mt-4">
            Update & Resubmit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default BusinessKycOnboarding;
