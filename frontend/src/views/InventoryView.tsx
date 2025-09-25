import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, RefreshCw, AlertCircle, FileSpreadsheet, Download, X, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { productsService, inventoryService, MovementType } from '@/services';
import { useInventoryStore } from '@/stores/inventoryStore';

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
  status: string;
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
  status: string;
  totalStock: number;
  variants: ApiProductVariant[];
  updatedAt: Date;
};

type NewProductVariantForm = {
  size?: string;
  color?: string;
  stock: string;
  priceDelta: string;
};

type NewProductFormState = {
  name: string;
  description: string;
  sku: string;
  basePrice: string;
  stock: string;
  variants: NewProductVariantForm[];
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

const toSafeDecimal = (value: string): number => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

const stripDiacritics = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');

const slugify = (value: string): string => {
  if (!value.trim()) return '';
  return stripDiacritics(value)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
};

const buildVariantName = (productName: string, size?: string, color?: string): string => {
  const base = productName.trim();
  const descriptors = [size, color]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length));

  if (!descriptors.length) {
    return base;
  }

  return `${base} - ${descriptors.join(' / ')}`;
};

const buildVariantSku = (baseSku: string, size?: string, color?: string, index = 0): string => {
  const suffixParts = [size, color]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length))
    .map((part) => slugify(part));

  if (!suffixParts.length) {
    suffixParts.push(`VAR${index + 1}`);
  }

  const candidate = [baseSku.trim(), ...suffixParts]
    .filter((part) => part.length)
    .join('-')
    .replace(/-+/g, '-');

  return candidate.slice(0, 80);
};

const mapFormVariantToPayload = (
  baseName: string,
  baseSku: string,
  variant: NewProductVariantForm,
  index: number
) => {
  const size = variant.size?.trim() || undefined;
  const color = variant.color?.trim() || undefined;
  const stock = toSafeInteger(variant.stock);
  const priceDelta = toSafeDecimal(variant.priceDelta);

  const payload: {
    name: string;
    sku: string;
    size?: string;
    color?: string;
    stock: number;
    priceDelta?: number;
  } = {
    name: buildVariantName(baseName, size, color),
    sku: buildVariantSku(baseSku, size, color, index),
    stock,
  };

  if (size) {
    payload.size = size;
  }

  if (color) {
    payload.color = color;
  }

  if (priceDelta !== 0) {
    payload.priceDelta = priceDelta;
  }

  return payload;
};

const buildDefaultVariant = (name: string, sku: string, stock: number) => ({
  name: name.trim(),
  sku: sku.trim(),
  stock: Math.max(stock, 0),
});

export default function InventoryView() {
  const { token, logout } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Estados para el formulario de agregar producto
  const [newProduct, setNewProduct] = useState<NewProductFormState>({
    name: '',
    description: '',
    sku: '',
    basePrice: '',
    stock: '',
    variants: []
  });
  
  // Estado para las variantes
  const [showVariants, setShowVariants] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<NewProductVariantForm>({
    size: '',
    color: '',
    stock: '',
    priceDelta: ''
  });

  // Estado para ajustar stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<InventoryRow | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: '',
    reason: '',
    type: 'add' as 'add' | 'subtract'
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
        const totalStock = variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          price: Number(item.basePrice ?? 0),
          status: item.status,
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

  const handleAddProduct = async () => {
    const trimmedName = newProduct.name.trim();
    const trimmedSku = newProduct.sku.trim();
    const trimmedBasePrice = newProduct.basePrice.trim();

    if (!token) {
      toast({
        title: 'Error',
        description: 'Tu sesión expiró. Inicia sesión nuevamente.',
        variant: 'destructive'
      });
      return;
    }

    if (!trimmedName || !trimmedSku || !trimmedBasePrice) {
      toast({
        title: 'Error',
        description: 'Por favor complete los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    const basePriceValue = Number.parseFloat(trimmedBasePrice);
    if (!Number.isFinite(basePriceValue) || basePriceValue < 0) {
      toast({
        title: 'Error',
        description: 'Ingrese un precio base válido.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const customVariants = newProduct.variants.map((variant, index) =>
        mapFormVariantToPayload(trimmedName, trimmedSku, variant, index)
      );

      const defaultVariant = buildDefaultVariant(trimmedName, trimmedSku, toSafeInteger(newProduct.stock));
      const variantsPayload = customVariants.length > 0 ? customVariants : [defaultVariant];

      const productPayload = {
        name: trimmedName,
        description: newProduct.description.trim() || undefined,
        sku: trimmedSku,
        basePrice: basePriceValue,
        variants: variantsPayload
      };

      await productsService.createProduct(productPayload, token);

      toast({
        title: 'Producto agregado',
        description: 'El producto se ha agregado exitosamente',
      });

      setShowAddModal(false);
      setShowVariants(false);
      setNewProduct({
        name: '',
        description: '',
        sku: '',
        basePrice: '',
        stock: '',
        variants: []
      });
      setCurrentVariant({
        size: '',
        color: '',
        stock: '',
        priceDelta: ''
      });

      await fetchProducts();
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo agregar el producto',
        variant: 'destructive'
      });
    }
  };

  const handleAddVariant = () => {
    if (!currentVariant.stock) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese el stock de la variante',
        variant: 'destructive'
      });
      return;
    }

    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, currentVariant]
    });
    
    setCurrentVariant({
      size: '',
      color: '',
      stock: '',
      priceDelta: ''
    });
  };

  const handleRemoveVariant = (index: number) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((_, i) => i !== index)
    });
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/products/import', {
        method: 'POST',
        body: formData,
        token,
        skipContentType: true
      });

      if (!response.ok) {
        throw new Error('Error al importar el archivo');
      }

      const result = await response.json();
      
      toast({
        title: 'Importación Exitosa',
        description: `Se importaron ${result.imported} productos correctamente`,
      });
      
      setShowImportModal(false);
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo importar el archivo CSV',
        variant: 'destructive'
      });
    }
  };

  const downloadTemplate = () => {
    const template = 'nombre,descripcion,sku,precio,stock,talla,color\n';
    const example = 'Camiseta Básica,Camiseta de algodón,CAM001,25000,50,M,Azul\n';
    const content = template + example;
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_productos.csv';
    link.click();
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
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Inventario</h1>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportModal(true)} variant="outline">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Importar CSV
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Agregar Producto
              </Button>
              <Button onClick={fetchProducts} variant="outline">
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-gray-600">Administra tu inventario de productos</p>
        </div>

        {/* Búsqueda */}
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

        {/* Alertas */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando productos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos en el inventario'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-gray-700">Producto</th>
                      <th className="text-left p-2 font-medium text-gray-700">SKU</th>
                      <th className="text-right p-2 font-medium text-gray-700">Precio</th>
                      <th className="text-center p-2 font-medium text-gray-700">Stock Total</th>
                      <th className="text-center p-2 font-medium text-gray-700">Estado</th>
                      <th className="text-center p-2 font-medium text-gray-700">Última Actualización</th>
                      <th className="text-center p-2 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isLowStock = product.totalStock > 0 && product.totalStock <= LOW_STOCK_THRESHOLD;
                      const isOutOfStock = product.totalStock === 0;

                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-gray-500">{product.description}</p>
                              )}
                              {product.variants.length > 0 && (
                                <div className="mt-1 flex gap-2 flex-wrap">
                                  {product.variants.map((variant) => (
                                    <span key={variant.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {variant.size && `Talla: ${variant.size}`}
                                      {variant.color && ` Color: ${variant.color}`}
                                      {` (Stock: ${variant.stock})`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-gray-600">{product.sku}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(product.price)}</td>
                          <td className="p-2 text-center">
                            {isOutOfStock ? (
                              <Badge variant="destructive">Agotado</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                {product.totalStock} (Bajo)
                              </Badge>
                            ) : (
                              <Badge variant="default">{product.totalStock}</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={statusLabels[product.status]?.variant || 'default'}>
                              {statusLabels[product.status]?.label || product.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-center text-sm text-gray-500">
                            {product.updatedAt.toLocaleDateString('es-CO')}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProductForStock(product);
                                setShowStockModal(true);
                                setStockAdjustment({ quantity: '', reason: '', type: 'add' });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                              Ajustar Stock
                            </Button>
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

        {/* Modal de Agregar Producto */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Agregar Nuevo Producto</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre del Producto *
                    </label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ej: Camiseta Básica"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Descripción
                    </label>
                    <Input
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Ej: Camiseta de algodón 100%"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        SKU *
                      </label>
                      <Input
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        placeholder="Ej: CAM001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Precio Base *
                      </label>
                      <Input
                        type="number"
                        value={newProduct.basePrice}
                        onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                        placeholder="25000"
                      />
                    </div>
                  </div>

                  {!showVariants && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Stock Inicial
                      </label>
                      <Input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Variantes (Talla/Color)</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowVariants(!showVariants)}
                      >
                        {showVariants ? 'Ocultar' : 'Agregar'} Variantes
                      </Button>
                    </div>

                    {showVariants && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            placeholder="Talla"
                            value={currentVariant.size}
                            onChange={(e) => setCurrentVariant({ ...currentVariant, size: e.target.value })}
                          />
                          <Input
                            placeholder="Color"
                            value={currentVariant.color}
                            onChange={(e) => setCurrentVariant({ ...currentVariant, color: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={currentVariant.stock}
                            onChange={(e) => setCurrentVariant({ ...currentVariant, stock: e.target.value })}
                          />
                          <Button onClick={handleAddVariant} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {newProduct.variants.length > 0 && (
                          <div className="space-y-2">
                            {newProduct.variants.map((variant, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span>
                                  {variant.size && `Talla: ${variant.size}`}
                                  {variant.color && ` - Color: ${variant.color}`}
                                  {` - Stock: ${variant.stock}`}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveVariant(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleAddProduct} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Producto
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Ajustar Stock */}
        {showStockModal && selectedProductForStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Ajustar Stock</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowStockModal(false);
                      setSelectedProductForStock(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{selectedProductForStock.name}</p>
                    <p className="text-sm text-gray-500">SKU: {selectedProductForStock.sku}</p>
                    <p className="text-sm text-gray-500">Stock actual: {selectedProductForStock.totalStock}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo de ajuste
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={stockAdjustment.type === 'add' ? 'default' : 'outline'}
                        onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'add' })}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar
                      </Button>
                      <Button
                        variant={stockAdjustment.type === 'subtract' ? 'default' : 'outline'}
                        onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'subtract' })}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Restar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cantidad
                    </label>
                    <Input
                      type="number"
                      value={stockAdjustment.quantity}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                      placeholder="Ingrese la cantidad"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Razón del ajuste
                    </label>
                    <Input
                      value={stockAdjustment.reason}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                      placeholder="Ej: Inventario físico, pérdida, daño"
                    />
                  </div>

                  {stockAdjustment.type === 'subtract' && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Se reducirá el stock en {stockAdjustment.quantity || 0} unidades.
                        Stock resultante: {selectedProductForStock.totalStock - (parseInt(stockAdjustment.quantity) || 0)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {stockAdjustment.type === 'add' && stockAdjustment.quantity && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Se aumentará el stock en {stockAdjustment.quantity} unidades.
                        Stock resultante: {selectedProductForStock.totalStock + (parseInt(stockAdjustment.quantity) || 0)}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={async () => {
                        if (!stockAdjustment.quantity || !stockAdjustment.reason) {
                          toast({
                            title: 'Error',
                            description: 'Por favor complete todos los campos',
                            variant: 'destructive'
                          });
                          return;
                        }

                        const quantity = parseInt(stockAdjustment.quantity);
                        if (isNaN(quantity) || quantity <= 0) {
                          toast({
                            title: 'Error',
                            description: 'Ingrese una cantidad válida',
                            variant: 'destructive'
                          });
                          return;
                        }

                        const finalQuantity = stockAdjustment.type === 'subtract' ? -quantity : quantity;

                        if (stockAdjustment.type === 'subtract' && selectedProductForStock.totalStock < quantity) {
                          toast({
                            title: 'Error',
                            description: 'No hay suficiente stock para realizar esta operación',
                            variant: 'destructive'
                          });
                          return;
                        }

                        try {
                          await inventoryService.adjustStock(
                            {
                              productId: selectedProductForStock.id,
                              quantity: finalQuantity,
                              movementType: MovementType.ADJUSTMENT,
                              reason: stockAdjustment.reason,
                              notes: `Ajuste manual: ${stockAdjustment.reason}`
                            },
                            token!
                          );

                          toast({
                            title: 'Stock actualizado',
                            description: `El stock se ha ${stockAdjustment.type === 'add' ? 'aumentado' : 'reducido'} en ${quantity} unidades`
                          });

                          setShowStockModal(false);
                          setSelectedProductForStock(null);
                          await fetchProducts();
                        } catch (error) {
                          console.error('Error ajustando stock:', error);
                          toast({
                            title: 'Error',
                            description: error instanceof Error ? error.message : 'No se pudo ajustar el stock',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      Confirmar Ajuste
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowStockModal(false);
                        setSelectedProductForStock(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importar CSV */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Importar Productos desde CSV</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowImportModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      El archivo CSV debe contener las columnas: nombre, descripcion, sku, precio, stock, talla (opcional), color (opcional)
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Button
                      variant="outline"
                      className="w-full mb-4"
                      onClick={downloadTemplate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Plantilla CSV
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Seleccionar Archivo CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Formato esperado:</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs">
                      nombre,descripcion,sku,precio,stock,talla,color<br/>
                      Camiseta Básica,Algodón 100%,CAM001,25000,50,M,Azul
                    </code>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

