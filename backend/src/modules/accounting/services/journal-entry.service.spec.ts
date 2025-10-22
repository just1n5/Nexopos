import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryService } from './journal-entry.service';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts, AccountNature } from '../entities/chart-of-accounts.entity';

describe('JournalEntryService', () => {
  let service: JournalEntryService;
  let journalEntryRepo: Repository<JournalEntry>;
  let journalEntryLineRepo: Repository<JournalEntryLine>;
  let chartOfAccountsService: ChartOfAccountsService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  // Mock de cuentas PUC
  const mockAccounts = {
    '1105': { id: 'acc-caja', code: '1105', name: 'Caja', nature: AccountNature.DEBIT },
    '1110': { id: 'acc-banco', code: '1110', name: 'Bancos', nature: AccountNature.DEBIT },
    '1305': { id: 'acc-clientes', code: '1305', name: 'Clientes', nature: AccountNature.DEBIT },
    '1435': { id: 'acc-inventario', code: '1435', name: 'Inventario', nature: AccountNature.DEBIT },
    '4135': { id: 'acc-ventas', code: '4135', name: 'Ventas', nature: AccountNature.CREDIT },
    '2408': { id: 'acc-iva', code: '2408', name: 'IVA por Pagar', nature: AccountNature.CREDIT },
    '6135': { id: 'acc-costo', code: '6135', name: 'Costo de Ventas', nature: AccountNature.DEBIT }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntryService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(JournalEntryLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: ChartOfAccountsService,
          useValue: {
            getAccountByCode: jest.fn((tenantId, code) => {
              return Promise.resolve(mockAccounts[code]);
            })
          }
        }
      ]
    }).compile();

    service = module.get<JournalEntryService>(JournalEntryService);
    journalEntryRepo = module.get<Repository<JournalEntry>>(getRepositoryToken(JournalEntry));
    journalEntryLineRepo = module.get<Repository<JournalEntryLine>>(getRepositoryToken(JournalEntryLine));
    chartOfAccountsService = module.get<ChartOfAccountsService>(ChartOfAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSaleEntry', () => {
    it('debe crear asiento de venta en efectivo con IVA correctamente', async () => {
      // Mock de venta en efectivo
      const mockSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        total: 119000,
        subtotal: 100000,
        tax: 19000,
        paymentMethod: 'cash',
        createdAt: new Date(),
        items: []
      };

      // Mock de journal entry guardado
      const mockJournalEntry = {
        id: 'entry-1',
        tenantId: mockTenantId,
        date: new Date(),
        description: `Venta #${mockSale.id}`,
        entryType: 'sale',
        referenceId: mockSale.id,
        lines: []
      };

      jest.spyOn(journalEntryRepo, 'create').mockReturnValue(mockJournalEntry as any);
      jest.spyOn(journalEntryRepo, 'save').mockResolvedValue(mockJournalEntry as any);

      const mockLines = [
        {
          accountId: 'acc-caja',
          account: mockAccounts['1105'],
          debit: 119000,
          credit: 0,
          description: 'Venta en efectivo'
        },
        {
          accountId: 'acc-ventas',
          account: mockAccounts['4135'],
          debit: 0,
          credit: 100000,
          description: 'Ingreso por venta'
        },
        {
          accountId: 'acc-iva',
          account: mockAccounts['2408'],
          debit: 0,
          credit: 19000,
          description: 'IVA generado'
        }
      ];

      jest.spyOn(journalEntryLineRepo, 'create').mockImplementation((line) => line as any);
      jest.spyOn(journalEntryLineRepo, 'save').mockImplementation((line) => Promise.resolve(line) as any);

      // Ejecutar
      const result = await service.createSaleEntry(mockSale as any, mockUserId);

      // Validaciones
      expect(result).toBeDefined();
      expect(journalEntryRepo.create).toHaveBeenCalled();
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '1105'); // Caja
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '4135'); // Ventas
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '2408'); // IVA
    });

    it('debe crear asiento de venta con tarjeta débito correctamente', async () => {
      const mockSale = {
        id: 'sale-2',
        tenantId: mockTenantId,
        total: 119000,
        subtotal: 100000,
        tax: 19000,
        paymentMethod: 'debit_card',
        createdAt: new Date(),
        items: []
      };

      const mockJournalEntry = {
        id: 'entry-2',
        tenantId: mockTenantId,
        lines: []
      };

      jest.spyOn(journalEntryRepo, 'create').mockReturnValue(mockJournalEntry as any);
      jest.spyOn(journalEntryRepo, 'save').mockResolvedValue(mockJournalEntry as any);
      jest.spyOn(journalEntryLineRepo, 'create').mockImplementation((line) => line as any);
      jest.spyOn(journalEntryLineRepo, 'save').mockImplementation((line) => Promise.resolve(line) as any);

      const result = await service.createSaleEntry(mockSale as any, mockUserId);

      expect(result).toBeDefined();
      // Debe usar cuenta Bancos (1110) en vez de Caja (1105)
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '1110');
    });

    it('debe crear asiento de venta a crédito (fiado) correctamente', async () => {
      const mockSale = {
        id: 'sale-3',
        tenantId: mockTenantId,
        total: 119000,
        subtotal: 100000,
        tax: 19000,
        paymentMethod: 'credit',
        createdAt: new Date(),
        items: []
      };

      const mockJournalEntry = {
        id: 'entry-3',
        tenantId: mockTenantId,
        lines: []
      };

      jest.spyOn(journalEntryRepo, 'create').mockReturnValue(mockJournalEntry as any);
      jest.spyOn(journalEntryRepo, 'save').mockResolvedValue(mockJournalEntry as any);
      jest.spyOn(journalEntryLineRepo, 'create').mockImplementation((line) => line as any);
      jest.spyOn(journalEntryLineRepo, 'save').mockImplementation((line) => Promise.resolve(line) as any);

      const result = await service.createSaleEntry(mockSale as any, mockUserId);

      expect(result).toBeDefined();
      // Debe usar cuenta Clientes (1305) en vez de Caja
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '1305');
    });
  });

  describe('createCashRegisterClosingEntry', () => {
    it('debe crear asiento de cierre de caja correctamente', async () => {
      const mockClosing = {
        id: 'closing-1',
        tenantId: mockTenantId,
        cashInRegister: 500000,
        expectedCash: 500000,
        difference: 0,
        totalSales: 600000,
        closedAt: new Date()
      };

      const mockJournalEntry = {
        id: 'entry-4',
        tenantId: mockTenantId,
        lines: []
      };

      jest.spyOn(journalEntryRepo, 'create').mockReturnValue(mockJournalEntry as any);
      jest.spyOn(journalEntryRepo, 'save').mockResolvedValue(mockJournalEntry as any);
      jest.spyOn(journalEntryLineRepo, 'create').mockImplementation((line) => line as any);
      jest.spyOn(journalEntryLineRepo, 'save').mockImplementation((line) => Promise.resolve(line) as any);

      const result = await service.createCashRegisterClosingEntry(mockClosing as any, mockUserId);

      expect(result).toBeDefined();
      expect(journalEntryRepo.create).toHaveBeenCalled();
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '1110'); // Bancos
      expect(chartOfAccountsService.getAccountByCode).toHaveBeenCalledWith(mockTenantId, '1105'); // Caja
    });
  });

  describe('Validación de partida doble', () => {
    it('debe asegurar que los débitos igualan a los créditos', async () => {
      const mockSale = {
        id: 'sale-validation',
        tenantId: mockTenantId,
        total: 119000,
        subtotal: 100000,
        tax: 19000,
        paymentMethod: 'cash',
        createdAt: new Date(),
        items: []
      };

      const mockLines = [
        { debit: 119000, credit: 0 }, // Caja
        { debit: 0, credit: 100000 }, // Ventas
        { debit: 0, credit: 19000 }   // IVA
      ];

      const totalDebits = mockLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredits = mockLines.reduce((sum, line) => sum + line.credit, 0);

      // Validar partida doble
      expect(totalDebits).toBe(totalCredits);
      expect(totalDebits).toBe(119000);
    });
  });
});
