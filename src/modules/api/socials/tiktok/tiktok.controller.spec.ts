import { Test, TestingModule } from '@nestjs/testing';
import { TiktokController } from './tiktok.controller';

describe('TiktokController', () => {
  let controller: TiktokController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiktokController],
    }).compile();

    controller = module.get<TiktokController>(TiktokController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
