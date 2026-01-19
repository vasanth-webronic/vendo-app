/**
 * Authentication service for vm-service
 * Handles token generation, storage, and refresh
 */

const VM_SERVICE_URL = process.env.NEXT_PUBLIC_VM_SERVICE_URL || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_VM_SERVICE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET || '';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  project_id: string;
}

export interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  projectId: string;
  clientId?: string; // Store client_id for dynamic credentials
}

const TOKEN_STORAGE_KEY = 'vm-service-token';
const CREDENTIALS_STORAGE_KEY = 'vm-service-credentials';

/**
 * Get API base URL
 */
function getApiBaseUrl(): string {
  if (!VM_SERVICE_URL) {
    throw new Error('VM_SERVICE_URL is not configured');
  }
  return VM_SERVICE_URL.replace(/\/$/, '');
}

/**
 * Store credentials in localStorage
 */
export function storeCredentials(clientId: string, clientSecret: string): void {
  if (typeof window === 'undefined') return;
  
  const credentials = {
    clientId,
    clientSecret,
    storedAt: Date.now(),
  };
  
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

/**
 * Get stored credentials from localStorage
 */
export function getStoredCredentials(): { clientId: string; clientSecret: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!stored) return null;
    
    const credentials = JSON.parse(stored);
    return {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    };
  } catch {
    return null;
  }
}

/**
 * Clear stored credentials
 */
export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Get stored token from localStorage
 */
function getStoredToken(): TokenStorage | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    
    const token: TokenStorage = JSON.parse(stored);
    
    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= token.expiresAt - 5 * 60 * 1000) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    
    return token;
  } catch {
    return null;
  }
}

/**
 * Store token in localStorage
 */
function storeToken(token: TokenResponse, clientId?: string): void {
  if (typeof window === 'undefined') return;
  
  const tokenStorage: TokenStorage = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(token.expires_at).getTime(),
    projectId: token.project_id,
    clientId,
  };
  
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenStorage));
}

/**
 * Clear stored token (no-op since we're not caching tokens)
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  console.log('Clearing stored token (if any)');
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Clear all authentication data (credentials only, tokens are not cached)
 */
export function clearAllAuth(): void {
  clearToken();
  clearCredentials();
  console.log('All authentication data cleared');
}

/**
 * Get access token - ALWAYS fetches a fresh token (no caching)
 * @param clientId - Optional client ID (from URL params or env)
 * @param clientSecret - Optional client secret (from URL params or env)
 */
export async function getAccessToken(
  clientId?: string,
  clientSecret?: string
): Promise<string> {
  // Always fetch a fresh token - no caching
  // Determine which credentials to use (priority: provided params > env vars > stored credentials)
  let finalClientId = clientId;
  let finalClientSecret = clientSecret;

  // If not provided, use environment variables (primary source)
  if (!finalClientId || !finalClientSecret) {
    finalClientId = finalClientId || CLIENT_ID;
    finalClientSecret = finalClientSecret || CLIENT_SECRET;
  }

  // If still not available, try to get from stored credentials (fallback)
  if (!finalClientId || !finalClientSecret) {
    const storedCreds = getStoredCredentials();
    if (storedCreds) {
      finalClientId = finalClientId || storedCreds.clientId;
      finalClientSecret = finalClientSecret || storedCreds.clientSecret;
    }
  }

  // Validate credentials
  if (!finalClientId || !finalClientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET must be configured in environment variables (NEXT_PUBLIC_VM_SERVICE_CLIENT_ID and NEXT_PUBLIC_VM_SERVICE_CLIENT_SECRET)');
  }

  // Trim whitespace from credentials (common issue)
  finalClientId = finalClientId.trim();
  finalClientSecret = finalClientSecret.trim();

  const baseUrl = getApiBaseUrl();
  const tokenUrl = `${baseUrl}/api/v1/token`;
  
  // Prepare request body exactly as vm-service expects
  const requestBody = {
    client_id: finalClientId,
    client_secret: finalClientSecret,
  };

  console.log('Requesting token from:', tokenUrl);
  console.log('Using client_id:', finalClientId.substring(0, 8) + '...'); // Log partial ID for debugging

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Get response text first to see what we're dealing with
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Authentication failed with status ${response.status}`;
      let errorDetails: any = {};
      
      try {
        errorDetails = JSON.parse(responseText);
        errorMessage = errorDetails.error || errorDetails.message || errorMessage;
        
        // Log detailed error for debugging
        console.error('Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails.error,
          message: errorDetails.message,
          code: errorDetails.code,
        });
      } catch (parseError) {
        console.error('Failed to parse error response:', responseText);
        errorMessage = `Authentication failed: ${responseText || response.statusText}`;
      }
      
      // Provide helpful error messages based on status code
      if (response.status === 401) {
        throw new Error(`Invalid credentials (401): ${errorMessage}. Please verify your CLIENT_ID and CLIENT_SECRET in environment variables.`);
      } else if (response.status === 400) {
        throw new Error(`Bad request (400): ${errorMessage}. Please check your request format.`);
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}): ${errorMessage}. Please try again later.`);
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    let tokenResponse: TokenResponse;
    try {
      tokenResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse token response:', responseText);
      throw new Error('Invalid response format from server');
    }

    // Validate token response structure
    if (!tokenResponse.access_token) {
      throw new Error('Invalid token response: missing access_token');
    }

    // Validate token format (should be a JWT)
    const tokenParts = tokenResponse.access_token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Token does not appear to be a valid JWT (expected 3 parts separated by dots)');
    }

    console.log('Token obtained successfully');
    console.log('Token info:', {
      tokenType: tokenResponse.token_type,
      expiresAt: tokenResponse.expires_at,
      projectId: tokenResponse.project_id,
      tokenLength: tokenResponse.access_token.length,
      tokenPreview: tokenResponse.access_token.substring(0, 20) + '...',
    });
    
    // Don't store token - always fetch fresh token on each request
    // storeToken(tokenResponse, finalClientId);
    
    return tokenResponse.access_token;
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error instanceof Error) {
      throw error;
    }
    // Handle network errors
    console.error('Network error during token request:', error);
    throw new Error('Failed to connect to authentication server. Please check your VM_SERVICE_URL configuration.');
  }
}

/**
 * Refresh access token using refresh token
 * NOTE: Since we're not caching tokens, this just gets a new token
 */
export async function refreshAccessToken(): Promise<string> {
  // Always get a new token instead of refreshing
  console.log('Refreshing token - fetching new token instead');
  return getAccessToken();
}

/**
 * Get current access token - ALWAYS fetches a fresh token (no caching)
 * @param clientId - Optional client ID (from URL params or env)
 * @param clientSecret - Optional client secret (from URL params or env)
 */
export async function getCurrentAccessToken(
  clientId?: string,
  clientSecret?: string
): Promise<string> {
  // Always fetch a fresh token - no caching
  console.log('Fetching fresh access token...');
  return getAccessToken(clientId, clientSecret);
}

/**
 * Get stored project ID
 * NOTE: Since we're not caching tokens, this will always return null
 * Project ID should be obtained from the token response when needed
 */
export function getStoredProjectId(): string | null {
  // Not caching tokens anymore, so no stored project ID
  return null;
}

/**
 * Validate credentials format (helper for debugging)
 * Checks if credentials are properly formatted
 */
export function validateCredentialsFormat(clientId?: string, clientSecret?: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!clientId || clientId.trim().length === 0) {
    errors.push('CLIENT_ID is empty or not set');
  } else if (clientId.trim().length < 10) {
    errors.push('CLIENT_ID appears to be too short');
  }
  
  if (!clientSecret || clientSecret.trim().length === 0) {
    errors.push('CLIENT_SECRET is empty or not set');
  } else if (clientSecret.trim().length < 10) {
    errors.push('CLIENT_SECRET appears to be too short');
  }
  
  // Check for common issues
  if (clientId && clientId.includes(' ')) {
    errors.push('CLIENT_ID contains spaces - this may cause issues');
  }
  
  if (clientSecret && clientSecret.includes(' ')) {
    errors.push('CLIENT_SECRET contains spaces - this may cause issues');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
