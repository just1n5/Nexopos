import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomersService } from '../customers/customers.service';
import { JournalEntryService } from '../accounting/services/journal-entry.service';
import { CreateSaleDto } from './dto/create-sale.dto';

describe('SalesService - Concurrency Tests', () => {
  let service: SalesService;
  let dataSource: DataSource;
  let inventoryService: InventoryService;

  // Mock de producto con stock
  const mockProductId = 'test-product-123';
  const mockTenantId = 'test-tenant-123';
  const mockUserId = 'test-user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: 'SaleRepository',
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'SaleItemRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'PaymentRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              isTransactionActive: true,
              manager: {
                createQueryBuilder: jest.fn(),
                create: jest.fn(),
                save: jest.fn(),
              },
            })),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            getStock: jest.fn(),
            adjustStock: jest.fn(),
          },
        },
        {
          provide: CashRegisterService,
          useValue: {
            registerSalePayment: jest.fn(),
            getCurrentSession: jest.fn(),
          },
        },
        {
          provide: CustomersService,
          useValue: {
            findOne: jest.fn(),
            addCredit: jest.fn(),
          },
        },
        {
          provide: JournalEntryService,
          useValue: {
            createSaleEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    dataSource = module.get<DataSource>(DataSource);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('Race Condition Prevention', () => {
    it('🔒 debe prevenir overselling con ventas concurrentes del mismo producto', async () => {
      // ESCENARIO: 2 cajeros intentan vender 8 unidades simultáneamente
      // Stock disponible: 10 unidades
      // Resultado esperado: Solo UNA venta debe tener éxito

      const initialStock = 10;
      const quantityPerSale = 8;

      // Configurar mock del stock con bloqueo
      let stockLocked = false;
      let currentStock = initialStock;

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn((isolationLevel) => {
          expect(isolationLevel).toBe('SERIALIZABLE');
        }),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        isTransactionActive: true,
        manager: {
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            setLock: jest.fn((lockType) => {
              expect(lockType).toBe('pessimistic_write');

              // Simular comportamiento de bloqueo pesimista
              if (stockLocked) {
                // Segunda transacción debe ESPERAR
                return new Promise((resolve) => {
                  setTimeout(() => {
                    resolve({
                      getRawOne: jest.fn(() => ({
                        stock_id: '1',
                        stock_quantity: currentStock,
                      })),
                    });
                  }, 100);
                });
              } else {
                stockLocked = true;
                return {
                  getRawOne: jest.fn(() => {
                    if (currentStock < quantityPerSale) {
                      return null; // Stock insuficiente
                    }
                    return {
                      stock_id: '1',
                      stock_quantity: currentStock,
                    };
                  }),
                };
              }
            }),
            getRawOne: jest.fn(() => ({
              stock_id: '1',
              stock_quantity: currentStock,
            })),
            update: jest.fn().mockReturnThis(),
            set: jest.fn((values) => {
              // Actualizar stock simulado
              currentStock = values.quantity;
              return {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn(() => {
                  stockLocked = false; // Liberar bloqueo
                  return Promise.resolve();
                }),
              };
            }),
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn(),
          })),
          create: jest.fn((entity, data) => data),
          save: jest.fn((entity) => Promise.resolve(entity)),
        },
      };

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Mock de ProductsService
      jest.spyOn(service as any, 'getProductInfo').mockResolvedValue({
        id: mockProductId,
        name: 'Producto Test',
        sku: 'TEST-001',
        stock: initialStock,
        costPrice: 100,
        taxRate: 19,
        taxCode: 'IVA',
      });

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: mockProductId,
            quantity: quantityPerSale,
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
      const sale1Promise = service.create(createSaleDto, mockUserId, mockTenantId);
      const sale2Promise = service.create(createSaleDto, mockUserId, mockTenantId);

      const results = await Promise.allSettled([sale1Promise, sale2Promise]);

      // VALIDACIONES
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      // Solo UNA venta debe tener éxito
      expect(successCount).toBe(1);
      expect(failedCount).toBe(1);

      // Stock final debe ser 2 (10 - 8)
      expect(currentStock).toBe(2);

      // La venta fallida debe tener error de stock insuficiente
      const failedResult = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      if (failedResult) {
        expect(failedResult.reason.message).toContain('Stock insuficiente');
      }
    });

    it('🔒 debe hacer rollback completo si falla la actualización de inventario', async () => {
      let transactionRolledBack = false;

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(() => {
          transactionRolledBack = true;
        }),
        release: jest.fn(),
        isTransactionActive: true,
        manager: {
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(() => ({
              stock_id: '1',
              stock_quantity: 100,
            })),
            update: jest.fn().mockReturnThis(),
            set: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              execute: jest.fn(() => {
                // Simular error en actualización de inventario
                throw new Error('Database connection lost');
              }),
            })),
          })),
          create: jest.fn((entity, data) => data),
          save: jest.fn((entity) => Promise.resolve(entity)),
        },
      };

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      jest.spyOn(service as any, 'getProductInfo').mockResolvedValue({
        id: mockProductId,
        name: 'Producto Test',
        sku: 'TEST-001',
        stock: 100,
        costPrice: 100,
        taxRate: 19,
        taxCode: 'IVA',
      });

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: mockProductId,
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

      // La venta debe FALLAR
      await expect(service.create(createSaleDto, mockUserId, mockTenantId)).rejects.toThrow();

      // El rollback debe haberse ejecutado
      expect(transactionRolledBack).toBe(true);

      // El commit NO debe haberse ejecutado
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Atomicity', () => {
    it('✅ debe confirmar venta, inventario y caja en una sola transacción', async () => {
      const operations: string[] = [];

      const mockQueryRunner = {
        connect: jest.fn(() => operations.push('connect')),
        startTransaction: jest.fn(() => operations.push('startTransaction')),
        commitTransaction: jest.fn(() => operations.push('commit')),
        rollbackTransaction: jest.fn(() => operations.push('rollback')),
        release: jest.fn(() => operations.push('release')),
        isTransactionActive: true,
        manager: {
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(() => ({
              stock_id: '1',
              stock_quantity: 100,
              cr_id: 'cash-register-123',
              cr_sessionNumber: 'CR-001',
              cr_openingBalance: 1000,
            })),
            update: jest.fn(() => ({
              set: jest.fn(() => ({
                where: jest.fn(() => ({
                  execute: jest.fn(() => {
                    operations.push('updateInventory');
                    return Promise.resolve();
                  }),
                })),
              })),
            })),
            insert: jest.fn(() => ({
              into: jest.fn(() => ({
                values: jest.fn(() => ({
                  execute: jest.fn((table) => {
                    if (table === 'inventory_movements') {
                      operations.push('createInventoryMovement');
                    } else if (table === 'cash_movements') {
                      operations.push('createCashMovement');
                    }
                    return Promise.resolve();
                  }),
                })),
              })),
            })),
          })),
          create: jest.fn((entity, data) => {
            operations.push(`create${entity.name}`);
            return data;
          }),
          save: jest.fn((entity) => {
            operations.push(`save${entity.constructor.name}`);
            return Promise.resolve(entity);
          }),
        },
      };

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      jest.spyOn(service as any, 'getProductInfo').mockResolvedValue({
        id: mockProductId,
        name: 'Producto Test',
        sku: 'TEST-001',
        stock: 100,
        costPrice: 100,
        taxRate: 19,
        taxCode: 'IVA',
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({} as any);

      const createSaleDto: CreateSaleDto = {
        items: [
          {
            productId: mockProductId,
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

      await service.create(createSaleDto, mockUserId, mockTenantId);

      // VALIDAR ORDEN DE OPERACIONES
      expect(operations).toContain('startTransaction');
      expect(operations).toContain('updateInventory');
      expect(operations).toContain('createInventoryMovement');
      expect(operations).toContain('createCashMovement');
      expect(operations).toContain('commit');

      // El commit debe ser DESPUÉS de todas las operaciones
      const commitIndex = operations.indexOf('commit');
      const inventoryIndex = operations.indexOf('updateInventory');
      const cashIndex = operations.indexOf('createCashMovement');

      expect(commitIndex).toBeGreaterThan(inventoryIndex);
      expect(commitIndex).toBeGreaterThan(cashIndex);

      // NO debe haber rollback
      expect(operations).not.toContain('rollback');
    });
  });
});
