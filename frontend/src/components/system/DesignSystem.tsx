import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KPICard } from "@/components/reports/KPICard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Terminal, DollarSign, TrendingUp } from "lucide-react";
import React from "react";

const DesignSystem = () => {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  // Dummy data for charts
  const barChartData = [
    { name: 'Ene', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 2000 },
    { name: 'Abr', sales: 2780 },
    { name: 'May', sales: 1890 },
    { name: 'Jun', sales: 2390 },
  ];

  const pieChartData = [
    { name: 'Category A', value: 400, color: '#3B82F6' }, // Azul
    { name: 'Category B', value: 300, color: '#10B981' }, // Verde (success)
    { name: 'Category C', value: 300, color: '#F59E0B' }, // Ámbar
    { name: 'Category D', value: 200, color: '#EC4899' }, // Rosa/Magenta
    { name: 'Category E', value: 100, color: '#8B5CF6' }, // Violeta
  ];

  const colors = [
    { name: "background", class: "bg-background", hsl: "0 0% 100%" },
    { name: "foreground", class: "bg-foreground", hsl: "224 24% 18%" },
    { name: "card", class: "bg-card", hsl: "0 0% 100%" },
    { name: "card-foreground", class: "bg-card-foreground", hsl: "224 24% 18%" },
    { name: "primary", class: "bg-primary", hsl: "180 94% 44%" },
    { name: "primary-foreground", class: "bg-primary-foreground", hsl: "224 24% 18%" },
    { name: "destructive", class: "bg-destructive", hsl: "345 100% 59%" },
    { name: "destructive-foreground", class: "bg-destructive-foreground", hsl: "224 24% 18%" },
    { name: "success", class: "bg-success", hsl: "158 81% 42%" },
    { name: "success-foreground", class: "bg-success-foreground", hsl: "0 0% 100%" },
    { name: "border", class: "bg-border", hsl: "214 32% 91%" },
    { name: "input", class: "bg-input", hsl: "214 32% 91%" },
    { name: "ring", class: "bg-ring", hsl: "180 94% 44%" },
  ];

  const icons = [
    { name: "Terminal", icon: <Terminal className="w-6 h-6" /> },
    { name: "DollarSign", icon: <DollarSign className="w-6 h-6" /> },
    { name: "TrendingUp", icon: <TrendingUp className="w-6 h-6" /> },
  ];

  return (
    <div className="space-y-8 p-4 bg-background text-foreground">
      
      {/* Section for Typography */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Typography</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">H1. The quick brown fox</h1>
            <h2 className="text-3xl font-bold tracking-tight">H2. The quick brown fox</h2>
            <h3 className="text-2xl font-semibold tracking-tight">H3. The quick brown fox</h3>
            <h4 className="text-xl font-semibold tracking-tight">H4. The quick brown fox</h4>
            <h5 className="text-lg font-semibold tracking-tight">H5. The quick brown fox</h5>
            <h6 className="text-base font-semibold tracking-tight">H6. The quick brown fox</h6>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              The quick brown fox jumps over the lazy dog. This is a standard paragraph text.
              It should be readable and convey information clearly.
            </p>
            <p className="text-sm text-muted-foreground">
              This is a muted paragraph, often used for secondary information or captions.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Section for Icons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Icons (Lucide React)</h2>
        <Card>
          <CardContent className="p-6 flex flex-wrap gap-6 items-center">
            {icons.map((icon) => (
              <div key={icon.name} className="flex flex-col items-center space-y-1">
                {icon.icon}
                <span className="text-xs text-muted-foreground">{icon.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Section for Color Palette */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Color Palette</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {colors.map((color) => (
            <Card key={color.name} className="overflow-hidden">
              <div className={`h-24 w-full ${color.class}`}></div>
              <CardContent className="p-4">
                <p className="font-semibold text-sm">{color.name}</p>
                <p className="text-xs text-muted-foreground">HSL: {color.hsl}</p>
                <p className="text-xs text-muted-foreground">Class: bg-{color.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section for Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Buttons</h2>
        <Card>
          <CardContent className="p-6 flex flex-wrap gap-4 items-center">
            <Button className="transition-all hover:shadow-nexo-glow-primary">Default</Button>
            <Button variant="destructive" className="transition-all hover:shadow-nexo-glow-destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>
      </section>

      {/* Section for Badges */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Badges</h2>
        <Card>
          <CardContent className="p-6 flex flex-wrap gap-4 items-center">
            <Badge className="rounded-sm" variant="default">Default</Badge>
            <Badge className="rounded-sm" variant="secondary">Secondary</Badge>
            <Badge className="rounded-sm" variant="outline">Outline</Badge>
            <Badge className="rounded-sm" variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>
      </section>

      {/* Section for Inputs */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Inputs</h2>
        <Card>
          <CardContent className="p-6 max-w-sm space-y-4">
            <Input 
              type="text" 
              placeholder="Standard Input" 
              className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 
                         focus-visible:ring-0 focus-visible:ring-offset-0 
                         focus-visible:border-primary transition-colors"
            />
            <Input 
              type="text" 
              placeholder="Disabled Input" 
              disabled 
              className="border-0 border-b-2 border-input rounded-t-lg px-2 py-1 
                         focus-visible:ring-0 focus-visible:ring-offset-0 
                         focus-visible:border-primary transition-colors"
            />
          </CardContent>
        </Card>
      </section>

      {/* Section for Textarea */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Textarea</h2>
        <Card>
          <CardContent className="p-6 max-w-sm">
            <Textarea placeholder="Type your message here." />
          </CardContent>
        </Card>
      </section>

      {/* Section for Interactive Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Interactive Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Dialog (Modal)</CardTitle></CardHeader>
            <CardContent className="p-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section for Checkbox */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Checkbox</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled" disabled />
              <Label htmlFor="disabled">Disabled checkbox</Label>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section for Progress */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Progress</h2>
        <Card>
          <CardContent className="p-6 max-w-sm">
            <Progress value={progress} className="w-[60%]" />
            <p className="text-sm text-muted-foreground mt-2">Current progress: {progress}%</p>
          </CardContent>
        </Card>
      </section>

      {/* Section for Select */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Select</h2>
        <Card>
          <CardContent className="p-6 max-w-sm">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="grape">Grape</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </section>

      {/* Section for Separator */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Separator</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
              <p className="text-sm text-muted-foreground">
                An open-source UI component library.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
              <div>Blog</div>
              <Separator orientation="vertical" />
              <div>Docs</div>
              <Separator orientation="vertical" />
              <div>Source</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section for Skeleton */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Skeleton</h2>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section for KPI Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Ventas del Día"
            mainValue="$1,234,567"
            subLabels={[{ label: "Total ventas", value: "123" }]} 
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title="Ingresos Netos"
            mainValue="$890,123"
            subLabels={[{ label: "Margen", value: "15%" }]} 
            variant="totalizador"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Section for Charts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Charts (Recharts)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Sales by Month</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="sales" fill="#3B82F6" /> {/* Updated BarChart fill */}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sales by Category</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
};

export default DesignSystem;
