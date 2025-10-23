import { TrendingUp, TrendingDown, DollarSign, Landmark, AlertTriangle } from 'lucide-react';

interface SalesWidgetProps {
  total: number;
  trend: number;
  comparedTo: string;
}

/**
 * Widget 1: Ventas del Mes
 * Muestra el total de ventas y la tendencia comparada con el mes anterior
 */
export const SalesWidget: React.FC<SalesWidgetProps> = ({ total, trend, comparedTo }) => {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Ventas del Mes
        </h3>
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-4xl font-bold text-gray-900 dark:text-white">
          ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
            isPositive
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {comparedTo}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ExpensesWidgetProps {
  total: number;
  breakdown: Array<{
    category: string;
    percentage: number;
    amount: number;
  }>;
}

/**
 * Widget 2: Gastos del Mes
 * Muestra el total de gastos con desglose de las 3 categorías principales
 */
export const ExpensesWidget: React.FC<ExpensesWidgetProps> = ({ total, breakdown }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Gastos del Mes
        </h3>
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <TrendingDown className="w-6 h-6 text-destructive dark:text-destructive" />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-4xl font-bold text-gray-900 dark:text-white">
          ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>

        <div className="space-y-2">
          {breakdown.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.category}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 dark:bg-red-400 h-2 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface NetProfitWidgetProps {
  value: number;
  type: 'positive' | 'negative';
}

/**
 * Widget 3: Ganancia Neta
 * Muestra la utilidad del mes (ventas - gastos)
 */
export const NetProfitWidget: React.FC<NetProfitWidgetProps> = ({ value, type }) => {
  const isPositive = type === 'positive';

  return (
    <div className={`rounded-lg shadow-md p-6 ${
      isPositive
        ? 'bg-gradient-to-br from-green-500 to-green-600'
        : 'bg-gradient-to-br from-red-500 to-red-600'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Ganancia Neta
        </h3>
        <div className="p-2 bg-white/20 rounded-lg">
          {isPositive ? (
            <TrendingUp className="w-6 h-6 text-white" />
          ) : (
            <TrendingDown className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-4xl font-bold text-white">
          ${Math.abs(value).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>

        <p className="text-white/80 text-sm">
          {isPositive ? '¡Excelente mes!' : 'Gastos superan ingresos'}
        </p>
      </div>
    </div>
  );
};

interface AvailableMoneyWidgetProps {
  cash: number;
  bank: number;
  total: number;
}

/**
 * Widget 4: Dinero Disponible
 * Muestra el efectivo en caja y bancos
 */
export const AvailableMoneyWidget: React.FC<AvailableMoneyWidgetProps> = ({
  cash,
  bank,
  total
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Dinero Disponible
        </h3>
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total disponible</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Caja</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ${cash.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bancos</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ${bank.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TaxProvisionWidgetProps {
  total: number;
  breakdown: {
    iva: number;
    withholdings: number;
  };
}

/**
 * Widget 5: LA PREGUNTA DEL MILLÓN - Provisión de Impuestos
 * Muestra cuánto dinero debe apartar para impuestos
 */
export const TaxProvisionWidget: React.FC<TaxProvisionWidgetProps> = ({
  total,
  breakdown
}) => {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 border-4 border-orange-400">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Provisión de Impuestos
          </h3>
          <p className="text-xs text-white/80 mt-1">LA PREGUNTA DEL MILLÓN</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-4xl font-bold text-white">
            ${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-white/80 text-sm mt-1">
            Debes apartar este dinero para impuestos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-sm text-white/80">IVA a pagar</p>
            <p className="text-lg font-semibold text-white">
              ${breakdown.iva.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/80">Retenciones</p>
            <p className="text-lg font-semibold text-white">
              ${breakdown.withholdings.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard completo con los 5 widgets
 */
interface AccountingDashboardProps {
  dashboardData: {
    sales: SalesWidgetProps;
    expenses: ExpensesWidgetProps;
    netProfit: NetProfitWidgetProps;
    availableMoney: AvailableMoneyWidgetProps;
    taxProvision: TaxProvisionWidgetProps;
    period: {
      month: number;
      year: number;
      monthName: string;
    };
  };
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  dashboardData
}) => {
  return (
    <div className="space-y-6">
      {/* Encabezado con período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Contabilidad
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {dashboardData.period.monthName} {dashboardData.period.year}
          </p>
        </div>
      </div>

      {/* Grid de widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget 1: Ventas */}
        <SalesWidget {...dashboardData.sales} />

        {/* Widget 2: Gastos */}
        <ExpensesWidget {...dashboardData.expenses} />

        {/* Widget 3: Ganancia Neta */}
        <NetProfitWidget {...dashboardData.netProfit} />

        {/* Widget 4: Dinero Disponible */}
        <AvailableMoneyWidget {...dashboardData.availableMoney} />

        {/* Widget 5: Provisión de Impuestos - Ocupa 2 columnas */}
        <div className="md:col-span-2">
          <TaxProvisionWidget {...dashboardData.taxProvision} />
        </div>
      </div>
    </div>
  );
};
