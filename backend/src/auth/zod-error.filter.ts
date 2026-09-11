// ZodErrorFilter converts zod validation errors into the standardized
// error payload so the API surface matches authflow's behavior.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { zodIssuesToDetails } from '../common/http';

@Catch()
export class ZodErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        errorCode: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: zodIssuesToDetails(exception.issues),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'object' && payload !== null) {
        res.status(status).json(payload);
        return;
      }
      res.status(status).json({ message: payload });
      return;
    }

    this.logger.error(exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCode: 'SERVER_ERROR',
      message: 'Something went wrong',
    });
  }
}
