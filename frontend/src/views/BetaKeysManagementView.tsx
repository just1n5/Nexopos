import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { betaKeysService, type BetaKey, type BetaKeyStats } from '@/services/betaKeysService';
import { useToast } from '@/hooks/useToast';

export default function BetaKeysManagementView() {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [keys, setKeys] = useState<BetaKey[]>([]);
  const [stats, setStats] = useState<BetaKeyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generateNotes, setGenerateNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'available'>('all');
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<BetaKey | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [keysData, statsData] = await Promise.all([
        betaKeysService.getAll(token),
        betaKeysService.getStats(token),
      ]);
      setKeys(keysData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las beta keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKeys = async () => {
    if (!token || generateCount < 1 || generateCount > 100) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un número válido entre 1 y 100',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await betaKeysService.generateKeys(token, generateCount, generateNotes);
      toast({
        title: 'Claves generadas',
        description: `Se generaron ${generateCount} nuevas beta keys exitosamente`,
      });
      setGenerateDialogOpen(false);
      setGenerateCount(10);
      setGenerateNotes('');
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Error al generar claves',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = async (id: string, key: string) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de eliminar la clave ${key}?`)) return;

    try {
      await betaKeysService.delete(token, id);
      toast({
        title: 'Clave eliminada',
        description: `La beta key ${key} fue eliminada`,
      });
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Error al eliminar la clave',
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: 'Copiado',
      description: 'Clave copiada al portapapeles',
    });
  };

  const handleOpenInvitationDialog = (key: BetaKey) => {
    setSelectedKey(key);
    setRecipientEmail('');
    setInvitationDialogOpen(true);
  };

  const handleSendInvitation = async () => {
    if (!token || !selectedKey || !recipientEmail) return;

    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, ingresa una dirección de correo válida.',
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await betaKeysService.sendInvitation(token, selectedKey.id, recipientEmail);
      toast({
        title: 'Invitación Enviada',
        description: response.message,
      });
      setInvitationDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: err.response?.data?.message || 'No se pudo enviar la invitación.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = `Clave Beta,Estado,Usado por,Fecha de uso,Notas\n${keys
      .map((k) => {
        const status = k.isUsed ? 'Usado' : 'Disponible';
        const usedBy = k.usedByTenant?.businessName || '-';
        const usedAt = k.usedAt ? new Date(k.usedAt).toLocaleDateString() : '-';
        const notes = k.notes || '-';
        return `"${k.key}","${status}","${usedBy}","${usedAt}","${notes}"`;
      })
      .join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `beta-keys-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredKeys = keys.filter((key) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'used') return key.isUsed;
    if (filterStatus === 'available') return !key.isUsed;
    return true;
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a este panel. Solo administradores pueden gestionar beta keys.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Key className="w-8 h-8 text-primary" />
              Gestión de Beta Keys
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra las claves de acceso beta para nuevos usuarios
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={keys.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generar Claves
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Claves</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="w-4 h-4" />
                  Generadas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Claves Usadas</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.used}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  Registros completados
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Claves Disponibles</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.available}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4" />
                  Sin usar
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Uso</CardDescription>
                <CardTitle className="text-3xl">{stats.usagePercentage.toFixed(0)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stats.usagePercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todas ({keys.length})
                </Button>
                <Button
                  variant={filterStatus === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('available')}
                >
                  Disponibles ({keys.filter((k) => !k.isUsed).length})
                </Button>
                <Button
                  variant={filterStatus === 'used' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('used')}
                >
                  Usadas ({keys.filter((k) => k.isUsed).length})
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>Beta Keys ({filteredKeys.length})</CardTitle>
            <CardDescription>Listado completo de claves beta generadas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay claves beta para mostrar</p>
                <Button onClick={() => setGenerateDialogOpen(true)} className="mt-4">
                  Generar Claves
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clave</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Usado por</TableHead>
                      <TableHead>Fecha de uso</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded font-mono text-sm">
                              {key.key}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyKey(key.key)}
                            >
                              {copiedKey === key.key ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {key.isUsed ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Usada
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Disponible
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.usedByTenant ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{key.usedByTenant.businessName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.usedAt ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(key.usedAt).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {key.notes || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!key.isUsed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenInvitationDialog(key)}
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:text-white"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id, key.key)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Dialog */}
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar Nuevas Beta Keys</DialogTitle>
              <DialogDescription>
                Crea nuevas claves de acceso beta para distribuir a usuarios seleccionados
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Cantidad de claves</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                  placeholder="10"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Máximo 100 claves por lote</p>
              </div>

              <div>
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Input
                  value={generateNotes}
                  onChange={(e) => setGenerateNotes(e.target.value)}
                  placeholder="Ej: Lote para distribución febrero 2025"
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateKeys} disabled={isGenerating}>
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generar {generateCount} claves
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Invitation Dialog */}
        <Dialog open={invitationDialogOpen} onOpenChange={setInvitationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Invitación con Beta Key</DialogTitle>
              <DialogDescription>
                Envia esta clave a un nuevo usuario para que pueda registrarse.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Clave Beta Seleccionada</label>
                <code className="mt-1 block w-full text-center px-2 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded font-mono text-lg">
                  {selectedKey?.key}
                </code>
              </div>

              <div>
                <label htmlFor="email-input" className="text-sm font-medium">Correo del destinatario</label>
                <Input
                  id="email-input"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInvitationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendInvitation} disabled={isSending}>
                {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
