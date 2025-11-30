/**
 * API Client
 * Frontend client for making requests to the Express backend
 */

// Get API URL from environment or use default
// For mobile devices, use your computer's IP address instead of localhost
const getApiBaseUrl = () => {
  // First priority: Use environment variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to IP address for mobile (works for both Android and iOS)
  // Change 192.168.0.8 to your actual computer IP if different
  // For Android emulator, you can use: http://10.0.2.2:3000/api
  // For web, this will still work if backend is accessible
  return 'http://192.168.0.8:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
if (__DEV__) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      // Add timeout for fetch requests (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Backend might not be running or returned non-JSON response
        if (!response.ok) {
          throw new Error(
            `Backend server returned non-JSON response (${response.status}). ` +
            'Make sure the backend is running on port 3000.'
          );
        }
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data.data as T;
    } catch (error: any) {
      // Handle abort/timeout errors - return a simple error without verbose messages
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        const timeoutError = new Error('Connection timeout');
        timeoutError.name = 'ConnectionTimeout';
        throw timeoutError;
      }
      
      // Handle network errors - return a simple error
      if (error instanceof TypeError || error?.message?.includes('Network request failed') || 
          error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch')) {
        const networkError = new Error('Cannot connect to backend server');
        networkError.name = 'NetworkError';
        throw networkError;
      }
      
      // Handle JSON parsing errors
      if (error instanceof SyntaxError || error?.message?.includes('JSON')) {
        const jsonError = new Error('Backend server returned invalid response');
        jsonError.name = 'InvalidResponse';
        throw jsonError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;

