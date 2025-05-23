import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { IAppConfig, NodeEnvironment } from '../config/config.interface';
import { IncomingMessage, ServerResponse } from 'http';
import { nanoid } from 'nanoid'; // For generating request IDs if not present
import { LoggingConstants } from './logging.constants';

// This is a simplified representation. TracingService integration would be more complex.
// For now, we'll assume correlation ID might come from headers.
const getCorrelationId = (req: IncomingMessage): string => {
  const correlationIdHeader = req.headers[LoggingConstants.CORRELATION_ID_HEADER.toLowerCase()];
  const requestIdHeader = req.headers[LoggingConstants.REQUEST_ID_HEADER.toLowerCase()];

  if (typeof correlationIdHeader === 'string' && correlationIdHeader) {
    return correlationIdHeader;
  }
  if (typeof requestIdHeader === 'string' && requestIdHeader) {
    return requestIdHeader;
  }
  // If X-Ray is active, AWSXRay.getSegment()?.trace_id could be used,
  // but direct AWSXRay import here might be problematic without proper setup.
  // This needs careful integration with TracingService/Interceptor.
  return nanoid(); // Generate a new one if not found
};


/**
 * @file Configuration for the Pino logging library via `nestjs-pino`.
 * @Requirement REQ-11-016, REQ-14-015, REQ-16-025, REQ-16-026
 */
export const getLoggerConfig = (configService: ConfigService<IAppConfig, true>): Params => {
  const nodeEnv = configService.get('NODE_ENV');
  const logLevel = configService.get('LOG_LEVEL');
  const logRedactionPaths = configService.get('LOG_REDACTION_PATHS');
  const enableAdvancedLogging = configService.get('ENABLE_ADVANCED_LOGGING_DETAILS', false);

  const isProduction = nodeEnv === NodeEnvironment.Production || nodeEnv === NodeEnvironment.Staging;

  const pinoHttpOptions: NonNullable<Params['pinoHttp']> = {
    level: logLevel,
    // autoLogging: true, // Default: true. Logs all requests and responses.
    customProps: (req: IncomingMessage & { id?: string }) => {
      return {
        correlationId: req.id, // pino-http uses req.id for request id
      };
    },
    // genReqId: Use pino-http's default or provide a custom one if needed,
    // that integrates with TracingService or X-Ray.
    // For now, rely on pino-http's default or set one from header.
    genReqId: (req: IncomingMessage) => getCorrelationId(req),

    // Redact sensitive information
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'res.headers["set-cookie"]',
        ...logRedactionPaths,
      ],
      censor: '[REDACTED]',
    },

    // Customize logging format (JSON for production)
    transport: !isProduction
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname,req,res,responseTime,context,correlationId', // Pretty print ignores these, pino-http adds them
            messageFormat: '{context} - {correlationId} - {msg}',
            singleLine: false,
          },
        }
      : undefined, // Defaults to standard JSON output for production

    // Customize log messages for requests and responses
    customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 300 && res.statusCode < 400) return 'silent'; // Reduce noise for redirects
      return 'info';
    },
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      if (res.statusCode === 404) return `${req.method} ${req.url} - Resource not found`;
      return `${req.method} ${req.url} - Completed ${res.statusCode}`;
    },
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, error: Error) => {
      return `${req.method} ${req.url} - Error ${res.statusCode}: ${error.message}`;
    },
    // Include additional properties in request/response logs
    serializers: {
      req: (req) => {
        if (!enableAdvancedLogging && isProduction) {
          return {
            method: req.method,
            url: req.url,
            // id: req.id, // already handled by customProps
          };
        }
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          headers: req.headers,
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
        };
      },
      res: (res) => {
        if (!enableAdvancedLogging && isProduction) {
          return {
            statusCode: res.statusCode,
          };
        }
        return {
          statusCode: res.statusCode,
          headers: (res as any).getHeaders ? (res as any).getHeaders() : res.headers, // Handle different ways headers might be stored
        };
      },
      err: (err) => {
        return {
          type: err.type,
          message: err.message,
          stack: enableAdvancedLogging || !isProduction ? err.stack : undefined,
          ...err, // include other properties of the error
        };
      },
    },
  };

  return {
    pinoHttp: pinoHttpOptions,
    // If you want to exclude certain routes from automatic logging by `nestjs-pino`
    // exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    // forRoutes: ['*'], // Or specify which controllers/routes to apply pino-http to
  };
};