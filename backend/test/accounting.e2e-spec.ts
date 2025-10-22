
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';
import { BetaKeysService } from '../src/modules/beta-keys/beta-keys.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { ProductsService } from '../src/modules/products/products.service';
import { CreateProductDto } from '../src/modules/products/dto/create-product.dto';
import { BusinessType } from '../src/modules/tenants/entities/tenant.entity';
import { RegisterDto } from '../src/modules/auth/dto/register.dto';

describe('Accounting (e2e)', () => {
  let app: INestApplication;
  let betaKeysService: BetaKeysService;
  let authService: AuthService;
  let productsService: ProductsService;
  let accessToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // betaKeysService = moduleFixture.get<BetaKeysService>(BetaKeysService);
    // authService = moduleFixture.get<AuthService>(AuthService);
    // productsService = moduleFixture.get<ProductsService>(ProductsService);

    // // 1. Create a beta key
    // const betaKey = await betaKeysService.createBetaKey('e2e-test-accounting');

    // // 2. Register a new user
    // const registerDto: RegisterDto = {
    //   betaKey: betaKey.key,
    //   businessName: 'Test Business',
    //   nit: '123456789-1',
    //   businessType: BusinessType.TIENDA,
    //   address: 'Test Address',
    //   businessPhone: '1234567890',
    //   businessEmail: 'business@test.com',
    //   email: 'admin@test.com',
    //   password: 'password',
    //   firstName: 'Test',
    //   lastName: 'User',
    //   documentId: '123456789',
    //   phoneNumber: '1234567890',
    // };
    // const registration = await authService.register(registerDto);
    // accessToken = registration.accessToken;
    // tenantId = registration.tenant.id;
  });

  afterAll(async () => {
    await getConnection().close();
    await app.close();
  });

  it('debe generar asiento automático al crear venta', async () => {
    // 1. Create a product
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      sku: 'TP001',
      basePrice: 100000,
      stock: 10,
    };
    const product = await productsService.create(createProductDto, tenantId);

    // 2. Create a sale
    const sale = {
      items: [
        {
          productId: product.id,
          quantity: 1,
          price: product.basePrice,
        },
      ],
      paymentMethod: 'cash',
      total: product.basePrice,
      subtotal: product.basePrice,
      tax: 0,
    };

    const saleResponse = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(sale)
      .expect(201);

    // 3. Verify journal entry
    const journalEntries = await request(app.getHttpServer())
      .get('/api/accounting/journal-entries')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ referenceId: saleResponse.body.id });

    expect(journalEntries.body).toHaveLength(1);
    const entry = journalEntries.body[0];
    expect(entry.entryType).toBe('sale');
    expect(entry.referenceId).toBe(saleResponse.body.id);
  });
});
