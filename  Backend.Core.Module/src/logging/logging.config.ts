import { Params } from 'nestjs-pino';
import { Request, Response } from 'express'; // Using express types
import { v4 as uuidv4 } from 'uuid';
import { CoreConfigService } from '../config/config.service';
import { LoggingConstants } from './logging.constants';
import { IAppConfig } from '../config/config.interface';

/**
 * @file Configuration for the Pino logging library via nestjs-pino.
 * @namespace AdManager.Platform.Backend.Core.Logging
 * @requirement REQ-11-016, REQ-14-015, REQ-16-025, REQ-16-026
 */

export function loggerConfigFactory(
  configService: CoreConfigService,
): Params {
  const nodeEnv = configService.get<IAppConfig['NODE_ENV']>('NODE_ENV');
  const logLevel = configService.get<IAppConfig['LOG_LEVEL']>('LOG_LEVEL');
  const redactionPaths = configService.get<IAppConfig['LOG_REDACTION_PATHS']>('LOG_REDACTION_PATHS');
  const enableAdvancedLogging = configService.get<IAppConfig['FEATURE_FLAG_ENABLE_ADVANCED_LOGGING_DETAILS']>(
    'FEATURE_FLAG_ENABLE_ADVANCED_LOGGING_DETAILS',
  );

  const transport =
    nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard', // More human-readable timestamp
            singleLine: false,
            ignore: 'pid,hostname,context,req.headers,res.headers', // Already handled or too verbose
            messageFormat: '{context} - {msg}',
          },
        }
      : undefined; // In production, log JSON to stdout for CloudWatch Logs

  return {
    pinoHttp: {
      level: logLevel,
      transport: transport,
      redact: {
        paths: redactionPaths.length > 0 ? redactionPaths : ['req.headers.authorization', 'req.headers.cookie', 'body.password'], // Default redactions
        censor: '[REDACTED]',
      },
      customProps: (req: any, _res: any) => { // Using 'any' for req as IncomingMessage type might not have correlationId directly
        const correlationId = req.headers[LoggingConstants.CORRELATION_ID_HEADER] ||
                              req.headers[LoggingConstants.REQUEST_ID_HEADER] ||
                              uuidv4();
        // Ensure correlationId is set on the request object if not already present,
        // so it can be picked up by TracingInterceptor or other parts of the system.
        if (!req.headers[LoggingConstants.CORRELATION_ID_HEADER]) {
            req.headers[LoggingConstants.CORRELATION_ID_HEADER] = correlationId;
        }
        return {
          correlationId,
        };
      },
      // Define serializers for req, res, err
      serializers: {
        req: (req: Request) => {
          if (nodeEnv === 'development' && !enableAdvancedLogging) {
            return {
              method: req.method,
              url: req.url,
              correlationId: req.headers[LoggingConstants.CORRELATION_ID_HEADER],
            };
          }
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            // Do not log sensitive headers or full body by default
            // headers: req.headers, // Already redacted by `redact` option for specific headers
            remoteAddress: req.ip,
            remotePort: req.socket?.remotePort,
            correlationId: req.headers[LoggingConstants.CORRELATION_ID_HEADER],
          };
        },
        res: (res: Response) => {
          if (nodeEnv === 'development' && !enableAdvancedLogging) {
            return {
              statusCode: res.statusCode,
            };
          }
          return {
            statusCode: res.statusCode,
            // headers: res.getHeaders(), // Can be verbose, usually not needed
          };
        },
        err: (err: Error & { status?: number; code?: string; details?: any }) => {
          return {
            type: err.constructor.name,
            message: err.message,
            stack: enableAdvancedLogging || nodeEnv === 'development' ? err.stack : undefined,
            code: err.code,
            status: err.status,
            details: err.details,
          };
        },
      },
      // Generate a request ID if not already present
      genReqId: (req: Request) =>
        req.headers[LoggingConstants.CORRELATION_ID_HEADER] ||
        req.headers[LoggingConstants.REQUEST_ID_HEADER] ||
        uuidv4(),
      // Auto logging for requests and responses
      autoLogging: true,
      // Quiet req logging for certain paths (e.g., health checks)
      // quietReqLogger: true, // For specific paths, can be configured with filter
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          return 'silent'; // Typically redirects, can be noisy
        }
        return 'info';
      },
      // Add custom success/error messages
      customSuccessMessage: function (req, res) {
        if (res.statusCode === 404) {
          return `${req.method} ${req.url} - Resource not found`;
        }
        return `${req.method} ${req.url} completed ${res.statusCode}`;
      },
      customErrorMessage: function (req, res, err) {
        return `${req.method} ${req.url} errored ${res.statusCode} with ${err.message}`;
      },
      // Base properties to include in every log (e.g., application name, version)
      // base: {
      //   application: 'AdManagerPlatform',
      //   pid: process.pid,
      // },
      // Use `context` from NestJS logger
      useExistingCorrelationId: true, // Tries to use req.id if available
    },
    // We can also pass custom formatters here if needed
    // formatters: {
    //   level: (label) => {
    //     return { level: label.toUpperCase() };
    //   },
    //   bindings: (bindings) => {
    //     return {
    //       // pid: bindings.pid, // Redundant with base
    //       // hostname: bindings.hostname, // Redundant with base
    //       node_version: process.version,
    //     };
    //   },
    // },
  };
}