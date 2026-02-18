import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authApi, UserProfileResponse, SignupRequest, LoginRequest } from '@/lib/api';
import { businessesApi, BusinessResponse } from '@/lib/api';
import { clearTokens } from '@/lib/api';

interface AuthContextType {
  user: UserProfileResponse | null;
  business: BusinessResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ businessSlug: string | null; mustChangePassword: boolean }>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  refreshUser: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  createBusiness: (name: string) => Promise<BusinessResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Skip server refresh when we just logged in (data is already fresh)
  const justLoggedIn = useRef(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authApi.getStoredUser();
        const storedBusiness = businessesApi.getStoredBusiness();
        const hasToken = authApi.isAuthenticated();

        if (storedUser && hasToken) {
          setUser(storedUser);
          setBusiness(storedBusiness);

          // Skip server refresh if we just logged in - data is already fresh
          if (justLoggedIn.current) {
            justLoggedIn.current = false;
            return;
          }

          // Refresh user + business from server in parallel
          try {
            const [freshUser, freshBusiness] = await Promise.all([
              authApi.getProfile(),
              businessesApi.getMyBusiness().catch(() => null),
            ]);
            setUser(freshUser);
            setBusiness(freshBusiness);
          } catch {
            // Token might be invalid, clear it
            clearTokens();
            setUser(null);
            setBusiness(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest): Promise<{ businessSlug: string | null; mustChangePassword: boolean }> => {
    // Clear any stale tokens first to prevent race conditions with initAuth
    clearTokens();

    const response = await authApi.login(data);

    // Mark that we just logged in so initAuth skips redundant server refresh
    justLoggedIn.current = true;

    // Build user object from response fields
    const userData: UserProfileResponse = {
      userId: response.userId || '',
      email: response.email || '',
      firstName: response.firstName || '',
      lastName: response.lastName || '',
      phone: null,
      isActive: true,
      isVerified: false,
      roles: response.roles || [],
      permissions: response.permissions || [],
    };
    setUser(userData);

    // Use businessSlug from login response directly (no extra API call needed)
    const businessSlug = response.businessSlug || null;

    // Set business immediately from login response so dashboard doesn't see null
    if (response.businessId) {
      const immediateBusiness: BusinessResponse = {
        businessId: response.businessId,
        businessName: response.businessName || null,
        businessSlug: response.businessSlug || null,
        businessEmail: null,
        businessPhone: null,
        businessAddress: null,
        businessLogoUrl: null,
        businessWebsite: null,
        businessNotificationUrl: null,
        businessBankCode: null,
        businessAccountName: null,
        businessAccountNumber: null,
        businessNddBillerNibssId: null,
        businessNddBillerLocalId: null,
        businessNddSyncStatus: null,
        businessNddSyncedAt: null,
        businessOwnerId: null,
        businessStatus: response.businessStatus || null,
        businessCreatedAt: null,
        businessUpdatedAt: null,
        businessKycType: null,
        businessKycStatus: response.businessKycStatus || null,
        businessKycLegalName: null,
        businessKycVerified: null,
        businessKycReviewNotes: null,
        businessKycSubmittedAt: null,
        serviceTierName: null,
        serviceTierBillingCycle: null,
        businessSubscriptionStatus: null,
      };
      setBusiness(immediateBusiness);
      localStorage.setItem('business', JSON.stringify(immediateBusiness));

      // Fetch full business data in background to fill remaining fields
      businessesApi.getMyBusiness().then((fullBusiness) => {
        setBusiness(fullBusiness);
      }).catch(() => {});
    }

    return { businessSlug, mustChangePassword: response.mustChangePassword === true };
  };

  const signup = async (data: SignupRequest) => {
    const response = await authApi.signup(data);

    // Build user object from response fields
    const userData: UserProfileResponse = {
      userId: response.userId || '',
      email: response.email || '',
      firstName: response.firstName || '',
      lastName: response.lastName || '',
      phone: null,
      isActive: true,
      isVerified: false,
      roles: response.roles || [],
      permissions: response.permissions || [],
    };
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setBusiness(null);
    }
  };

  // Clear session without calling logout API (for login page cleanup)
  const clearSession = () => {
    clearTokens();
    setUser(null);
    setBusiness(null);
  };

  const refreshUser = async () => {
    if (authApi.isAuthenticated()) {
      const freshUser = await authApi.getProfile();
      setUser(freshUser);
    }
  };

  const refreshBusiness = async () => {
    if (authApi.isAuthenticated()) {
      try {
        const freshBusiness = await businessesApi.getMyBusiness();
        setBusiness(freshBusiness);
      } catch {
        setBusiness(null);
      }
    }
  };

  const createBusiness = async (name: string): Promise<BusinessResponse> => {
    // Get email from current user or throw error
    const email = user?.email;
    if (!email) {
      throw new Error('User email is required to create a business');
    }
    const newBusiness = await businessesApi.create({ businessName: name, businessEmail: email });
    setBusiness(newBusiness);
    await refreshUser();
    return newBusiness;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isLoading,
        isAuthenticated: !!user && authApi.isAuthenticated(),
        login,
        signup,
        logout,
        clearSession,
        refreshUser,
        refreshBusiness,
        createBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
