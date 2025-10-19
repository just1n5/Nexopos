import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para el Dashboard principal con los 5 widgets clave
 */
export class DashboardDataDto {
  @ApiProperty({
    description: 'Widget 1: Ventas del mes',
    example: {
      total: 15450000,
      trend: 12.5,
      comparedTo: 'Mes anterior'
    }
  })
  sales: {
    total: number;
    trend: number; // Porcentaje (+12.5 o -5.3)
    comparedTo: string;
  };

  @ApiProperty({
    description: 'Widget 2: Gastos del mes',
    example: {
      total: 9800000,
      breakdown: [
        { category: 'Inventario', percentage: 50, amount: 4900000 },
        { category: 'Arriendo', percentage: 20, amount: 1960000 },
        { category: 'Servicios', percentage: 10, amount: 980000 },
        { category: 'Otros', percentage: 20, amount: 1960000 }
      ]
    }
  })
  expenses: {
    total: number;
    breakdown: Array<{
      category: string;
      percentage: number;
      amount: number;
    }>;
  };

  @ApiProperty({
    description: 'Widget 3: Ganancia neta (antes de impuestos)',
    example: {
      value: 2150000,
      type: 'positive'
    }
  })
  netProfit: {
    value: number;
    type: 'positive' | 'negative';
  };

  @ApiProperty({
    description: 'Widget 4: Dinero disponible',
    example: {
      cash: 1200000,
      bank: 7500000,
      total: 8700000
    }
  })
  availableMoney: {
    cash: number;
    bank: number;
    total: number;
  };

  @ApiProperty({
    description: 'Widget 5: Provisión para impuestos (LA PREGUNTA DEL MILLÓN)',
    example: {
      total: 1850000,
      breakdown: {
        iva: 1600000,
        withholdings: 250000
      }
    }
  })
  taxProvision: {
    total: number;
    breakdown: {
      iva: number;
      withholdings: number;
    };
  };

  @ApiProperty({
    description: 'Período del reporte',
    example: {
      month: 1,
      year: 2024,
      monthName: 'Enero'
    }
  })
  period: {
    month: number;
    year: number;
    monthName: string;
  };
}

/**
 * DTO para el Reporte de IVA
 */
export class IVAReportDto {
  @ApiProperty({
    description: 'Período del reporte',
    example: {
      startDate: '2024-01-01',
      endDate: '2024-02-29',
      description: 'Enero - Febrero 2024'
    }
  })
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };

  @ApiProperty({
    description: 'IVA Generado (en ventas)',
    example: {
      totalSales: 50000000,
      general19: 8000000,
      reduced5: 500000,
      exempt: 0,
      totalIVA: 8500000
    }
  })
  ivaGenerado: {
    totalSales: number;
    general19: number;
    reduced5: number;
    exempt: number;
    totalIVA: number;
  };

  @ApiProperty({
    description: 'IVA Descontable (en compras/gastos)',
    example: {
      totalPurchases: 30000000,
      purchasesIVA: 4000000,
      expensesIVA: 1500000,
      totalIVA: 5500000
    }
  })
  ivaDescontable: {
    totalPurchases: number;
    purchasesIVA: number;
    expensesIVA: number;
    totalIVA: number;
  };

  @ApiProperty({
    description: 'Saldo de IVA',
    example: {
      type: 'a_pagar',
      value: 3000000
    }
  })
  balance: {
    type: 'a_pagar' | 'a_favor';
    value: number;
  };
}

/**
 * DTO para Estado de Resultados (P&L)
 */
export class ProfitAndLossDto {
  @ApiProperty()
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };

  @ApiProperty({
    description: 'Ingresos operacionales',
    example: {
      sales: 50000000,
      otherIncome: 500000,
      total: 50500000
    }
  })
  income: {
    sales: number;
    otherIncome: number;
    total: number;
  };

  @ApiProperty({
    description: 'Costo de ventas',
    example: 30000000
  })
  costOfSales: number;

  @ApiProperty({
    description: 'Utilidad bruta',
    example: 20500000
  })
  grossProfit: number;

  @ApiProperty({
    description: 'Gastos operacionales',
    example: {
      personnel: 5000000,
      rent: 2000000,
      services: 1000000,
      other: 2000000,
      total: 10000000
    }
  })
  operatingExpenses: {
    personnel: number;
    rent: number;
    services: number;
    other: number;
    total: number;
  };

  @ApiProperty({
    description: 'Utilidad operacional',
    example: 10500000
  })
  operatingProfit: number;

  @ApiProperty({
    description: 'Utilidad neta',
    example: 10000000
  })
  netProfit: number;
}

/**
 * DTO para Balance General
 */
export class BalanceSheetDto {
  @ApiProperty()
  date: string;

  @ApiProperty({
    description: 'Activos',
    example: {
      current: {
        cash: 1200000,
        bank: 7500000,
        accounts_receivable: 3000000,
        inventory: 15000000,
        total: 26700000
      },
      total: 26700000
    }
  })
  assets: {
    current: {
      cash: number;
      bank: number;
      accounts_receivable: number;
      inventory: number;
      total: number;
    };
    total: number;
  };

  @ApiProperty({
    description: 'Pasivos',
    example: {
      current: {
        accounts_payable: 5000000,
        taxes_payable: 2000000,
        total: 7000000
      },
      total: 7000000
    }
  })
  liabilities: {
    current: {
      accounts_payable: number;
      taxes_payable: number;
      total: number;
    };
    total: number;
  };

  @ApiProperty({
    description: 'Patrimonio',
    example: {
      capital: 10000000,
      retained_earnings: 5000000,
      current_profit: 4700000,
      total: 19700000
    }
  })
  equity: {
    capital: number;
    retained_earnings: number;
    current_profit: number;
    total: number;
  };
}

/**
 * DTO para Gastos por Categoría
 */
export class ExpensesByCategoryDto {
  @ApiProperty()
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };

  @ApiProperty({
    description: 'Gastos agrupados por categoría',
    example: [
      { category: 'Inventario', icon: '🛒', amount: 4900000, percentage: 50 },
      { category: 'Arriendo', icon: '🏢', amount: 1960000, percentage: 20 },
      { category: 'Servicios', icon: '💡', amount: 980000, percentage: 10 }
    ]
  })
  categories: Array<{
    category: string;
    icon: string;
    amount: number;
    percentage: number;
    count: number;
  }>;

  @ApiProperty()
  total: number;
}
