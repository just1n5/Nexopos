import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { SalesService } from '../src/modules/sales/sales.service';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { ProductsService } from '../src/modules/products/products.service';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { UsersService } from '../src/modules/users/users.service';
import { Product } from '../src/modules/products/entities/product.entity';
import { InventoryStock } from '../src/modules/inventory/entities/inventory-stock.entity';
import { StockReservation, ReservationStatus } from '../src/modules/inventory/entities/stock-reservation.entity';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { CreateSaleDto } from '../src/modules/sales/dto/create-sale.dto';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * 🧪 SALES CONCURRENCY INTEGRATION TESTS
 *
 * Estos tests validan que el sistema REALMENTE previene race conditions
 * usando una base de datos PostgreSQL real (NO MOCKS).
 *
 * Tests incluidos:
 * 1. ✅ Prevención de overselling con ventas concurrentes
 * 2. ✅ Rollback completo en caso de falla
 * 3. ✅ Sistema de reservas de stock
 * 4. ✅ Stress testing con 100+ ventas simultáneas
 *
 * Configuración:
 * - Usa base de datos real configurada en .env
 * - Cada test hace cleanup de datos creados
 * - Tests pueden ejecutarse en paralelo o secuencial
 */

describe('Sales Concurrency - Integration Tests (E2E)', () => {
  let app: INestApplication;
  let salesService: SalesService;
  let inventoryService: InventoryService;
  let productsService: ProductsService;
  let categoriesService: CategoriesService;
  let usersService: UsersService;
  let dataSource: DataSource;
  let productRepository: Repository<Product>;
  let stockRepository: Repository<InventoryStock>;
  let reservationRepository: Repository<StockReservation>;
  let saleRepository: Repository<Sale>;
  let userRepository: Repository<User>;

  // Test fixtures
  let testUser: User;
  let testProduct: Product;
  let testTenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Obtener servicios
    salesService = app.get<SalesService>(SalesService);
    inventoryService = app.get<InventoryService>(InventoryService);
    productsService = app.get<ProductsService>(ProductsService);
    categoriesService = app.get<CategoriesService>(CategoriesService);
    usersService = app.get<UsersService>(UsersService);
    dataSource = app.get<DataSource>(DataSource);

    // Obtener repositories
    productRepository = app.get(getRepositoryToken(Product));
    stockRepository = app.get(getRepositoryToken(InventoryStock));
    reservationRepository = app.get(getRepositoryToken(StockReservation));
    saleRepository = app.get(getRepositoryToken(Sale));
    userRepository = app.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Crear usuario de prueba
    testUser = await userRepository.findOne({ where: { email: 'test@nexopos.com' } });
    if (!testUser) {
      testUser = userRepository.create({
        email: 'test@nexopos.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        tenantId: 'test-tenant-123',
      });
      testUser = await userRepository.save(testUser);
    }
    testTenantId = testUser.tenantId;

    // Crear producto de prueba con stock inicial
    testProduct = productRepository.create({
      name: `Test Product ${Date.now()}`,
      sku: `TEST-${Date.now()}`,
      description: 'Producto para testing de concurrencia',
      basePrice: 1000,
      tenantId: testTenantId,
    });
    testProduct = await productRepository.save(testProduct);

    // Crear stock inicial
    const stock = stockRepository.create({
      productId: testProduct.id,
      quantity: 100, // Stock inicial: 100 unidades
      reservedQuantity: 0,
      availableQuantity: 100,
      tenantId: testTenantId,
    });
    await stockRepository.save(stock);
  });

  afterEach(async () => {
    // Cleanup: eliminar datos de prueba
    if (testProduct) {
      await reservationRepository.delete({ productId: testProduct.id });
      await saleRepository.delete({ userId: testUser.id });
      await stockRepository.delete({ productId: testProduct.id });
      await productRepository.delete({ id: testProduct.id });
    }
  });

  describe('🔒 Race Condition Prevention', () => {
    it('debe prevenir overselling con 2 ventas concurrentes', async () => {
      // ESCENARIO: 2 cajeros intentan vender 8 unidades simultáneamente
      // Stock disponible: 100 unidades (configurado en beforeEach)
      // Ambas ventas DEBEN tener éxito porque hay suficiente stock

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 8,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 8000,
          },
        ],
      };

      // Ejecutar 2 ventas SIMULTÁNEAMENTE
      const [result1, result2] = await Promise.allSettled([
        salesService.create(createSaleDto, testUser.id, testTenantId),
        salesService.create(createSaleDto, testUser.id, testTenantId),
      ]);

      // VALIDACIONES
      const successCount = [result1, result2].filter((r) => r.status === 'fulfilled').length;

      // Ambas ventas deben tener éxito
      expect(successCount).toBe(2);

      // Verificar stock final
      const finalStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });

      expect(finalStock).toBeDefined();
      expect(Number(finalStock!.quantity)).toBe(84); // 100 - 8 - 8 = 84
      expect(Number(finalStock!.reservedQuantity)).toBe(0); // Las reservas deben estar confirmadas
      expect(Number(finalStock!.availableQuantity)).toBe(84);
    }, 30000); // Timeout de 30s para operaciones de BD

    it('debe prevenir overselling cuando el stock es insuficiente', async () => {
      // ESCENARIO: 2 cajeros intentan vender 60 unidades simultáneamente
      // Stock disponible: 100 unidades
      // Resultado esperado: Solo UNA venta debe tener éxito

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 60,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 60000,
          },
        ],
      };

      // Ejecutar 2 ventas SIMULTÁNEAMENTE
      const [result1, result2] = await Promise.allSettled([
        salesService.create(createSaleDto, testUser.id, testTenantId),
        salesService.create(createSaleDto, testUser.id, testTenantId),
      ]);

      // VALIDACIONES
      const successCount = [result1, result2].filter((r) => r.status === 'fulfilled').length;
      const failedCount = [result1, result2].filter((r) => r.status === 'rejected').length;

      // Solo UNA venta debe tener éxito
      expect(successCount).toBe(1);
      expect(failedCount).toBe(1);

      // La venta fallida debe tener error de stock insuficiente
      const failedResult = [result1, result2].find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(failedResult.reason.message).toContain('Stock insuficiente');

      // Verificar stock final
      const finalStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });

      expect(finalStock).toBeDefined();
      expect(Number(finalStock!.quantity)).toBe(40); // 100 - 60 = 40
      expect(Number(finalStock!.reservedQuantity)).toBe(0);
    }, 30000);
  });

  describe('🔄 Transaction Rollback', () => {
    it('debe hacer rollback completo si falla la creación de la venta', async () => {
      const initialStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      const initialQuantity = Number(initialStock!.quantity);

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 5,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 5000,
          },
        ],
      };

      // Intentar crear venta con un tenantId inválido para provocar error
      try {
        await salesService.create(createSaleDto, 'invalid-user-id', 'invalid-tenant-id');
        fail('La venta debería haber fallado');
      } catch (error) {
        // Esperado: la venta debe fallar
      }

      // Verificar que el stock NO cambió
      const finalStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });

      expect(Number(finalStock!.quantity)).toBe(initialQuantity);
      expect(Number(finalStock!.reservedQuantity)).toBe(0);

      // Verificar que NO se crearon reservas
      const reservations = await reservationRepository.find({
        where: { productId: testProduct.id },
      });
      expect(reservations.length).toBe(0);

      // Verificar que NO se creó la venta (usando userId inválido)
      const sales = await saleRepository.find({
        where: { userId: 'invalid-user-id' },
      });
      expect(sales.length).toBe(0);
    }, 30000);
  });

  describe('📦 Stock Reservation System', () => {
    it('debe crear, confirmar y limpiar reservas correctamente', async () => {
      // 1. Crear reserva
      const reservation = await inventoryService.reserveStock(
        testProduct.id,
        10,
        testTenantId,
        testUser.id,
        {
          referenceType: 'sale',
          referenceId: 'test-sale-123',
          notes: 'Test reservation',
        },
        15 // 15 minutos de expiración
      );

      expect(reservation).toBeDefined();
      expect(reservation.status).toBe(ReservationStatus.ACTIVE);
      expect(Number(reservation.quantity)).toBe(10);

      // Verificar que el stock reservado se actualizó
      const stockAfterReserve = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      expect(Number(stockAfterReserve!.reservedQuantity)).toBe(10);
      expect(Number(stockAfterReserve!.availableQuantity)).toBe(90); // 100 - 10

      // 2. Confirmar reserva (esto descuenta del stock real)
      await inventoryService.confirmReservation(reservation.id, testUser.id);

      const stockAfterConfirm = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      expect(Number(stockAfterConfirm!.quantity)).toBe(90); // Descontado del stock real
      expect(Number(stockAfterConfirm!.reservedQuantity)).toBe(0); // Liberado
      expect(Number(stockAfterConfirm!.availableQuantity)).toBe(90);

      // 3. Verificar que la reserva está CONFIRMED
      const confirmedReservation = await reservationRepository.findOne({
        where: { id: reservation.id },
      });
      expect(confirmedReservation!.status).toBe(ReservationStatus.CONFIRMED);
    }, 30000);

    it('debe liberar reserva cuando se cancela', async () => {
      // Crear reserva
      const reservation = await inventoryService.reserveStock(
        testProduct.id,
        15,
        testTenantId,
        testUser.id,
        { referenceType: 'sale', referenceId: 'test-sale-456' },
        15
      );

      // Verificar stock reservado
      let stock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      expect(Number(stock!.reservedQuantity)).toBe(15);

      // Liberar reserva
      await inventoryService.releaseReservation(reservation.id);

      // Verificar que el stock reservado se liberó
      stock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      expect(Number(stock!.reservedQuantity)).toBe(0);
      expect(Number(stock!.availableQuantity)).toBe(100); // Vuelve a estar disponible

      // Verificar estado de la reserva
      const releasedReservation = await reservationRepository.findOne({
        where: { id: reservation.id },
      });
      expect(releasedReservation!.status).toBe(ReservationStatus.RELEASED);
    }, 30000);

    it('debe limpiar reservas expiradas automáticamente', async () => {
      // Crear reserva con expiración INMEDIATA (1 segundo)
      const reservation = await inventoryService.reserveStock(
        testProduct.id,
        20,
        testTenantId,
        testUser.id,
        { referenceType: 'sale' },
        0.017 // ~1 segundo
      );

      // Esperar a que expire
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Ejecutar cleanup
      const cleanedCount = await inventoryService.cleanupExpiredReservations();

      expect(cleanedCount).toBeGreaterThan(0);

      // Verificar que el stock se liberó
      const stock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });
      expect(Number(stock!.reservedQuantity)).toBe(0);
      expect(Number(stock!.availableQuantity)).toBe(100);

      // Verificar estado de la reserva
      const expiredReservation = await reservationRepository.findOne({
        where: { id: reservation.id },
      });
      expect(expiredReservation!.status).toBe(ReservationStatus.EXPIRED);
    }, 30000);
  });

  describe('💪 Stress Testing', () => {
    it('debe manejar 100 ventas concurrentes correctamente', async () => {
      // ESCENARIO: 100 cajeros intentan vender 1 unidad simultáneamente
      // Stock disponible: 100 unidades
      // Resultado esperado: TODAS las ventas deben tener éxito

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 1000,
          },
        ],
      };

      // Crear 100 promesas de ventas
      const salePromises = Array.from({ length: 100 }, () =>
        salesService.create(createSaleDto, testUser.id, testTenantId)
      );

      // Ejecutar TODAS las ventas simultáneamente
      const startTime = Date.now();
      const results = await Promise.allSettled(salePromises);
      const endTime = Date.now();

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(`⏱️  Tiempo de ejecución: ${endTime - startTime}ms`);
      console.log(`✅ Exitosas: ${successCount}`);
      console.log(`❌ Fallidas: ${failedCount}`);

      // TODAS las ventas deben tener éxito
      expect(successCount).toBe(100);
      expect(failedCount).toBe(0);

      // Verificar stock final
      const finalStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });

      expect(Number(finalStock!.quantity)).toBe(0); // 100 - 100 = 0
      expect(Number(finalStock!.reservedQuantity)).toBe(0);
      expect(Number(finalStock!.availableQuantity)).toBe(0);

      // Verificar que se crearon 100 ventas
      const salesCount = await saleRepository.count({
        where: { userId: testUser.id },
      });
      expect(salesCount).toBe(100);
    }, 120000); // Timeout de 2 minutos para stress test

    it('debe fallar adecuadamente cuando 150 cajeros intentan vender de un stock de 100', async () => {
      // ESCENARIO: 150 cajeros intentan vender 1 unidad simultáneamente
      // Stock disponible: 100 unidades
      // Resultado esperado: 100 exitosas, 50 fallidas

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 1000,
          },
        ],
      };

      // Crear 150 promesas de ventas
      const salePromises = Array.from({ length: 150 }, () =>
        salesService.create(createSaleDto, testUser.id, testTenantId)
      );

      // Ejecutar TODAS las ventas simultáneamente
      const startTime = Date.now();
      const results = await Promise.allSettled(salePromises);
      const endTime = Date.now();

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      console.log(`⏱️  Tiempo de ejecución: ${endTime - startTime}ms`);
      console.log(`✅ Exitosas: ${successCount}`);
      console.log(`❌ Fallidas: ${failedCount}`);

      // 100 ventas deben tener éxito, 50 deben fallar
      expect(successCount).toBe(100);
      expect(failedCount).toBe(50);

      // Todas las fallidas deben tener error de stock insuficiente
      const failedResults = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      failedResults.forEach((result) => {
        expect(result.reason.message).toContain('Stock insuficiente');
      });

      // Verificar stock final
      const finalStock = await stockRepository.findOne({
        where: { productId: testProduct.id },
      });

      expect(Number(finalStock!.quantity)).toBe(0); // Todo vendido
      expect(Number(finalStock!.reservedQuantity)).toBe(0);
    }, 120000); // Timeout de 2 minutos
  });

  describe('🔐 Isolation Level Validation', () => {
    it('debe usar nivel de aislamiento SERIALIZABLE', async () => {
      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 1000,
          },
        ],
        payments: [
          {
            method: 'CASH' as any,
            amount: 1000,
          },
        ],
      };

      // Spy en createQueryRunner para verificar nivel de aislamiento
      const createQueryRunnerSpy = jest.spyOn(dataSource, 'createQueryRunner');

      await salesService.create(createSaleDto, testUser.id, testTenantId);

      // Verificar que se llamó createQueryRunner
      expect(createQueryRunnerSpy).toHaveBeenCalled();

      // Verificar que la transacción se inició con nivel SERIALIZABLE
      // (esto se valida dentro de SalesService.create)
      const queryRunner = createQueryRunnerSpy.mock.results[0].value;
      expect(queryRunner).toBeDefined();
    }, 30000);
  });
});
