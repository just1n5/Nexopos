import { AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { User } from '@/types'

interface UserDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  user: User | null
  loading?: boolean
}

export default function UserDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false
}: UserDeleteDialogProps) {
  if (!user) return null

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Eliminar Usuario
          </DialogTitle>
          <DialogDescription className="pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 font-medium">
                    Esta acción no se puede deshacer
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Estás a punto de eliminar permanentemente al usuario:
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Se eliminarán todos los datos asociados a este usuario.
                Las ventas y registros históricos se mantendrán pero no estarán asociados a ningún usuario.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
