import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Bo qua JwtAuthGuard — dung cho noi dung cong khai va luong Guest. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
