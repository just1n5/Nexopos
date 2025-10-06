import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Printer, Download, Share2, X } from 'lucide-react'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useBusinessStore } from '@/stores/businessStore'
import { PaymentMethod, Sale, SaleType } from '@/types'

interface ReceiptProps {
  sale: Sale
  onClose?: () => void
  showActions?: boolean
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.NEQUI]: 'Nequi',
  [PaymentMethod.DAVIPLATA]: 'Daviplata',
  [PaymentMethod.CREDIT]: 'Crédito (Fiado)',
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia',
  [PaymentMethod.OTHER]: 'Otro'
}

export default function Receipt({ sale, onClose, showActions = true }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { business } = useAuthStore()
  const { config: businessConfig } = useBusinessStore()
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  const payments = sale.payments ?? []
  const primaryMethod = sale.primaryPaymentMethod ?? sale.paymentMethod
  const primaryPaymentName = PAYMENT_LABELS[primaryMethod] ?? 'Otro'
  const fallbackDate = sale.createdAt ?? sale.date

  const cashDetails = useMemo(() => {
    if (primaryMethod !== PaymentMethod.CASH) return null
    const received = sale.cashReceived ?? payments[0]?.receivedAmount ?? 0
    const change = sale.change ?? payments[0]?.changeGiven ?? 0
    return { received, change }
  }, [primaryMethod, sale.cashReceived, sale.change, payments])

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${sale.saleNumber || sale.invoiceNumber || sale.id}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 10px;
            }
            .receipt { width: 100%; max-width: 280px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; }
            .total { font-size: 14px; font-weight: bold; margin-top: 8px; }
            .footer { margin-top: 16px; text-align: center; font-size: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleShare = () => {
    setShowWhatsappModal(true);
  };

  const handleSendWhatsapp = () => {
    const businessName = businessConfig.name || business?.name || 'NexoPOS'
    const businessAddress = businessConfig.address || business?.address || ''
    const businessPhone = businessConfig.phone || business?.phone || ''

    const message = `
*${businessName}*
${businessAddress}
Tel: ${businessPhone}
NIT: ${business?.nit ?? ''}

RECIBO DE VENTA
${sale.saleNumber ? `No. ${sale.saleNumber}` : ''}
${formatDateTime(fallbackDate)}

---PRODUCTOS---
${sale.items.map((item) => `${item.product.name}\n${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}`).join('\n\n')}

---TOTALES---
Subtotal: ${formatCurrency(sale.subtotal)}
Descuento: ${formatCurrency(sale.discount)}
IVA: ${formatCurrency(sale.tax)}
TOTAL: ${formatCurrency(sale.total)}

Pago: ${primaryPaymentName}
${cashDetails ? `Recibido: ${formatCurrency(cashDetails.received)}\nCambio: ${formatCurrency(cashDetails.change)}` : ''}

¡Gracias por su compra!
    `.trim()

    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 10) {
      alert('Por favor, ingrese un número de WhatsApp válido.');
      return;
    }
    const fullNumber = cleanNumber.length === 10 ? `57${cleanNumber}` : cleanNumber;

    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setShowWhatsappModal(false);
    setWhatsappNumber('');
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto"
    >
      <Card className="relative">
        {showActions && onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <div ref={receiptRef} className="receipt p-6">
          <div className="text-center mb-4">
            {businessConfig.logo && (
              <img
                src={businessConfig.logo}
                alt="Logo"
                className="h-16 mx-auto mb-2 object-contain"
              />
            )}
            <h2 className="text-lg font-semibold">
              {businessConfig.name || business?.name || 'NexoPOS'}
            </h2>
            {(businessConfig.address || business?.address) && (
              <p className="text-xs text-gray-500">{businessConfig.address || business?.address}</p>
            )}
            {(businessConfig.phone || business?.phone) && (
              <p className="text-xs text-gray-500">Tel: {businessConfig.phone || business?.phone}</p>
            )}
            {(businessConfig.nit || business?.nit) && (
              <p className="text-xs text-gray-500">NIT: {businessConfig.nit || business?.nit}</p>
            )}
          </div>

          <Separator className="divider" />

          <div className="space-y-1 text-xs mb-3">
            <p><span className="font-semibold">Recibo:</span> {sale.saleNumber ?? sale.invoiceNumber ?? sale.id}</p>
            <p><span className="font-semibold">Fecha:</span> {formatDateTime(fallbackDate)}</p>
            {sale.customerName && <p><span className="font-semibold">Cliente:</span> {sale.customerName}</p>}
          </div>

          <div className="mb-3">
            <div className="bold text-xs mb-2">PRODUCTOS</div>
            {sale.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className="item-name text-xs font-medium">
                  {item.product.name}
                  {item.variant && ` - ${item.variant.name}`}
                </div>
                <div className="item text-xs">
                  <span className="text-gray-600">
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
                {item.discount > 0 && (
                  <div className="text-xs text-gray-500">
                    Desc: {item.discount}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="divider" />

          <div className="mb-3 text-xs space-y-1">
            <div className="item">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="item">
                <span>Descuento:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="item">
              <span>IVA:</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            <div className="item total text-base">
              <span>Total:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <Separator className="divider" />

          <div className="mb-3 text-xs space-y-1">
            <div className="item">
              <span>Forma de pago:</span>
              <span className="font-medium">{primaryPaymentName}</span>
            </div>
            {payments.length > 1 && (
              <div className="text-[10px] text-gray-500 space-y-1">
                {payments.slice(1).map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>{PAYMENT_LABELS[payment.method] ?? payment.method}:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {cashDetails && (
              <>
                <div className="item">
                  <span>Recibido:</span>
                  <span>{formatCurrency(cashDetails.received)}</span>
                </div>
                <div className="item font-medium">
                  <span>Cambio:</span>
                  <span>{formatCurrency(cashDetails.change)}</span>
                </div>
              </>
            )}
            {(sale.saleType === SaleType.CREDIT || primaryMethod === PaymentMethod.CREDIT || (sale.creditAmount ?? 0) > 0) && (
              <div className="text-xs text-center mt-2 p-2 bg-yellow-50 rounded">
                <span className="font-medium">Venta a crédito</span>
                {sale.creditAmount != null && (
                  <p>Saldo pendiente: {formatCurrency(sale.creditAmount)}</p>
                )}
                {sale.creditDueDate && (
                  <p>Fecha límite: {formatDateTime(sale.creditDueDate)}</p>
                )}
              </div>
            )}
          </div>

          <Separator className="divider" />

          <div className="footer">
            <p className="text-xs mb-2">¡Gracias por su compra!</p>
            {business?.dianResolution && (
              <div className="text-[10px] text-gray-500 space-y-1">
                <p>Resolución DIAN: {business.dianResolution.resolution}</p>
                <p>
                  Autorizado del {business.dianResolution.prefix}{business.dianResolution.startNumber}
                  {' '}al {business.dianResolution.prefix}{business.dianResolution.endNumber}
                </p>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">Powered by NexoPOS</p>
          </div>
        </div>

        {showActions && (
          <>
            <Separator />
            <div className="p-4 flex justify-around gap-2">
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="default" size="icon" onClick={() => window.print()}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Modal de WhatsApp */}
      {showWhatsappModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Compartir por WhatsApp
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowWhatsappModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="whatsapp-number" className="block text-sm font-medium mb-1">
                  Número de WhatsApp
                </label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ej: 3001234567"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Incluye el indicativo si no es de Colombia.
                </p>
              </div>
              <Button onClick={handleSendWhatsapp} className="w-full">
                Enviar Recibo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
