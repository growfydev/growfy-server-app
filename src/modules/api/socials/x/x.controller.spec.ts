import { Test, TestingModule } from '@nestjs/testing';
import { XController } from './x.controller';

describe('XController', () => {
  let controller: XController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XController],
    }).compile();

    controller = module.get<XController>(XController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
