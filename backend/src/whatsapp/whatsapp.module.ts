import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [forwardRef(() => OutboxModule)],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
