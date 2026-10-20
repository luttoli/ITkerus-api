import { BadRequestException, ValidationPipe } from '@nestjs/common';

export function createAppValidationPipe() {
  return new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
    exceptionFactory: () =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '요청값을 확인해주세요.',
      }),
  });
}
