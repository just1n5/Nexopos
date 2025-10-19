import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, FileText, Settings, Loader2, Plus } from 'lucide-react';
import { useAccountingStore } from '../stores/accountingStore';
import { AccountingDashboard } from '../components/accounting/DashboardWidgets';
import { ExpenseRegistration } from '../components/accounting/ExpenseRegistration';
import { ExpenseList } from '../components/accounting/ExpenseList';
import { IVAReportView } from '../components/accounting/IVAReportView';
import { ProfitLossView } from '../components/accounting/ProfitLossView';
import { BalanceSheetView } from '../components/accounting/BalanceSheetView';
import { FiscalConfigForm } from '../components/accounting/FiscalConfigForm';
import { Button } from '../components/ui/button';

/**
 * Vista Principal de Contabilidad
 *
 * Implementa el concepto de "Contabilidad Invisible"
 * El usuario nunca ve códigos PUC ni jerga contable
 *
 * Pestañas:
 * 1. Dashboard - Los 5 widgets clave
 * 2. Gastos - Registro y gestión de gastos
 * 3. Reportes - IVA, P&L, Balance
 * 4. Configuración - Setup fiscal
 */

type TabType = 'dashboard' | 'expenses' | 'reports' | 'config';
type ReportType = 'iva' | 'profit-loss' | 'balance';

const AccountingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    loadDashboard
  } = useAccountingStore();

  // Cargar dashboard al montar el componente
  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboardData) {
      const now = new Date();
      loadDashboard(now.getMonth() + 1, now.getFullYear());
    }
  }, [activeTab, dashboardData, loadDashboard]);

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Vista general del negocio'
    },
    {
      id: 'expenses' as TabType,
      label: 'Gastos',
      icon: Receipt,
      description: 'Registrar y gestionar gastos'
    },
    {
      id: 'reports' as TabType,
      label: 'Reportes',
      icon: FileText,
      description: 'IVA, P&L, Balance'
    },
    {
      id: 'config' as TabType,
      label: 'Configuración',
      icon: Settings,
      description: 'Datos fiscales del negocio'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Contabilidad
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión contable y fiscal automatizada
          </p>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                      transition-colors duration-200
                      ${isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : ''}`} />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* Tab: Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Cargando dashboard...
                  </span>
                </div>
              ) : dashboardError ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{dashboardError}</p>
                  <button
                    onClick={() => {
                      const now = new Date();
                      loadDashboard(now.getMonth() + 1, now.getFullYear());
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Reintentar
                  </button>
                </div>
              ) : dashboardData ? (
                <AccountingDashboard dashboardData={dashboardData} />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          )}

          {/* Tab: Gastos */}
          {activeTab === 'expenses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Gestión de Gastos
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Registra y gestiona los gastos de tu negocio
                  </p>
                </div>
                <Button
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Nuevo Gasto
                </Button>
              </div>

              <ExpenseList />
            </div>
          )}

          {/* Tab: Reportes */}
          {activeTab === 'reports' && (
            <div>
              {!selectedReport ? (
                <div>
                  <div className="text-center mb-8">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Reportes Fiscales
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Selecciona el reporte que deseas generar
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <button
                      onClick={() => setSelectedReport('iva')}
                      className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Reporte de IVA
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Para declaración DIAN
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedReport('profit-loss')}
                      className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      <div className="text-4xl mb-3">💰</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Estado de Resultados
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Ganancias y pérdidas
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedReport('balance')}
                      className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      <div className="text-4xl mb-3">⚖️</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Balance General
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Activos, Pasivos, Patrimonio
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Breadcrumb / Back button */}
                  <div className="mb-6">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      ← Volver a reportes
                    </button>
                  </div>

                  {/* Report Views */}
                  {selectedReport === 'iva' && <IVAReportView />}
                  {selectedReport === 'profit-loss' && <ProfitLossView />}
                  {selectedReport === 'balance' && <BalanceSheetView />}
                </div>
              )}
            </div>
          )}

          {/* Tab: Configuración */}
          {activeTab === 'config' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Configuración Fiscal
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Configura los datos fiscales de tu negocio para facturación electrónica
                </p>
              </div>
              <FiscalConfigForm />
            </div>
          )}
        </div>
      </div>

      {/* Expense Registration Modal */}
      <ExpenseRegistration
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => {
          setShowExpenseModal(false);
          // Reload dashboard if we're on that tab
          if (activeTab === 'dashboard') {
            const now = new Date();
            loadDashboard(now.getMonth() + 1, now.getFullYear());
          }
        }}
      />
    </div>
  );
};

export default AccountingView;
