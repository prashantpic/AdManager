import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as session from 'express-session';
// import { TypeormStore } from 'connect-typeorm'; // If using connect-typeorm
import { SessionRepository } from './session.repository';
import { UserAuthConfigService } from '../../config/user-auth.config';

// Custom TypeORM Store (simplified example, use connect-typeorm for production)
class CustomTypeOrmStore extends session.Store {
    constructor(private readonly sessionRepository: SessionRepository) {
        super();
    }

    get = (sid: string, callback: (err: any, session?: session.SessionData | null) => void): void => {
        this.sessionRepository.get(sid)
            .then(sessEntity => {
                if (!sessEntity || new Date(Number(sessEntity.expiredAt)) <= new Date()) {
                    return callback(null, null);
                }
                try {
                    const sessionData = JSON.parse(sessEntity.data);
                    callback(null, sessionData);
                } catch (e) {
                    callback(e);
                }
            })
            .catch(err => callback(err));
    }

    set = (sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): void => {
        // Assuming sessionData.cookie.maxAge is available
        const maxAge = sessionData.cookie?.maxAge || (this.sessionRepository['userAuthConfigService'] as UserAuthConfigService).getSessionMaxAge() * 1000; // Hacky access, inject properly
        this.sessionRepository.setSession(sid, sessionData, maxAge / 1000) // setSession expects ttl in seconds
            .then(() => callback && callback())
            .catch(err => callback && callback(err));
    }

    destroy = (sid: string, callback?: (err?: any) => void): void => {
        this.sessionRepository.destroy(sid)
            .then(() => callback && callback())
            .catch(err => callback && callback(err));
    }

    touch = (sid: string, sessionData: session.SessionData, callback?: () => void): void => {
      this.sessionRepository.touch(sid, sessionData)
            .then(() => callback && callback())
            .catch(err => callback && callback()); // express-session signature has no err for touch callback
    }
}


@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly userAuthConfigService: UserAuthConfigService,
    private readonly sessionRepository: SessionRepository, // Required if using TypeORM store
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const sessionSecret = this.userAuthConfigService.getSessionSecret();
    const sessionMaxAgeSeconds = this.userAuthConfigService.getSessionMaxAge();
    
    // If using connect-typeorm:
    // const store = new TypeormStore({
    //   cleanupLimit: 2,
    //   limitSubquery: false, // If using MariaDB
    //   ttl: sessionMaxAgeSeconds, 
    // }).connect(this.sessionRepository.typeormRepository); // connect-typeorm needs the raw TypeORM repository

    const store = new CustomTypeOrmStore(this.sessionRepository);

    session({
      store: store, // Use TypeORM store if configured
      secret: sessionSecret,
      resave: false, // Don't save session if unmodified
      saveUninitialized: false, // Don't create session until something stored
      cookie: {
        maxAge: sessionMaxAgeSeconds * 1000, // Convert seconds to milliseconds
        httpOnly: true,
        secure: this.userAuthConfigService.get('NODE_ENV') === 'production', // Use secure cookies in production
        // sameSite: 'lax', // Consider CSRF implications
      },
    })(req, res, next);
  }
}