interface AuthResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    profileImage?: string;
    languages: Array<{
      code: string;
      name: string;
      proficiency: string;
      isNative: boolean;
    }>;
    stats: {
      totalSubmissions: number;
      correctAnswers: number;
      accuracy: number;
      currentStreak: number;
      longestStreak: number;
      reputation: number;
      totalRewards: number;
    };
    validatorStatus: {
      isValidator: boolean;
      approvedLanguages: string[];
      validationAccuracy: number;
      totalValidations: number;
    };
    preferences: {
      defaultSourceLanguage: string;
      defaultTargetLanguage: string;
      difficulty: string;
      notifications: {
        email: boolean;
        browser: boolean;
      };
    };
    createdAt: string;
    updatedAt?: string;
  };
  expiresIn: string;
}

interface NonceResponse {
  nonce: string;
  message: string;
  walletAddress: string;
}

class AuthService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  // Get authentication headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Get nonce for wallet authentication
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/auth/nonce?walletAddress=${walletAddress}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get nonce');
      }

      return await response.json();
    } catch (error) {
      console.error('Get nonce error:', error);
      throw error;
    }
  }

  // Verify signature and authenticate
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authData = await response.json();
      
      // Store token in localStorage and instance
      this.token = authData.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', authData.token);
      }

      return authData;
    } catch (error) {
      console.error('Verify signature error:', error);
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    try {
      if (!this.token) return null;

      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear it
          this.clearAuth();
          return null;
        }
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearAuth();
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData: Partial<{
    username: string;
    email: string;
    languages: Array<{
      code: string;
      name: string;
      proficiency: string;
      isNative: boolean;
    }>;
    preferences: {
      defaultSourceLanguage: string;
      defaultTargetLanguage: string;
      difficulty: string;
      notifications: {
        email: boolean;
        browser: boolean;
      };
    };
  }>): Promise<AuthResponse['user']> {
    try {
      const response = await fetch(`${this.baseURL}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/users/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get user stats');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Refresh JWT token
  async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.clearAuth();
        return null;
      }

      const data = await response.json();
      this.token = data.token;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
      }

      return data.token;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearAuth();
      return null;
    }
  }

  // Clear authentication
  clearAuth(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { AuthResponse, NonceResponse };