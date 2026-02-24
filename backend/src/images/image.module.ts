import { Module } from '@nestjs/common';
import { ImageOptimizationService } from './image-optimization.service';
import { ImageController } from './image.controller';

@Module({
  controllers: [ImageController],
  providers: [ImageOptimizationService],
  exports: [ImageOptimizationService],
})
export class ImageModule {}
