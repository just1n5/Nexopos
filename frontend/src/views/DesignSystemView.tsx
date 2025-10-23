import { useState } from 'react';
import {
  Palette, Type, Layout, Zap, Eye, Moon, Sun,
  ShoppingCart, Trash2, Check, AlertCircle, Info, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function DesignSystemView() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header con toggle de dark mode */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                Nexo POS Design System
              </h1>
              <p className="text-muted-foreground mt-2">
                Versión 2.0 - Sistema de diseño oficial de Nexo POS
              </p>
            </div>
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="icon"
              className="rounded-full"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        {/* Sección: Introducción */}
        <section className="mb-12">
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-3xl">Presentación del Proyecto</CardTitle>
              <CardDescription>Sistema punto de venta para el mercado colombiano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                <strong>Nexo POS</strong> es un sistema de punto de venta (POS) SaaS diseñado específicamente
                para el mercado colombiano, con cumplimiento de facturación electrónica DIAN según la
                Resolución 00165 de 2023.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">Identidad Única</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Colores vibrantes, tipografía Poppins y bordes súper-elipse que nos hacen reconocibles
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-success/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Zap className="h-6 w-6 text-success" />
                      </div>
                      <h3 className="font-semibold">Simplicidad Moderna</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Interfaz ligera, rápida y amigable con espaciado generoso y animaciones suaves
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-destructive/10 rounded-lg">
                        <Eye className="h-6 w-6 text-destructive" />
                      </div>
                      <h3 className="font-semibold">Accesibilidad</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Diseñado para todos con contraste adecuado y navegación intuitiva
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Paleta de Colores */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Palette className="h-8 w-8 text-primary" />
              Paleta de Colores
            </h2>
            <p className="text-muted-foreground mt-2">
              Colores vibrantes que definen nuestra identidad de marca
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-primary rounded-lg mb-4 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-nexo-glow-primary">
                  Nexo Cian
                </div>
                <h3 className="font-semibold mb-1">Primary - Nexo Cian</h3>
                <p className="text-sm text-muted-foreground mb-2">Acción principal</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#08D9D6</code>
              </CardContent>
            </Card>

            {/* Destructive */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-destructive rounded-lg mb-4 flex items-center justify-center text-destructive-foreground font-bold text-2xl shadow-nexo-glow-destructive">
                  Nexo Rosa
                </div>
                <h3 className="font-semibold mb-1">Destructive - Nexo Rosa</h3>
                <p className="text-sm text-muted-foreground mb-2">Acciones peligrosas</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#FF2E63</code>
              </CardContent>
            </Card>

            {/* Success */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-success rounded-lg mb-4 flex items-center justify-center text-success-foreground font-bold text-2xl">
                  Éxito
                </div>
                <h3 className="font-semibold mb-1">Success - Verde</h3>
                <p className="text-sm text-muted-foreground mb-2">Confirmaciones</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#10B981</code>
              </CardContent>
            </Card>

            {/* Background Dark */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#252A34' }}>
                  Nexo Oscuro
                </div>
                <h3 className="font-semibold mb-1">Background Dark</h3>
                <p className="text-sm text-muted-foreground mb-2">Fondo modo oscuro</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#252A34</code>
              </CardContent>
            </Card>

            {/* Card Dark */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#40514E' }}>
                  Nexo Gris-Verde
                </div>
                <h3 className="font-semibold mb-1">Card Dark</h3>
                <p className="text-sm text-muted-foreground mb-2">Tarjetas modo oscuro</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#40514E</code>
              </CardContent>
            </Card>

            {/* Background Light */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-background border-2 rounded-lg mb-4 flex items-center justify-center text-foreground font-bold text-xl">
                  Blanco
                </div>
                <h3 className="font-semibold mb-1">Background Light</h3>
                <p className="text-sm text-muted-foreground mb-2">Fondo modo claro</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">#FFFFFF</code>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sección: Tipografía */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Type className="h-8 w-8 text-primary" />
              Tipografía
            </h2>
            <p className="text-muted-foreground mt-2">
              Fuente Poppins para una voz moderna, clara y amigable
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6">
              <div>
                <h1 className="text-4xl font-bold">Título H1 - Poppins Bold 36px</h1>
                <p className="text-sm text-muted-foreground mt-1">text-4xl font-bold</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Título H2 - Poppins Bold 30px</h2>
                <p className="text-sm text-muted-foreground mt-1">text-3xl font-bold</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Título H3 - Poppins Semibold 24px</h3>
                <p className="text-sm text-muted-foreground mt-1">text-2xl font-semibold</p>
              </div>
              <div>
                <h4 className="text-xl font-semibold">Título H4 - Poppins Semibold 20px</h4>
                <p className="text-sm text-muted-foreground mt-1">text-xl font-semibold</p>
              </div>
              <div>
                <p className="text-base">Párrafo - Poppins Regular 16px. Este es el texto de cuerpo principal utilizado en toda la aplicación para garantizar legibilidad y comodidad visual.</p>
                <p className="text-sm text-muted-foreground mt-1">text-base</p>
              </div>
              <div>
                <p className="text-sm font-medium">Pequeño - Poppins Medium 14px</p>
                <p className="text-sm text-muted-foreground mt-1">text-sm font-medium</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Muted - Poppins Regular 14px para texto de ayuda</p>
                <p className="text-sm text-muted-foreground mt-1">text-sm text-muted-foreground</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Botones */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              Componentes - Botones
            </h2>
            <p className="text-muted-foreground mt-2">
              Botones con efecto "glow" al hacer hover para micro-interacciones
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Variantes */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Variantes</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Primary (Vender)
                    </Button>
                    <Button variant="destructive">
                      <Trash2 className="h-5 w-5 mr-2" />
                      Destructive (Eliminar)
                    </Button>
                    <Button variant="success">
                      <Check className="h-5 w-5 mr-2" />
                      Success (Guardar)
                    </Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Tamaños */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Tamaños</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>

                {/* Estados */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Estados</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>Normal</Button>
                    <Button disabled>Deshabilitado</Button>
                    <Button variant="destructive" disabled>Deshabilitado</Button>
                  </div>
                </div>

                {/* Con Iconos */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Con Iconos</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button size="icon">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <AlertCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Tarjetas */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Tarjetas (Cards)</h2>
            <p className="text-muted-foreground mt-2">
              Contenedores elevados con sombra suave en modo claro y contraste en modo oscuro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* KPI Card 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Ventas del Día</CardTitle>
                <CardDescription>Total de ventas realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">$1,234,567</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-success font-semibold">↑ 12.5%</span> vs ayer
                </p>
              </CardContent>
            </Card>

            {/* KPI Card 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Productos Vendidos</CardTitle>
                <CardDescription>Total de unidades</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-success">1,234</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-success font-semibold">↑ 8.2%</span> vs ayer
                </p>
              </CardContent>
            </Card>

            {/* KPI Card 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Clientes Atendidos</CardTitle>
                <CardDescription>Total de transacciones</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-destructive">456</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-destructive font-semibold">↓ 3.1%</span> vs ayer
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sección: Badges */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Insignias (Badges)</h2>
            <p className="text-muted-foreground mt-2">
              Etiquetas para estados y categorías con border-radius súper-elipse
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Variantes</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Casos de Uso</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success">
                      <Check className="h-3 w-3 mr-1" />
                      Pagado
                    </Badge>
                    <Badge variant="warning">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Cancelado
                    </Badge>
                    <Badge variant="info">
                      <Info className="h-3 w-3 mr-1" />
                      En Proceso
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Inputs */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Campos de Entrada (Inputs)</h2>
            <p className="text-muted-foreground mt-2">
              Inputs modernos con borde inferior y foco en color primario
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar Producto</label>
                  <Input
                    className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1
                               focus-visible:ring-0 focus-visible:ring-offset-0
                               focus-visible:border-primary transition-colors"
                    placeholder="Ingresa el nombre o código..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Cantidad</label>
                  <Input
                    type="number"
                    className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1
                               focus-visible:ring-0 focus-visible:ring-offset-0
                               focus-visible:border-primary transition-colors"
                    placeholder="0"
                    defaultValue="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1
                               focus-visible:ring-0 focus-visible:ring-offset-0
                               focus-visible:border-primary transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Espaciado */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Espaciado y Elevación</h2>
            <p className="text-muted-foreground mt-2">
              Rejilla de 4px para espaciado consistente y bordes súper-elipse
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Border Radius - Súper-elipse</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center text-white font-bold mb-2">
                        12px
                      </div>
                      <p className="text-sm text-muted-foreground">rounded-lg<br/>(Tarjetas)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary rounded-md flex items-center justify-center text-white font-bold mb-2">
                        8px
                      </div>
                      <p className="text-sm text-muted-foreground">rounded-md<br/>(Botones)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary rounded-sm flex items-center justify-center text-white font-bold mb-2">
                        4px
                      </div>
                      <p className="text-sm text-muted-foreground">rounded-sm<br/>(Badges)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Sombras</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 bg-card rounded-lg shadow-nexo-card">
                      <p className="font-medium">shadow-nexo-card</p>
                      <p className="text-sm text-muted-foreground">Sombra suave para tarjetas (modo claro)</p>
                    </div>
                    <div className="p-6 bg-primary text-primary-foreground rounded-lg shadow-nexo-glow-primary">
                      <p className="font-medium">shadow-nexo-glow-primary</p>
                      <p className="text-sm">Efecto glow para botones primarios</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center text-muted-foreground">
          <p className="text-sm">
            Nexo POS Design System v2.0 - Diseñado con Tailwind CSS, shadcn/ui y Poppins
          </p>
          <p className="text-xs mt-2">
            Sistema de punto de venta para Colombia con facturación DIAN
          </p>
        </footer>
      </div>
    </div>
  );
}
