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
import { throwApiError, zodIssuesToDetails } from '../common/http';

@Catch()
export class ZodErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      throwApiError(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Invalid input',
        { details: zodIssuesToDetails(exception.issues) },
      );
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
    throwApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'SERVER_ERROR',
      'Something went wrong',
    );
  }
}
