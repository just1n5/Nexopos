import React, { useState, useEffect } from 'react';
import { Save, Building2, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAuthStore } from '@/stores/authStore';
import { TaxRegime, IVAResponsibility } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Formulario de Configuración Fiscal
 *
 * Captura la información fiscal del negocio:
 * - Datos de la empresa (NIT, nombre, dirección)
 * - Régimen tributario
 * - Resoluciones de facturación DIAN
 * - Responsabilidades tributarias
 */

export const FiscalConfigForm: React.FC = () => {
  const { token } = useAuthStore();
  const { fiscalConfig, fiscalConfigLoading, loadFiscalConfig, saveFiscalConfig } = useAccountingStore();

  const [formData, setFormData] = useState({
    businessName: '',
    nit: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    taxRegime: TaxRegime.SIMPLIFIED,
    ivaResponsibility: IVAResponsibility.NON_RESPONSIBLE,
    retentionAgent: false,
    enableElectronicInvoicing: false,
    resolutionNumber: '',
    resolutionDate: '',
    prefixInvoice: '',
    fromInvoice: '',
    toInvoice: '',
    validUntil: '',
    technicalKey: '',
    testSetId: '',
    economicActivity: '',
    ciiu: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadFiscalConfig(token);
    }
  }, [loadFiscalConfig, token]);

  useEffect(() => {
    if (fiscalConfig) {
      setFormData({
        businessName: fiscalConfig.businessName || '',
        nit: fiscalConfig.nit || '',
        address: fiscalConfig.address || '',
        city: fiscalConfig.city || '',
        phone: fiscalConfig.phone || '',
        email: fiscalConfig.email || '',
        taxRegime: fiscalConfig.taxRegime || TaxRegime.SIMPLIFIED,
        ivaResponsibility: fiscalConfig.ivaResponsibility || IVAResponsibility.NON_RESPONSIBLE,
        retentionAgent: fiscalConfig.retentionAgent || false,
        enableElectronicInvoicing: fiscalConfig.enableElectronicInvoicing || false,
        resolutionNumber: fiscalConfig.resolutionNumber || '',
        resolutionDate: typeof fiscalConfig.resolutionDate === 'string' ? fiscalConfig.resolutionDate : '',
        prefixInvoice: fiscalConfig.prefixInvoice || '',
        fromInvoice: fiscalConfig.fromInvoice?.toString() || '',
        toInvoice: fiscalConfig.toInvoice?.toString() || '',
        validUntil: typeof fiscalConfig.validUntil === 'string' ? fiscalConfig.validUntil : '',
        technicalKey: fiscalConfig.technicalKey || '',
        testSetId: fiscalConfig.testSetId || '',
        economicActivity: fiscalConfig.economicActivity || '',
        ciiu: fiscalConfig.ciiu || '',
      });
    }
  }, [fiscalConfig]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!token) {
      setSaveError('No estás autenticado.');
      return;
    }

    try {
      await saveFiscalConfig(token, {
        ...formData,
        fromInvoice: formData.fromInvoice ? parseInt(formData.fromInvoice) : undefined,
        toInvoice: formData.toInvoice ? parseInt(formData.toInvoice) : undefined,
      } as any);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.message || 'Error al guardar la configuración');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {fiscalConfigLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 dark:text-green-200">
                Configuración guardada exitosamente
              </p>
            </div>
          )}

          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-200">{saveError}</p>
            </div>
          )}

          {/* Datos de la Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Datos de la Empresa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="businessName" className="mb-2 block">
                  Razón Social *
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Nombre completo de la empresa"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="nit" className="mb-2 block">
                  NIT *
                </Label>
                <Input
                  id="nit"
                  type="text"
                  value={formData.nit}
                  onChange={(e) => handleInputChange('nit', e.target.value)}
                  placeholder="900123456-7"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="economicActivity" className="mb-2 block">
                  Actividad Económica (CIIU)
                </Label>
                <Input
                  id="economicActivity"
                  type="text"
                  value={formData.economicActivity}
                  onChange={(e) => handleInputChange('economicActivity', e.target.value)}
                  placeholder="4711 - Comercio al por menor"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address" className="mb-2 block">
                  Dirección *
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Calle 123 #45-67"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="city" className="mb-2 block">
                  Ciudad *
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Bogotá"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="mb-2 block">
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="601 234 5678"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="email" className="mb-2 block">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="empresa@ejemplo.com"
                  required
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Régimen Tributario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Régimen Tributario
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Régimen Tributario *</Label>
                <RadioGroup
                  value={formData.taxRegime}
                  onValueChange={(value) => handleInputChange('taxRegime', value)}
                  className="space-y-2"
                >
                  <Label className="flex items-center gap-2 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <RadioGroupItem value={TaxRegime.SIMPLIFIED} id="simplified" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Régimen Simplificado
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Para pequeños comerciantes
                      </div>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-2 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <RadioGroupItem value={TaxRegime.COMMON} id="common" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Régimen Común
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Para empresas que facturan con IVA
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="retentionAgent"
                    checked={formData.retentionAgent}
                    onCheckedChange={(checked) => handleInputChange('retentionAgent', checked)}
                  />
                  <Label htmlFor="retentionAgent" className="text-sm font-medium text-gray-900 dark:text-white">
                    Agente de Retención
                  </Label>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enableElectronicInvoicing"
                    checked={formData.enableElectronicInvoicing}
                    onCheckedChange={(checked) => handleInputChange('enableElectronicInvoicing', checked)}
                  />
                  <Label htmlFor="enableElectronicInvoicing" className="text-sm font-medium text-gray-900 dark:text-white">
                    Facturación Electrónica Habilitada
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Resolución DIAN */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Resolución de Facturación DIAN
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Información de la resolución para facturación electrónica
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resolutionNumber" className="mb-2 block">
                  Número de Resolución
                </Label>
                <Input
                  id="resolutionNumber"
                  type="text"
                  value={formData.resolutionNumber}
                  onChange={(e) => handleInputChange('resolutionNumber', e.target.value)}
                  placeholder="18764123456789"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="resolutionDate" className="mb-2 block">
                  Fecha de Resolución
                </Label>
                <Input
                  id="resolutionDate"
                  type="date"
                  value={formData.resolutionDate}
                  onChange={(e) => handleInputChange('resolutionDate', e.target.value)}
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="prefixInvoice" className="mb-2 block">
                  Prefijo
                </Label>
                <Input
                  id="prefixInvoice"
                  type="text"
                  value={formData.prefixInvoice}
                  onChange={(e) => handleInputChange('prefixInvoice', e.target.value)}
                  placeholder="SETP"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="validUntil" className="mb-2 block">
                  Válida Hasta
                </Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="fromInvoice" className="mb-2 block">
                  Numeración Desde
                </Label>
                <Input
                  id="fromInvoice"
                  type="number"
                  value={formData.fromInvoice}
                  onChange={(e) => handleInputChange('fromInvoice', e.target.value)}
                  placeholder="1"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="toInvoice" className="mb-2 block">
                  Numeración Hasta
                </Label>
                <Input
                  id="toInvoice"
                  type="number"
                  value={formData.toInvoice}
                  onChange={(e) => handleInputChange('toInvoice', e.target.value)}
                  placeholder="5000"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="technicalKey" className="mb-2 block">
                  Clave Técnica (CUFE)
                </Label>
                <Input
                  id="technicalKey"
                  type="text"
                  value={formData.technicalKey}
                  onChange={(e) => handleInputChange('technicalKey', e.target.value)}
                  placeholder="Clave técnica proporcionada por la DIAN"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="testSetId" className="mb-2 block">
                  ID Set de Pruebas
                </Label>
                <Input
                  id="testSetId"
                  type="text"
                  value={formData.testSetId}
                  onChange={(e) => handleInputChange('testSetId', e.target.value)}
                  placeholder="ID del set de pruebas (ambiente de habilitación)"
                  className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={fiscalConfigLoading}
              variant="primary"
              className="transition-all hover:shadow-nexo-glow-primary gap-2"
            >
              {fiscalConfigLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              ℹ️ Información Importante
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Esta configuración es necesaria para la facturación electrónica</li>
              <li>Los datos de la resolución DIAN deben coincidir exactamente con los autorizados</li>
              <li>Consulta con tu contador si tienes dudas sobre el régimen tributario</li>
              <li>Mantén actualizada esta información para cumplir con las normas fiscales</li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
};
