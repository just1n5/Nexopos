import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/**
 * Servicio para exportación de reportes contables a Excel
 *
 * Responsabilidades:
 * - Generar archivos Excel de reportes fiscales
 * - Formatear datos según normativas DIAN
 * - Aplicar estilos y formato profesional
 * - Generar reportes listos para presentar a contador/DIAN
 */
@Injectable()
export class ExcelExportService {
  /**
   * ========================================
   * REPORTE DE IVA
   * ========================================
   */

  /**
   * Exportar reporte de IVA en formato Excel
   * Diseñado para facilitar la declaración del Formulario 300 DIAN
   */
  async exportIVAReport(report: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte IVA');

    // Configurar propiedades del documento
    workbook.creator = 'NexoPOS';
    workbook.lastModifiedBy = 'NexoPOS';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Configurar columnas
    worksheet.columns = [
      { header: 'A', key: 'col1', width: 5 },
      { header: 'B', key: 'col2', width: 40 },
      { header: 'C', key: 'col3', width: 20 },
      { header: 'D', key: 'col4', width: 20 }
    ];

    let currentRow = 1;

    // ========== ENCABEZADO ==========
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(2).value = 'DECLARACIÓN DE IVA';
    titleRow.getCell(2).font = { size: 16, bold: true, color: { argb: 'FF1F4788' } };
    titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
    titleRow.height = 30;
    currentRow += 2;

    // Información del período
    const periodRow = worksheet.getRow(currentRow);
    periodRow.getCell(2).value = 'Período:';
    periodRow.getCell(2).font = { bold: true };
    periodRow.getCell(3).value = report.period.description;
    periodRow.getCell(3).alignment = { horizontal: 'left' };
    currentRow += 1;

    const dateRangeRow = worksheet.getRow(currentRow);
    dateRangeRow.getCell(2).value = 'Desde - Hasta:';
    dateRangeRow.getCell(2).font = { bold: true };
    dateRangeRow.getCell(3).value = `${report.period.startDate} - ${report.period.endDate}`;
    currentRow += 2;

    // ========== SECCIÓN 1: IVA GENERADO (VENTAS) ==========
    this.addSectionHeader(worksheet, currentRow, 'IVA GENERADO (VENTAS)');
    currentRow += 1;

    // Headers de tabla
    const salesHeaderRow = worksheet.getRow(currentRow);
    salesHeaderRow.getCell(2).value = 'Concepto';
    salesHeaderRow.getCell(3).value = 'Base Gravable';
    salesHeaderRow.getCell(4).value = 'IVA';
    this.styleHeaderRow(salesHeaderRow);
    currentRow += 1;

    // Desglose por tarifa
    if (report.sales?.byTaxRate && report.sales.byTaxRate.length > 0) {
      for (const taxRate of report.sales.byTaxRate) {
        const row = worksheet.getRow(currentRow);
        row.getCell(2).value = `Ventas Tarifa ${taxRate.rate}%`;
        row.getCell(3).value = taxRate.baseGravable;
        row.getCell(3).numFmt = '"$"#,##0.00';
        row.getCell(4).value = taxRate.ivaAmount;
        row.getCell(4).numFmt = '"$"#,##0.00';
        currentRow += 1;
      }
    }

    // Ventas excluidas de IVA
    if (report.sales?.salesExcludedFromIva > 0) {
      const excludedRow = worksheet.getRow(currentRow);
      excludedRow.getCell(2).value = 'Ventas Excluidas de IVA';
      excludedRow.getCell(3).value = report.sales.salesExcludedFromIva;
      excludedRow.getCell(3).numFmt = '"$"#,##0.00';
      excludedRow.getCell(4).value = 0;
      excludedRow.getCell(4).numFmt = '"$"#,##0.00';
      currentRow += 1;
    }

    // Total ventas
    const totalSalesRow = worksheet.getRow(currentRow);
    totalSalesRow.getCell(2).value = 'TOTAL VENTAS';
    totalSalesRow.getCell(2).font = { bold: true };
    totalSalesRow.getCell(3).value = report.sales?.totalSales || 0;
    totalSalesRow.getCell(3).numFmt = '"$"#,##0.00';
    totalSalesRow.getCell(3).font = { bold: true };
    totalSalesRow.getCell(4).value = report.summary.ivaGenerado;
    totalSalesRow.getCell(4).numFmt = '"$"#,##0.00';
    totalSalesRow.getCell(4).font = { bold: true };
    totalSalesRow.getCell(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    currentRow += 2;

    // ========== SECCIÓN 2: IVA DESCONTABLE (COMPRAS) ==========
    this.addSectionHeader(worksheet, currentRow, 'IVA DESCONTABLE (COMPRAS Y GASTOS)');
    currentRow += 1;

    const purchasesHeaderRow = worksheet.getRow(currentRow);
    purchasesHeaderRow.getCell(2).value = 'Concepto';
    purchasesHeaderRow.getCell(3).value = 'Base Gravable';
    purchasesHeaderRow.getCell(4).value = 'IVA';
    this.styleHeaderRow(purchasesHeaderRow);
    currentRow += 1;

    // Compras
    const purchasesRow = worksheet.getRow(currentRow);
    purchasesRow.getCell(2).value = 'Compras de Inventario';
    purchasesRow.getCell(3).value = report.purchases?.baseGravable || 0;
    purchasesRow.getCell(3).numFmt = '"$"#,##0.00';
    purchasesRow.getCell(4).value = report.summary.ivaDescontable;
    purchasesRow.getCell(4).numFmt = '"$"#,##0.00';
    currentRow += 1;

    // Total IVA descontable
    const totalPurchasesRow = worksheet.getRow(currentRow);
    totalPurchasesRow.getCell(2).value = 'TOTAL IVA DESCONTABLE';
    totalPurchasesRow.getCell(2).font = { bold: true };
    totalPurchasesRow.getCell(3).value = report.purchases?.totalPurchases || 0;
    totalPurchasesRow.getCell(3).numFmt = '"$"#,##0.00';
    totalPurchasesRow.getCell(3).font = { bold: true };
    totalPurchasesRow.getCell(4).value = report.summary.ivaDescontable;
    totalPurchasesRow.getCell(4).numFmt = '"$"#,##0.00';
    totalPurchasesRow.getCell(4).font = { bold: true };
    totalPurchasesRow.getCell(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    currentRow += 2;

    // ========== SECCIÓN 3: LIQUIDACIÓN ==========
    this.addSectionHeader(worksheet, currentRow, 'LIQUIDACIÓN DEL IVA');
    currentRow += 1;

    // IVA Generado
    const ivaGeneradoRow = worksheet.getRow(currentRow);
    ivaGeneradoRow.getCell(2).value = 'IVA Generado (Ventas)';
    ivaGeneradoRow.getCell(4).value = report.summary.ivaGenerado;
    ivaGeneradoRow.getCell(4).numFmt = '"$"#,##0.00';
    currentRow += 1;

    // Menos: IVA Descontable
    const ivaDescontableRow = worksheet.getRow(currentRow);
    ivaDescontableRow.getCell(2).value = 'Menos: IVA Descontable (Compras)';
    ivaDescontableRow.getCell(4).value = -report.summary.ivaDescontable;
    ivaDescontableRow.getCell(4).numFmt = '"$"#,##0.00';
    currentRow += 1;

    // Saldo
    const saldoRow = worksheet.getRow(currentRow);
    const saldoLabel = report.summary.tipo === 'a_pagar' ? 'SALDO A PAGAR' : 'SALDO A FAVOR';
    saldoRow.getCell(2).value = saldoLabel;
    saldoRow.getCell(2).font = { bold: true, size: 12 };
    saldoRow.getCell(4).value = report.summary.saldo;
    saldoRow.getCell(4).numFmt = '"$"#,##0.00';
    saldoRow.getCell(4).font = { bold: true, size: 12 };
    saldoRow.getCell(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: report.summary.tipo === 'a_pagar' ? 'FFFFCCCC' : 'FFCCFFCC' }
    };
    saldoRow.height = 25;
    currentRow += 3;

    // ========== NOTAS IMPORTANTES ==========
    this.addSectionHeader(worksheet, currentRow, 'NOTAS IMPORTANTES');
    currentRow += 1;

    const notes = [
      '1. Este reporte es una herramienta de apoyo. Verifique con su contador antes de presentar a la DIAN.',
      '2. El IVA descontable debe corresponder a gastos y compras relacionados con la actividad gravada.',
      '3. Conserve las facturas y soportes durante 5 años según normativa DIAN.',
      '4. Si el saldo es A FAVOR, puede compensarlo en declaraciones futuras.',
      '5. La declaración debe presentarse en las fechas establecidas según el último dígito del NIT.'
    ];

    for (const note of notes) {
      const noteRow = worksheet.getRow(currentRow);
      noteRow.getCell(2).value = note;
      noteRow.getCell(2).font = { size: 9, italic: true };
      noteRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
      worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
      noteRow.height = 20;
      currentRow += 1;
    }

    // Footer
    currentRow += 2;
    const footerRow = worksheet.getRow(currentRow);
    footerRow.getCell(2).value = `Generado por NexoPOS - ${new Date().toLocaleString('es-CO')}`;
    footerRow.getCell(2).font = { size: 8, italic: true, color: { argb: 'FF808080' } };
    footerRow.getCell(2).alignment = { horizontal: 'center' };
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * ========================================
   * REPORTE DE PÉRDIDAS Y GANANCIAS (P&L)
   * ========================================
   */

  /**
   * Exportar Estado de Resultados (P&L) a Excel
   */
  async exportProfitAndLossReport(report: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estado de Resultados');

    // Configurar propiedades
    workbook.creator = 'NexoPOS';
    workbook.created = new Date();

    // Configurar columnas
    worksheet.columns = [
      { header: 'A', key: 'col1', width: 5 },
      { header: 'B', key: 'col2', width: 50 },
      { header: 'C', key: 'col3', width: 20 }
    ];

    let currentRow = 1;

    // ========== ENCABEZADO ==========
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(2).value = 'ESTADO DE RESULTADOS (P&L)';
    titleRow.getCell(2).font = { size: 16, bold: true, color: { argb: 'FF1F4788' } };
    titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    titleRow.height = 30;
    currentRow += 2;

    // Período
    const periodRow = worksheet.getRow(currentRow);
    periodRow.getCell(2).value = 'Período:';
    periodRow.getCell(2).font = { bold: true };
    periodRow.getCell(3).value = `${report.period.startDate} - ${report.period.endDate}`;
    currentRow += 2;

    // ========== INGRESOS ==========
    this.addSectionHeader(worksheet, currentRow, 'INGRESOS', 'B', 'C');
    currentRow += 1;

    // Ventas
    const salesRow = worksheet.getRow(currentRow);
    salesRow.getCell(2).value = 'Ventas';
    salesRow.getCell(3).value = report.revenue.sales;
    salesRow.getCell(3).numFmt = '"$"#,##0.00';
    currentRow += 1;

    // Otros ingresos
    if (report.revenue.otherIncome > 0) {
      const otherIncomeRow = worksheet.getRow(currentRow);
      otherIncomeRow.getCell(2).value = 'Otros Ingresos';
      otherIncomeRow.getCell(3).value = report.revenue.otherIncome;
      otherIncomeRow.getCell(3).numFmt = '"$"#,##0.00';
      currentRow += 1;
    }

    // Total ingresos
    const totalRevenueRow = worksheet.getRow(currentRow);
    totalRevenueRow.getCell(2).value = 'Total Ingresos';
    totalRevenueRow.getCell(2).font = { bold: true };
    totalRevenueRow.getCell(3).value = report.revenue.total;
    totalRevenueRow.getCell(3).numFmt = '"$"#,##0.00';
    totalRevenueRow.getCell(3).font = { bold: true };
    totalRevenueRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    currentRow += 2;

    // ========== COSTOS ==========
    this.addSectionHeader(worksheet, currentRow, 'COSTOS', 'B', 'C');
    currentRow += 1;

    const costsRow = worksheet.getRow(currentRow);
    costsRow.getCell(2).value = 'Costo de Ventas';
    costsRow.getCell(3).value = -report.costs.costOfGoodsSold;
    costsRow.getCell(3).numFmt = '"$"#,##0.00';
    currentRow += 1;

    // Utilidad bruta
    const grossProfitRow = worksheet.getRow(currentRow);
    grossProfitRow.getCell(2).value = 'UTILIDAD BRUTA';
    grossProfitRow.getCell(2).font = { bold: true };
    grossProfitRow.getCell(3).value = report.grossProfit;
    grossProfitRow.getCell(3).numFmt = '"$"#,##0.00';
    grossProfitRow.getCell(3).font = { bold: true };
    grossProfitRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEAA7' }
    };
    currentRow += 2;

    // ========== GASTOS ==========
    this.addSectionHeader(worksheet, currentRow, 'GASTOS OPERACIONALES', 'B', 'C');
    currentRow += 1;

    // Desglose de gastos por categoría
    if (report.expenses?.byCategory && report.expenses.byCategory.length > 0) {
      for (const category of report.expenses.byCategory) {
        const expenseRow = worksheet.getRow(currentRow);
        expenseRow.getCell(2).value = `  ${category.category}`;
        expenseRow.getCell(3).value = -category.amount;
        expenseRow.getCell(3).numFmt = '"$"#,##0.00';
        currentRow += 1;
      }
    }

    // Total gastos
    const totalExpensesRow = worksheet.getRow(currentRow);
    totalExpensesRow.getCell(2).value = 'Total Gastos';
    totalExpensesRow.getCell(2).font = { bold: true };
    totalExpensesRow.getCell(3).value = -report.expenses.total;
    totalExpensesRow.getCell(3).numFmt = '"$"#,##0.00';
    totalExpensesRow.getCell(3).font = { bold: true };
    totalExpensesRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    currentRow += 2;

    // ========== RESULTADO ==========
    const netProfitRow = worksheet.getRow(currentRow);
    const netProfitLabel = report.netProfit >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA';
    netProfitRow.getCell(2).value = netProfitLabel;
    netProfitRow.getCell(2).font = { bold: true, size: 12 };
    netProfitRow.getCell(3).value = report.netProfit;
    netProfitRow.getCell(3).numFmt = '"$"#,##0.00';
    netProfitRow.getCell(3).font = { bold: true, size: 12 };
    netProfitRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: report.netProfit >= 0 ? 'FFCCFFCC' : 'FFFFCCCC' }
    };
    netProfitRow.height = 25;
    currentRow += 3;

    // ========== MÉTRICAS ==========
    this.addSectionHeader(worksheet, currentRow, 'MÉTRICAS FINANCIERAS', 'B', 'C');
    currentRow += 1;

    const metrics = [
      { label: 'Margen Bruto', value: report.metrics.grossMargin, format: '0.00"%"' },
      { label: 'Margen Neto', value: report.metrics.netMargin, format: '0.00"%"' },
      { label: 'Gastos / Ingresos', value: report.metrics.expenseRatio, format: '0.00"%"' }
    ];

    for (const metric of metrics) {
      const metricRow = worksheet.getRow(currentRow);
      metricRow.getCell(2).value = metric.label;
      metricRow.getCell(3).value = metric.value / 100;
      metricRow.getCell(3).numFmt = metric.format;
      currentRow += 1;
    }

    // Footer
    currentRow += 2;
    const footerRow = worksheet.getRow(currentRow);
    footerRow.getCell(2).value = `Generado por NexoPOS - ${new Date().toLocaleString('es-CO')}`;
    footerRow.getCell(2).font = { size: 8, italic: true, color: { argb: 'FF808080' } };
    footerRow.getCell(2).alignment = { horizontal: 'center' };
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * ========================================
   * EXPORTAR BALANCE GENERAL
   * ========================================
   *
   * Genera el Balance General en formato Excel
   * Ecuación contable: Activos = Pasivos + Patrimonio
   */
  async exportBalanceSheet(report: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Balance General');

    // Metadatos
    workbook.creator = 'NexoPOS';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Configurar columnas
    worksheet.columns = [
      { header: 'A', key: 'col1', width: 5 },
      { header: 'B', key: 'col2', width: 40 },
      { header: 'C', key: 'col3', width: 20 }
    ];

    let currentRow = 1;

    // ========== ENCABEZADO ==========
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell('B').value = 'BALANCE GENERAL';
    titleRow.getCell('B').font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
    titleRow.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;
    currentRow += 2;

    // Fecha del balance
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell('B').value = `Al ${report.date}`;
    dateRow.getCell('B').font = { bold: true, size: 11 };
    dateRow.getCell('B').alignment = { horizontal: 'center' };
    currentRow += 2;

    // ========== ACTIVOS ==========
    this.addSectionHeader(worksheet, currentRow, '💰 ACTIVOS', 'B', 'C');
    currentRow++;

    // Activos corrientes
    currentRow++;
    const activosItems = [
      { label: 'Caja', value: report.assets.current.cash },
      { label: 'Bancos', value: report.assets.current.bank },
      { label: 'Cuentas por Cobrar', value: report.assets.current.accounts_receivable },
      { label: 'Inventarios', value: report.assets.current.inventory }
    ];

    activosItems.forEach(item => {
      const row = worksheet.getRow(currentRow);
      row.getCell('B').value = item.label;
      row.getCell('C').value = item.value;
      row.getCell('C').numFmt = '"$"#,##0.00';
      row.getCell('C').alignment = { horizontal: 'right' };
      currentRow++;
    });

    // Total activos
    currentRow++;
    const totalActivosRow = worksheet.getRow(currentRow);
    totalActivosRow.getCell('B').value = 'TOTAL ACTIVOS';
    totalActivosRow.getCell('B').font = { bold: true, size: 11 };
    totalActivosRow.getCell('C').value = report.assets.total;
    totalActivosRow.getCell('C').numFmt = '"$"#,##0.00';
    totalActivosRow.getCell('C').font = { bold: true, size: 11 };
    totalActivosRow.getCell('C').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    totalActivosRow.getCell('C').alignment = { horizontal: 'right' };
    currentRow += 2;

    // ========== PASIVOS ==========
    this.addSectionHeader(worksheet, currentRow, '📋 PASIVOS', 'B', 'C');
    currentRow++;

    // Pasivos corrientes
    currentRow++;
    const pasivosItems = [
      { label: 'Cuentas por Pagar', value: report.liabilities.current.accounts_payable },
      { label: 'Impuestos por Pagar', value: report.liabilities.current.taxes_payable }
    ];

    pasivosItems.forEach(item => {
      const row = worksheet.getRow(currentRow);
      row.getCell('B').value = item.label;
      row.getCell('C').value = item.value;
      row.getCell('C').numFmt = '"$"#,##0.00';
      row.getCell('C').alignment = { horizontal: 'right' };
      currentRow++;
    });

    // Total pasivos
    currentRow++;
    const totalPasivosRow = worksheet.getRow(currentRow);
    totalPasivosRow.getCell('B').value = 'TOTAL PASIVOS';
    totalPasivosRow.getCell('B').font = { bold: true, size: 11 };
    totalPasivosRow.getCell('C').value = report.liabilities.total;
    totalPasivosRow.getCell('C').numFmt = '"$"#,##0.00';
    totalPasivosRow.getCell('C').font = { bold: true, size: 11 };
    totalPasivosRow.getCell('C').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    totalPasivosRow.getCell('C').alignment = { horizontal: 'right' };
    currentRow += 2;

    // ========== PATRIMONIO ==========
    this.addSectionHeader(worksheet, currentRow, '🏦 PATRIMONIO', 'B', 'C');
    currentRow++;

    currentRow++;
    const patrimonioItems = [
      { label: 'Capital', value: report.equity.capital },
      { label: 'Utilidades Retenidas', value: report.equity.retained_earnings },
      { label: 'Utilidad del Ejercicio', value: report.equity.current_profit }
    ];

    patrimonioItems.forEach(item => {
      const row = worksheet.getRow(currentRow);
      row.getCell('B').value = item.label;
      row.getCell('C').value = item.value;
      row.getCell('C').numFmt = '"$"#,##0.00';
      row.getCell('C').alignment = { horizontal: 'right' };
      currentRow++;
    });

    // Total patrimonio
    currentRow++;
    const totalPatrimonioRow = worksheet.getRow(currentRow);
    totalPatrimonioRow.getCell('B').value = 'TOTAL PATRIMONIO';
    totalPatrimonioRow.getCell('B').font = { bold: true, size: 11 };
    totalPatrimonioRow.getCell('C').value = report.equity.total;
    totalPatrimonioRow.getCell('C').numFmt = '"$"#,##0.00';
    totalPatrimonioRow.getCell('C').font = { bold: true, size: 11 };
    totalPatrimonioRow.getCell('C').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    totalPatrimonioRow.getCell('C').alignment = { horizontal: 'right' };
    currentRow += 2;

    // ========== ECUACIÓN CONTABLE ==========
    currentRow++;
    const ecuacionRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    ecuacionRow.getCell('B').value = 'ECUACIÓN CONTABLE: Activos = Pasivos + Patrimonio';
    ecuacionRow.getCell('B').font = { bold: true, italic: true, size: 10, color: { argb: 'FF1F4E78' } };
    ecuacionRow.getCell('B').alignment = { horizontal: 'center' };
    ecuacionRow.getCell('B').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    currentRow += 2;

    // Validación
    const pasivosPatrimonio = report.liabilities.total + report.equity.total;
    const balanceado = Math.abs(report.assets.total - pasivosPatrimonio) < 1;

    const validacionRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    validacionRow.getCell('B').value = balanceado
      ? '✅ Balance Cuadrado: Los activos igualan a pasivos + patrimonio'
      : '⚠️ Advertencia: El balance no cuadra. Verificar asientos contables.';
    validacionRow.getCell('B').font = {
      bold: true,
      size: 10,
      color: { argb: balanceado ? 'FF00B050' : 'FFFF0000' }
    };
    validacionRow.getCell('B').alignment = { horizontal: 'center' };
    currentRow += 2;

    // Footer
    const footerRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    footerRow.getCell('B').value = `Generado por NexoPOS - ${new Date().toLocaleString('es-CO')}`;
    footerRow.getCell('B').font = { size: 8, italic: true, color: { argb: 'FF808080' } };
    footerRow.getCell('B').alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * ========================================
   * UTILIDADES DE FORMATO
   * ========================================
   */

  private addSectionHeader(
    worksheet: ExcelJS.Worksheet,
    row: number,
    title: string,
    startCol: string = 'B',
    endCol: string = 'D'
  ): void {
    const sectionRow = worksheet.getRow(row);
    sectionRow.getCell(startCol).value = title;
    sectionRow.getCell(startCol).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    sectionRow.getCell(startCol).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    sectionRow.getCell(startCol).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(`${startCol}${row}:${endCol}${row}`);
    sectionRow.height = 22;
  }

  private styleHeaderRow(row: ExcelJS.Row): void {
    ['B', 'C', 'D'].forEach(col => {
      const cell = row.getCell(col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    row.height = 20;
  }
}
