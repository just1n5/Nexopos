import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { Sale, SaleType } from '../sales/entities/sale.entity';
import { PaymentMethod } from '../sales/entities/payment.entity';
import { InventoryStock, StockStatus } from '../inventory/entities/inventory-stock.entity';

interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
}

interface ReportFile {
  content: string;
  mimeType: string;
  filename: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getSalesReport(filters: ReportFilters) {
    const sales = await this.salesService.findAll({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    // VENTAS TOTALES = Todo lo facturado (incluye crédito)
    const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalSalesCount = sales.length;

    // INGRESOS = Solo ventas REGULAR (excluye crédito, porque no entra a caja aún)
    const regularSales = sales.filter((sale) => sale.type === SaleType.REGULAR);
    const totalIncome = regularSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    // VENTAS A CRÉDITO
    const creditSalesData = sales.filter((sale) => sale.type === SaleType.CREDIT);
    const totalCreditSales = creditSalesData.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const creditSalesCount = creditSalesData.length;

    // CRÉDITOS PENDIENTES (saldo por recuperar)
    const creditPending = creditSalesData.reduce(
      (sum, sale) => sum + Math.max(0, Number(sale.creditAmount || 0)),
      0
    );

    // TICKET PROMEDIO (sobre ventas completadas, no créditos)
    const averageTicket = totalSalesCount ? totalSalesAmount / totalSalesCount : 0;

    // VENTAS POR MÉTODO DE PAGO
    const salesByPaymentMethod: Record<string, number> = {};
    sales.forEach((sale) => {
      sale.payments?.forEach((payment) => {
        const methodKey = this.normalizePaymentMethod(payment.method);
        salesByPaymentMethod[methodKey] = (salesByPaymentMethod[methodKey] || 0) + Number(payment.amount || 0);
      });
    });

    // VENTAS POR HORA
    const salesByHour: Record<number, number> = {};
    sales.forEach((sale) => {
      const hour = new Date(sale.createdAt).getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + Number(sale.total || 0);
    });

    return {
      // Métricas principales
      totalSales: totalSalesCount,        // Cantidad de ventas
      totalSalesAmount,                    // Monto total facturado (incluye crédito)
      totalIncome,                         // Ingresos reales en caja (excluye crédito)
      totalCreditSales,                    // Monto vendido a crédito
      creditSalesCount,                    // Cantidad de ventas a crédito
      creditPending,                       // Saldo pendiente de cobro
      averageTicket,                       // Ticket promedio

      // Desglosados
      salesByPaymentMethod,
      salesByHour,

      // Legacy (deprecated, usar totalSalesAmount)
      totalRevenue: totalSalesAmount,
      creditSales: creditSalesCount,
    };
  }

  async getProductsReport(filters: ReportFilters) {
    const sales = await this.salesService.findAll({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    const productMap = new Map<string, {
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      revenue: number;
    }>();

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const current = productMap.get(item.productId) || {
          productId: item.productId,
          name: item.productName,
          sku: item.productSku,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.total || 0);

        productMap.set(item.productId, current);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((item) => ({
        product: {
          id: item.productId,
          name: item.name,
          sku: item.sku,
        },
        quantity: item.quantity,
        revenue: item.revenue,
      }));
  }

  async getCustomersReport(filters: ReportFilters) {
    const sales = await this.salesService.findAll({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    type CustomerAccumulator = {
      customerId: string;
      name: string;
      totalPurchases: number;
      totalSpent: number;
      lastPurchase?: Date;
    };

    const customerMap = new Map<string, CustomerAccumulator>();

    sales.forEach((sale) => {
      if (!sale.customer) {
        return;
      }

      const key = sale.customer.id;
      let current = customerMap.get(key);
      if (!current) {
        current = {
          customerId: key,
          name: sale.customer.fullName || `${sale.customer.firstName} ${sale.customer.lastName}`.trim(),
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: undefined,
        };
        customerMap.set(key, current);
      }

      current.totalPurchases += 1;
      current.totalSpent += Number(sale.total || 0);
      const createdAt = new Date(sale.createdAt);
      if (!current.lastPurchase || current.lastPurchase < createdAt) {
        current.lastPurchase = createdAt;
      }
    });

    return Array.from(customerMap.values())
      .map((item) => ({
        customerId: item.customerId,
        customerName: item.name,
        totalPurchases: item.totalPurchases,
        totalSpent: item.totalSpent,
        averagePurchase: item.totalPurchases ? item.totalSpent / item.totalPurchases : 0,
        lastPurchase: item.lastPurchase ?? new Date(),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async getInventoryReport() {
    const valuation = await this.inventoryService.getStockValuation();
    const lowStock = await this.inventoryService.getLowStockProducts();

    const lowStockProducts = lowStock
      .filter((stock) => stock.status === StockStatus.LOW_STOCK)
      .map((stock) => this.mapInventoryProduct(stock));

    const outOfStockProducts = lowStock
      .filter((stock) => stock.status === StockStatus.OUT_OF_STOCK)
      .map((stock) => this.mapInventoryProduct(stock));

    return {
      totalProducts: valuation.totalProducts,
      totalValue: valuation.totalValue,
      lowStockProducts,
      outOfStockProducts,
      mostSoldProducts: [],
      leastSoldProducts: [],
    };
  }

  async generateReportFile(
    type: 'sales' | 'products' | 'customers' | 'inventory',
    format: 'csv',
    filters: ReportFilters,
  ): Promise<ReportFile> {
    switch (type) {
      case 'sales': {
        const data = await this.getSalesReport(filters);
        const summaryRows = [
          { metric: 'totalSales', value: data.totalSales },
          { metric: 'totalRevenue', value: data.totalRevenue },
          { metric: 'averageTicket', value: data.averageTicket },
          { metric: 'creditSales', value: data.creditSales },
          { metric: 'creditPending', value: data.creditPending },
        ];
        const paymentRows = Object.entries(data.salesByPaymentMethod)
          .map(([method, amount]) => ({ method, amount }));
        const content = [
          this.toCsv(summaryRows, ['metric', 'value']),
          this.toCsv(paymentRows, ['method', 'amount']),
        ].join('\n\n');
        return { content, mimeType: 'text/csv', filename: 'sales-report.csv' };
      }
      case 'products': {
        const data = await this.getProductsReport(filters);
        const rows = data.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          revenue: item.revenue,
        }));
        return {
          content: this.toCsv(rows, ['id', 'name', 'sku', 'quantity', 'revenue']),
          mimeType: 'text/csv',
          filename: 'products-report.csv',
        };
      }
      case 'customers': {
        const data = await this.getCustomersReport(filters);
        const rows = data.map((item) => ({
          customerId: item.customerId,
          customerName: item.customerName,
          totalPurchases: item.totalPurchases,
          totalSpent: item.totalSpent,
          averagePurchase: item.averagePurchase,
        }));
        return {
          content: this.toCsv(rows, ['customerId', 'customerName', 'totalPurchases', 'totalSpent', 'averagePurchase']),
          mimeType: 'text/csv',
          filename: 'customers-report.csv',
        };
      }
      case 'inventory': {
        const data = await this.getInventoryReport();
        const rows = [...data.lowStockProducts, ...data.outOfStockProducts];
        return {
          content: this.toCsv(rows, ['id', 'name', 'sku', 'stock']),
          mimeType: 'text/csv',
          filename: 'inventory-report.csv',
        };
      }
      default:
        return { content: '', mimeType: 'text/csv', filename: 'report.csv' };
    }
  }

  private mapInventoryProduct(stock: InventoryStock) {
    return {
      id: stock.productId,
      name: (stock as any).productName || `Producto ${stock.productId.slice(0, 6)}`,
      sku: (stock as any).productSku || stock.productVariantId || stock.productId,
      stock: Number(stock.quantity || 0),
    };
  }

  private toCsv<T extends Record<string, any>>(rows: T[], headers: string[]): string {
    if (rows.length === 0) {
      return headers.join(',');
    }

    const headerLine = headers.join(',');
    const body = rows
      .map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))
      .join('\n');

    return `${headerLine}\n${body}`;
  }

  private normalizePaymentMethod(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH:
        return 'cash';
      case PaymentMethod.BANK_TRANSFER:
        return 'bank_transfer';
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return 'card';
      case PaymentMethod.NEQUI:
      case PaymentMethod.DAVIPLATA:
        return 'wallet';
      case PaymentMethod.CREDIT:
        return 'credit';
      default:
        return 'other';
    }
  }
}
