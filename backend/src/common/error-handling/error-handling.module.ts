import { Module } from '@nestjs/common';
import { FriendlyErrorHandlerService } from './friendly-error-handler.service';

@Module({
  providers: [FriendlyErrorHandlerService],
  exports: [FriendlyErrorHandlerService],
})
export class ErrorHandlingModule {}