import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, RefreshCw, AlertCircle, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatStock } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useToast } from '@/hooks/useToast';
import { productsService, inventoryService, MovementType } from '@/services';
import { canWriteInventory } from '@/lib/permissions';
import AddProductModal, { NewProductData } from '@/components/AddProductModal';
import TableSkeleton from '@/components/skeletons/TableSkeleton';

const LOW_STOCK_THRESHOLD = 10;

type ApiProductVariant = {
  id: string;
  name: string;
  sku: string;
  priceDelta: number | string;
  stock: number;
  size?: string;
  color?: string;
};

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  basePrice: number | string;
  unitCost?: number | string;
  costPerGram?: number;
  imageUrl?: string;
  status: string;
  saleType: string;
  pricePerGram?: number;
  stock?: number;
  variants?: ApiProductVariant[];
  createdAt: string;
  updatedAt: string;
};

type InventoryRow = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost: number;
  costPerGram?: number;
  imageUrl?: string;
  status: string;
  saleType: string;
  pricePerGram?: number;
  totalStock: number;
  variants: ApiProductVariant[];
  updatedAt: Date;
};

type NewProductFormState = {
  name: string;
  description: string;
  sku: string;
  basePrice: string;
  unitCost?: string;
  costPerGram?: string;
  stock: string;
  saleType: 'unit' | 'weight';
  pricePerGram?: string;
  variants: [];
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  ACTIVE: { label: 'Activo', variant: 'default' },
  INACTIVE: { label: 'Inactivo', variant: 'secondary' },
  ARCHIVED: { label: 'Archivado', variant: 'outline' },
};

const toSafeInteger = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(parsed, 0);
};

const parseDecimalInput = (value: string): number => {
  if (!value) return 0;
  const normalizedValue = value.replace(',', '.');
  const parsed = parseFloat(normalizedValue);
  if (isNaN(parsed)) return 0;
  return parsed;
};

const cleanDescription = (description?: string): string | undefined => {
  if (!description) return undefined;
  let cleaned = description.replace(/\(Stock:\s*[\d.,]+\)/gi, '').trim();
  cleaned = cleaned.replace(/Stock:\s*[\d.,]+/gi, '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

export default function InventoryView() {
  const { token, user, logout } = useAuthStore();
  const weightUnit = useBusinessStore((state) => state.config.weightUnit);
  const { toast } = useToast();

  // Verificar permisos de escritura
  const hasWritePermission = user ? canWriteInventory(user.role) : false;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  // const [showImportModal, setShowImportModal] = useState(false);

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<InventoryRow | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: '',
    reason: '',
    type: 'add' as 'add' | 'subtract'
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<InventoryRow | null>(null);
  const [editForm, setEditForm] = useState<NewProductFormState>({
    name: '',
    description: '',
    sku: '',
    basePrice: '',
    stock: '',
    saleType: 'unit',
    pricePerGram: '',
    variants: []
  });

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/products', {
        method: 'GET',
        token,
        skipContentType: true,
      });

      if (response.status === 401) {
        setError('Tu sesión expiró. Inicia sesión nuevamente.');
        logout();
        setProducts([]);
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudo cargar el inventario.');
      }

      const payload: ApiProduct[] = await response.json();
      const mapped = payload.map<InventoryRow>((item) => {
        const variants = Array.isArray(item.variants) ? item.variants : [];
        const totalStock = Number(item.stock ?? 0);
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          price: Number(item.basePrice ?? 0),
          cost: Number(item.unitCost ?? 0),
          costPerGram: item.costPerGram,
          imageUrl: item.imageUrl,
          status: item.status,
          saleType: item.saleType,
          pricePerGram: item.pricePerGram,
          totalStock,
          variants,
          updatedAt: new Date(item.updatedAt ?? item.createdAt ?? Date.now()),
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Hubo un problema al cargar el inventario. Por favor, intenta de nuevo.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async (productData: NewProductData) => {
    if (!token) {
      toast({ title: 'Error', description: 'Tu sesión expiró. Inicia sesión nuevamente.', variant: 'destructive' });
      throw new Error('Sin token de autenticación');
    }

    const trimmedName = productData.name.trim();
    const basePriceValue = Number.parseFloat(productData.basePrice);
    const stockValue = toSafeInteger(productData.stock);

    // Determinar SKU y barcode según lo que se proporcionó
    const sku = productData.sku?.trim() || productData.barcode?.trim() || '';
    const barcode = productData.barcode?.trim();

    const variantsPayload = [{
      name: trimmedName,
      sku,
      stock: stockValue,
      barcode: barcode || undefined
    }];

    const productPayload: any = {
      name: trimmedName,
      description: productData.description.trim() || undefined,
      sku,
      basePrice: basePriceValue,
      saleType: productData.saleType.toUpperCase(),
      tax: productData.tax ? Number.parseFloat(productData.tax) : 19,
      variants: variantsPayload
    };

    if (barcode) {
      productPayload.barcode = barcode;
    }

    // Agregar costo y precio según tipo de venta
    if (productData.saleType === 'weight') {
      if (productData.pricePerGram) {
        productPayload.pricePerGram = Number.parseFloat(productData.pricePerGram);
      }
      if (productData.costPerGram) {
        productPayload.costPerGram = Number.parseFloat(productData.costPerGram);
      }
      if (productData.weightUnit) {
        productPayload.weightUnit = productData.weightUnit;
      }
    } else {
      // Producto por unidad
      if (productData.unitCost) {
        productPayload.unitCost = Number.parseFloat(productData.unitCost);
      }
    }

    await productsService.createProduct(productPayload, token);

    toast({ title: 'Producto agregado', description: 'El producto se ha agregado exitosamente.' });

    setShowAddModal(false);
    await fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold dark:text-gray-100">Inventario</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddModal(true)}
                disabled={!hasWritePermission}
                title={!hasWritePermission ? 'No tienes permisos para agregar productos' : undefined}
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Producto
              </Button>
              <Button onClick={fetchProducts} variant="outline">
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Administra tu inventario de productos</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, SKU o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={8} columns={7} />
            ) : filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos en el inventario'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Producto</th>
                      <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">SKU</th>
                      <th className="text-right p-2 font-medium text-gray-700 dark:text-gray-300">Costo</th>
                      <th className="text-right p-2 font-medium text-gray-700 dark:text-gray-300">Precio</th>
                      <th className="text-right p-2 font-medium text-gray-700 dark:text-gray-300">Margen</th>
                      <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Stock Total</th>
                      <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Estado</th>
                      <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Última Actualización</th>
                      <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isLowStock = product.totalStock > 0 && product.totalStock <= LOW_STOCK_THRESHOLD;
                      const isOutOfStock = product.totalStock === 0;

                      // Calcular margen de ganancia
                      const cost = product.saleType === 'WEIGHT'
                        ? (product.costPerGram || 0) * 453.592  // Convertir a costo por libra
                        : product.cost;
                      const price = product.saleType === 'WEIGHT'
                        ? (product.pricePerGram || 0) * 453.592
                        : product.price;

                      const marginAmount = price - cost;
                      const marginPercent = cost > 0 ? (marginAmount / cost) * 100 : 0;

                      return (
                        <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="p-2">
                            <div>
                              <p className="font-medium dark:text-gray-100">{product.name}</p>
                              {cleanDescription(product.description) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cleanDescription(product.description)}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-gray-600 dark:text-gray-400">{product.sku}</td>
                          <td className="p-2 text-right text-gray-600 dark:text-gray-400">
                            {product.saleType === 'WEIGHT'
                              ? `${formatCurrency(cost)}/lb`
                              : formatCurrency(cost)}
                          </td>
                          <td className="p-2 text-right font-medium dark:text-gray-200">
                            {product.saleType === 'WEIGHT'
                              ? `${formatCurrency(price)}/lb`
                              : formatCurrency(price)}
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-medium ${marginPercent >= 30 ? 'text-green-600 dark:text-green-400' : marginPercent >= 15 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatCurrency(marginAmount)}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {isOutOfStock ? (
                              <Badge variant="destructive">{`${formatStock(product.totalStock, product.saleType, weightUnit)}`} (Agotado)</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                {`${formatStock(product.totalStock, product.saleType, weightUnit)}`} (Bajo)
                              </Badge>
                            ) : (
                              <Badge variant="default">{`${formatStock(product.totalStock, product.saleType, weightUnit)}`}</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={statusLabels[product.status]?.variant || 'default'}>
                              {statusLabels[product.status]?.label || product.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                            {product.updatedAt.toLocaleDateString('es-CO')}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!hasWritePermission}
                                title={!hasWritePermission ? 'No tienes permisos para editar productos' : undefined}
                                onClick={() => {
                                  setSelectedProductForEdit(product);
                                  setEditForm({
                                    name: product.name,
                                    description: product.description || '',
                                    sku: product.sku,
                                    basePrice: product.price.toString(),
                                    stock: product.totalStock.toString(),
                                    saleType: product.saleType as 'unit' | 'weight',
                                    pricePerGram: product.pricePerGram?.toString() || '',
                                    variants: []
                                  });
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!hasWritePermission}
                                title={!hasWritePermission ? 'No tienes permisos para ajustar stock' : undefined}
                                onClick={() => {
                                  setSelectedProductForStock(product);
                                  setShowStockModal(true);
                                  setStockAdjustment({ quantity: '', reason: '', type: 'add' });
                                }}
                              >
                                Ajustar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {showAddModal && (
          <AddProductModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddProduct}
          />
        )}

        {showStockModal && selectedProductForStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Ajustar Stock</h2>
                  <Button size="sm" variant="ghost" onClick={() => { setShowStockModal(false); setSelectedProductForStock(null); }}><X className="w-5 h-5" /></Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{selectedProductForStock.name}</p>
                    <p className="text-sm text-gray-500">SKU: {selectedProductForStock.sku}</p>
                    <p className="text-sm text-gray-500">
                      Stock actual: {formatStock(selectedProductForStock.totalStock, selectedProductForStock.saleType, weightUnit)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de ajuste</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={stockAdjustment.type === 'add' ? 'default' : 'outline'} onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'add' })} className="w-full"><Plus className="w-4 h-4 mr-2" />Agregar</Button>
                      <Button variant={stockAdjustment.type === 'subtract' ? 'default' : 'outline'} onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'subtract' })} className="w-full"><X className="w-4 h-4 mr-2" />Restar</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cantidad {selectedProductForStock.saleType === 'WEIGHT' ? `(en ${weightUnit === 'pounds' ? 'libras' : 'gramos'})` : '(unidades)'}
                    </label>
                    <Input
                      type="number"
                      value={stockAdjustment.quantity}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                      placeholder={selectedProductForStock.saleType === 'WEIGHT'
                        ? `Ingrese ${weightUnit === 'pounds' ? 'las libras' : 'los gramos'}`
                        : 'Ingrese la cantidad de unidades'
                      }
                      min="1"
                      step={selectedProductForStock.saleType === 'WEIGHT' ? '0.001' : '1'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Razón del ajuste</label>
                    <Input value={stockAdjustment.reason} onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })} placeholder="Ej: Inventario físico, pérdida, daño" />
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={async () => { if (!stockAdjustment.quantity || !stockAdjustment.reason) { toast({ title: 'Error', description: 'Por favor complete todos los campos', variant: 'destructive' }); return; } const quantity = parseDecimalInput(stockAdjustment.quantity); if (isNaN(quantity) || quantity <= 0) { toast({ title: 'Error', description: 'Ingrese una cantidad válida y mayor a cero.', variant: 'destructive' }); return; } const finalQuantity = stockAdjustment.type === 'subtract' ? -quantity : quantity; if (stockAdjustment.type === 'subtract' && selectedProductForStock.totalStock < quantity) { toast({ title: 'Error', description: 'No hay suficiente stock para realizar esta operación', variant: 'destructive' }); return; } try { await inventoryService.adjustStock({ productId: selectedProductForStock.id, variantId: selectedProductForStock.variants && selectedProductForStock.variants.length > 0 ? selectedProductForStock.variants[0].id : undefined, quantity: finalQuantity, movementType: MovementType.ADJUSTMENT, reason: stockAdjustment.reason, notes: `Ajuste manual: ${stockAdjustment.reason}` }, token!); const unitLabel = selectedProductForStock.saleType === 'WEIGHT'
                          ? (weightUnit === 'pounds' ? 'libras' : 'gramos')
                          : 'unidades';
                        toast({ title: 'Stock actualizado', description: `El stock se ha ${stockAdjustment.type === 'add' ? 'aumentado' : 'reducido'} en ${quantity} ${unitLabel}` }); setShowStockModal(false); setSelectedProductForStock(null); await fetchProducts(); } catch (error) { console.error('Error ajustando stock:', error); toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo ajustar el stock', variant: 'destructive' }); } }} className="flex-1">Confirmar Ajuste</Button>
                    <Button variant="outline" onClick={() => { setShowStockModal(false); setSelectedProductForStock(null); }}>Cancelar</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedProductForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-card text-card-foreground rounded-lg max-w-2xl w-full my-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Editar Producto</h2>
                  <Button size="sm" variant="ghost" onClick={() => { setShowEditModal(false); setSelectedProductForEdit(null); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Nombre del producto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SKU</label>
                      <Input
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        placeholder="Código único del producto"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Descripción del producto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de venta</label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={editForm.saleType}
                        onChange={(e) => setEditForm({ ...editForm, saleType: e.target.value as 'unit' | 'weight' })}
                      >
                        <option value="unit">Por unidad</option>
                        <option value="weight">Por peso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {editForm.saleType === 'weight' ? 'Precio por gramo' : 'Precio base'}
                      </label>
                      <Input
                        type="number"
                        value={editForm.saleType === 'weight' ? editForm.pricePerGram : editForm.basePrice}
                        onChange={(e) => {
                          if (editForm.saleType === 'weight') {
                            setEditForm({ ...editForm, pricePerGram: e.target.value });
                          } else {
                            setEditForm({ ...editForm, basePrice: e.target.value });
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={async () => {
                        if (!editForm.name || !editForm.sku) {
                          toast({ title: 'Error', description: 'Complete los campos obligatorios', variant: 'destructive' });
                          return;
                        }

                        try {
                          const updatePayload: any = {
                            name: editForm.name,
                            description: cleanDescription(editForm.description) || undefined,
                            sku: editForm.sku,
                            saleType: editForm.saleType.toUpperCase()
                          };

                          if (editForm.saleType === 'weight') {
                            const pricePerGram = parseDecimalInput(editForm.pricePerGram || '0');
                            if (pricePerGram <= 0) {
                              toast({ title: 'Error', description: 'El precio por gramo debe ser mayor a cero', variant: 'destructive' });
                              return;
                            }
                            updatePayload.pricePerGram = pricePerGram;
                          } else {
                            const basePrice = parseDecimalInput(editForm.basePrice);
                            if (basePrice <= 0) {
                              toast({ title: 'Error', description: 'El precio debe ser mayor a cero', variant: 'destructive' });
                              return;
                            }
                            updatePayload.basePrice = basePrice;
                          }

                          await productsService.updateProduct(selectedProductForEdit.id, updatePayload, token!);

                          toast({ title: 'Producto actualizado', description: 'Los cambios se han guardado correctamente' });
                          setShowEditModal(false);
                          setSelectedProductForEdit(null);
                          await fetchProducts();
                        } catch (error) {
                          console.error('Error actualizando producto:', error);
                          toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo actualizar el producto', variant: 'destructive' });
                        }
                      }}
                      className="flex-1"
                    >
                      Guardar Cambios
                    </Button>
                    <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedProductForEdit(null); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}