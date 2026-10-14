import { describe, it, expect, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  it('should format HttpException correctly', () => {
    const filter = new AllExceptionsFilter();
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const hostMock = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/v1/test' }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException('Bad Request Sample', HttpStatus.BAD_REQUEST);

    filter.catch(exception, hostMock);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Bad Request Sample',
        path: '/api/v1/test',
      }),
    );
  });
});
