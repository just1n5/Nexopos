import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

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

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  ACTIVE: { label: 'Activo', variant: 'default' },
  INACTIVE: { label: 'Inactivo', variant: 'secondary' },
  ARCHIVED: { label: 'Archivado', variant: 'outline' },
};

export default function InventoryView() {
  const { token, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      console.error('Error cargando inventario:', err);
      setError('No fue posible cargar los productos. Intenta de nuevo.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.totalStock, 0);
    const lowStock = products.filter((product) => product.totalStock > 0 && product.totalStock <= LOW_STOCK_THRESHOLD).length;
    const outOfStock = products.filter((product) => product.totalStock === 0).length;

    return { totalProducts, totalStock, lowStock, outOfStock };
  }, [products]);

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Inventario</h1>
          <p className="text-gray-600">Gestiona tus productos y existencias</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar productos (nombre o SKU)..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchProducts} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button disabled>
            <Plus className="w-5 h-5 mr-2" />
            Agregar Producto
          </Button>
          <Button variant="outline" disabled>
            <Upload className="w-5 h-5 mr-2" />
            Importar Excel
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total productos</p>
                  <p className="text-2xl font-bold">{metrics.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock total</p>
                  <p className="text-2xl font-bold">{metrics.totalStock}</p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.lowStock}</p>
                </div>
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sin stock</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.outOfStock}</p>
                </div>
                <Package className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de productos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <RefreshCw className="w-8 h-8 mb-3 animate-spin" />
                <p>Cargando inventario...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No encontramos productos. Asegúrate de haber ejecutado las semillas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Precio base</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((product) => {
                      const statusInfo = statusLabels[product.status] ?? statusLabels.ACTIVE;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                            )}
                            {product.variants.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{product.sku}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(product.price)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${product.totalStock === 0 ? 'text-red-600' : product.totalStock <= LOW_STOCK_THRESHOLD ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {product.totalStock}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {product.updatedAt.toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
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
      </div>
    </div>
  );
}

