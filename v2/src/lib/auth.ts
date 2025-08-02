/**
 * Simple authentication for admin pages
 * In production, use proper auth service (Auth0, Clerk, etc.)
 */

export interface AuthConfig {
  enabled: boolean;
  adminToken?: string;
  allowedEmails?: string[];
}

export class AuthManager {
  private static instance: AuthManager;
  private config: AuthConfig;
  
  constructor() {
    this.config = {
      enabled: import.meta.env.PROD, // Only in production
      adminToken: import.meta.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN,
      allowedEmails: []
    };
  }
  
  static getInstance(): AuthManager {
    if (!this.instance) {
      this.instance = new AuthManager();
    }
    return this.instance;
  }
  
  /**
   * Verify admin access via token
   */
  verifyAdminToken(token: string | null): boolean {
    if (!this.config.enabled) return true; // Allow all in dev
    if (!token || !this.config.adminToken) return false;
    
    return token === this.config.adminToken;
  }
  
  /**
   * Check if request has valid auth
   */
  isAuthenticated(request: Request): boolean {
    if (!this.config.enabled) return true;
    
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      return this.verifyAdminToken(token);
    }
    
    // Check cookie
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      const adminToken = this.extractCookie(cookie, 'admin_token');
      return this.verifyAdminToken(adminToken);
    }
    
    return false;
  }
  
  /**
   * Generate auth response headers
   */
  getAuthHeaders(): HeadersInit {
    return {
      'WWW-Authenticate': 'Bearer realm="admin"',
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Extract cookie value
   */
  private extractCookie(cookieString: string, name: string): string | null {
    const cookies = cookieString.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key === name) return value;
    }
    return null;
  }
}

export const auth = AuthManager.getInstance();

/**
 * Middleware function for API routes
 */
export function requireAuth(handler: Function) {
  return async (context: any) => {
    if (!auth.isAuthenticated(context.request)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: auth.getAuthHeaders()
      });
    }
    
    return handler(context);
  };
}