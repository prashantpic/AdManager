import { Params } from 'nestjs-pino';
import { IAppConfig, NodeEnv } from '../config/config.interface';
import { LoggingConstants } from './logging.constants';
import { PrettyOptions } from 'pino-pretty';

/**
 * @description Configuration factory for `nestjs-pino` (PinoLogger).
 * REQ-11-016, REQ-14-015, REQ-16-025, REQ-16-026
 *
 * @param config The application configuration object.
 * @returns Configuration options for the Pino logger.
 */
export function loggerConfigFactory(config: IAppConfig): Params {
  const isProduction = config.NODE_ENV === 'production';
  const isTest = config.NODE_ENV === 'test';

  const pinoHttpOptions: Params['pinoHttp'] = {
    level: isTest ? 'silent' : config.LOG_LEVEL || 'info',
    customProps: (req: any, _res: any) => {
      // Ensure req object exists. In some non-HTTP contexts (like startup), req might be undefined.
      if (!req) {
        return {};
      }
      return {
        [LoggingConstants.CORRELATION_ID_LOG_KEY]: req.id || req.headers?.[LoggingConstants.CORRELATION_ID_HEADER],
        // Add other custom properties if needed, e.g., from req.user
      };
    },
    serializers: {
      req: (req) => {
        if (!req.raw) return req; // In case req is not a standard HTTP request
        return {
          id: req.id || req.raw.id, // pino-http might add id
          method: req.raw.method,
          url: req.raw.url,
          query: req.query,
          params: req.params,
          // Avoid logging sensitive headers by default, use redaction instead
          // headers: req.headers,
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
        };
      },
      res: (res) => {
         if (!res.raw) return res;
        return {
          statusCode: res.statusCode || res.raw.statusCode,
          // headers: res.getHeaders ? res.getHeaders() : {}, // Be careful with sensitive headers
        };
      },
      err: (err) => {
        return {
          type: err.type,
          message: err.message,
          stack: config.ENABLE_ADVANCED_LOGGING_DETAILS || !isProduction ? err.stack : undefined,
          ...err, // Include other properties of the error object
        };
      },
    },
    redact: {
      paths: config.LOG_REDACTION_PATHS || [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'res.headers.authorization',
        'res.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.secret',
        '*.token',
        '*.apiKey',
        '*.credentials',
      ],
      censor: '[REDACTED]',
    },
    autoLogging: {
      ignore: (req: any) => {
         // Example: Ignore health checks or specific paths
        if (req?.originalUrl === '/health' || req?.originalUrl === '/metrics') {
            return true;
        }
        return false;
      }
    },
    quietReqLogger: false, // Log request completion
    // TODO: Review integration with TracingService to automatically inject trace IDs from X-Ray context
    // This might involve custom logic or newer nestjs-pino features if available.
    // For now, relies on customProps and correlationId header propagation.
  };

  if (!isProduction && !isTest) {
    const prettyPrintOptions: PrettyOptions = {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname,context,req,res,responseTime', // Already handled or too verbose for pretty print
      messageFormat: (log: any, messageKey: string) => {
        const context = log.context || log.name || LoggingConstants.DEFAULT_CONTEXT;
        const correlationId = log[LoggingConstants.CORRELATION_ID_LOG_KEY];
        let msg = `[${context}] `;
        if (correlationId) {
            msg += `(${correlationId}) `;
        }
        msg += log[messageKey];
        return msg;
      }
    };
    pinoHttpOptions.transport = {
      target: 'pino-pretty',
      options: prettyPrintOptions,
    };
  }


  return {
    pinoHttp: pinoHttpOptions,
    // If you need to exclude certain routes from automatic logging by `LoggerModule`
    // exclude: [{ method: RequestMethod.ALL, path: 'health' }],
  };
}