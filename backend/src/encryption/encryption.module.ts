import { Module } from '@nestjs/common';
import { EncryptionKeyService } from './encryption-key.service';
import { EncryptionController } from './encryption.controller';

@Module({
  controllers: [EncryptionController],
  providers: [EncryptionKeyService],
  exports: [EncryptionKeyService],
})
export class EncryptionModule {}
