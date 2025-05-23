import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';
import { UserAuthConfigService } from '../../config/user-auth.config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection;

  constructor(private readonly userAuthConfigService: UserAuthConfigService) {
    if (this.userAuthConfigService.isCsrfEnabled()) {
      this.csrfProtection = csurf({ 
        cookie: {
          httpOnly: true,
          secure: this.userAuthConfigService.get('NODE_ENV') === 'production',
          // sameSite: 'strict', // or 'lax'
        }
        // Can configure value function to get token from header for SPAs:
        // value: (req: Request) => req.headers['x-csrf-token'] as string,
      });
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.userAuthConfigService.isCsrfEnabled()) {
      return next();
    }

    this.csrfProtection(req, res, (err: any) => {
      if (err) {
        // Log the error for internal tracking
        console.error('CSRF Error:', err);
        // Return a generic error to the client
        // This error code 'EBADCSRFTOKEN' is standard from csurf
        if (err.code === 'EBADCSRFTOKEN') {
          return res.status(403).json({ message: 'Invalid CSRF token.' });
        }
        return res.status(500).json({ message: 'CSRF protection error.' });
      }
      
      // Make CSRF token available to templates or client-side scripts
      // If using a template engine, res.locals might be used.
      // For SPAs, often a separate endpoint /csrf-token provides this.
      // Or it's set in a cookie that JavaScript can read (if not httpOnly, but csurf cookie is httpOnly).
      // An alternative is to send it in the response body of a GET request.
      if (typeof req.csrfToken === 'function') {
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token, { 
            // Not httpOnly, so JS can read it.
            // Secure and SameSite should match main session cookie.
            secure: this.userAuthConfigService.get('NODE_ENV') === 'production',
            // sameSite: 'strict', 
        }); 
      }
      next();
    });
  }
}