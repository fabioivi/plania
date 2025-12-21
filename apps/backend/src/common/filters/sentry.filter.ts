import {
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Only report 500s or non-http errors to Sentry
        // or specific critical 4xx like 401/403 if desired.
        // Here we report everything >= 500
        if (httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
            Sentry.captureException(exception);
        }

        super.catch(exception, host);
    }
}
