import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Minimal E2E Test', () => {
  it('should compile the app module', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    await app.close();
  });
});
