import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Loader2,
  AlertCircle,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { tenantManagementService, type TenantInfo } from '@/services/tenantManagementService';
import { useToast } from '@/hooks/useToast';

type ActionType = 'suspend' | 'delete' | null;

export default function TenantManagementView() {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el flujo de acciones
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [finalConfirmDialogOpen, setFinalConfirmDialogOpen] = useState(false);

  // Estados para OTP
  const [otpCode, setOtpCode] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await tenantManagementService.getAllTenants(token);
      setTenants(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = (tenant: TenantInfo, action: 'suspend' | 'delete') => {
    setSelectedTenant(tenant);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!token || !user?.email || !selectedTenant || !actionType) return;

    setIsRequestingOtp(true);
    setConfirmDialogOpen(false);

    try {
      let response;
      if (actionType === 'suspend') {
        response = await tenantManagementService.requestSuspensionOtp(
          token,
          selectedTenant.id,
          user.email,
        );
      } else {
        response = await tenantManagementService.requestDeletionOtp(
          token,
          selectedTenant.id,
          user.email,
        );
      }

      setOtpExpiresAt(response.expiresAt);

      toast({
        title: 'OTP enviado',
        description: `Se ha enviado un código de verificación a ${user.email}`,
      });

      setOtpDialogOpen(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al solicitar OTP',
      });
      resetState();
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un código OTP válido de 6 dígitos',
      });
      return;
    }

    setOtpDialogOpen(false);
    setFinalConfirmDialogOpen(true);
  };

  const handleFinalConfirm = async () => {
    if (!token || !user?.email || !selectedTenant || !actionType || !otpCode) return;

    setIsExecutingAction(true);

    try {
      let response;
      if (actionType === 'suspend') {
        response = await tenantManagementService.suspendAccount(
          token,
          selectedTenant.id,
          otpCode,
          user.email,
        );
      } else {
        response = await tenantManagementService.deleteAccount(
          token,
          selectedTenant.id,
          otpCode,
          user.email,
        );
      }

      toast({
        title: 'Acción completada',
        description: response.message,
      });

      loadTenants();
      resetState();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al ejecutar la acción',
      });
    } finally {
      setIsExecutingAction(false);
      setFinalConfirmDialogOpen(false);
    }
  };

  const handleReactivate = async (tenant: TenantInfo) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de reactivar la cuenta de ${tenant.businessName}?`)) return;

    try {
      const response = await tenantManagementService.reactivateAccount(token, tenant.id);
      toast({
        title: 'Cuenta reactivada',
        description: response.message,
      });
      loadTenants();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Error al reactivar cuenta',
      });
    }
  };

  const resetState = () => {
    setSelectedTenant(null);
    setActionType(null);
    setOtpCode('');
    setOtpExpiresAt(null);
    setConfirmDialogOpen(false);
    setOtpDialogOpen(false);
    setFinalConfirmDialogOpen(false);
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a este panel. Solo SUPER_ADMIN puede gestionar cuentas.
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
              <Building2 className="w-8 h-8 text-primary" />
              Gestión de Cuentas
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra todas las cuentas registradas en la plataforma
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Cuentas</CardDescription>
              <CardTitle className="text-3xl">{tenants.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                Registradas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cuentas Activas</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {tenants.filter((t) => t.isActive).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                En operación
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cuentas Suspendidas</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {tenants.filter((t) => !t.isActive).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4" />
                Inactivas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cuentas Registradas</CardTitle>
            <CardDescription>Listado completo de todas las cuentas en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay cuentas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Propietario</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{tenant.businessName}</p>
                              <p className="text-xs text-muted-foreground">{tenant.businessType}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{tenant.nit}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {tenant.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                {tenant.email}
                              </div>
                            )}
                            {tenant.phone && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3" />
                                {tenant.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{tenant.ownerEmail || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{tenant.usersCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Suspendida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(tenant.createdAt).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tenant.isActive ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestAction(tenant, 'suspend')}
                                  className="text-orange-600 hover:bg-orange-50"
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Suspender
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestAction(tenant, 'delete')}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReactivate(tenant)}
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Reactivar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestAction(tenant, 'delete')}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </Button>
                              </>
                            )}
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

        {/* Confirm Action Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' ? 'Suspender Cuenta' : 'Eliminar Cuenta'}
              </DialogTitle>
              <DialogDescription>
                Estás a punto de {actionType === 'suspend' ? 'suspender' : 'eliminar'} la cuenta de{' '}
                <strong>{selectedTenant?.businessName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <Alert variant={actionType === 'delete' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {actionType === 'suspend' ? (
                  <>
                    <strong>Esta acción suspenderá temporalmente la cuenta:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Los usuarios no podrán iniciar sesión</li>
                      <li>Los datos se conservarán intactos</li>
                      <li>Podrás reactivar la cuenta más tarde</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <strong>⚠️ ADVERTENCIA: Esta acción es PERMANENTE</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Se eliminarán TODOS los datos</li>
                      <li>Se eliminarán TODOS los usuarios</li>
                      <li>NO se puede deshacer</li>
                    </ul>
                  </>
                )}
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground mt-4">
              Para continuar, se enviará un código de verificación a tu correo:{' '}
              <strong>{user?.email}</strong>
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={isRequestingOtp}
                variant={actionType === 'delete' ? 'destructive' : 'default'}
              >
                {isRequestingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar código OTP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OTP Input Dialog */}
        <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verificación de Seguridad</DialogTitle>
              <DialogDescription>
                Ingresa el código de 6 dígitos que fue enviado a <strong>{user?.email}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Código OTP</label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest mt-2"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  El código expira el {otpExpiresAt && new Date(otpExpiresAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleVerifyOtp} disabled={otpCode.length !== 6}>
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Final Confirmation Dialog */}
        <Dialog open={finalConfirmDialogOpen} onOpenChange={setFinalConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">
                {actionType === 'suspend' ? 'Confirmar Suspensión' : '⚠️ Confirmación Final'}
              </DialogTitle>
              <DialogDescription>
                Última confirmación antes de{' '}
                {actionType === 'suspend' ? 'suspender' : 'eliminar permanentemente'} la cuenta.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cuenta: {selectedTenant?.businessName}</strong>
                <br />
                {actionType === 'delete' &&
                  'Esta acción NO SE PUEDE REVERTIR. Todos los datos serán eliminados permanentemente.'}
                {actionType === 'suspend' &&
                  'La cuenta será suspendida y los usuarios no podrán acceder hasta que sea reactivada.'}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFinalConfirmDialogOpen(false)}
                disabled={isExecutingAction}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalConfirm}
                disabled={isExecutingAction}
                variant="destructive"
              >
                {isExecutingAction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {actionType === 'suspend' ? 'Suspender Cuenta' : 'Eliminar Permanentemente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
