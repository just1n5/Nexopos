import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { Printer, Download, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { PaymentMethod, type Sale } from '@/types'

interface ReceiptProps {
  sale: Sale
  onClose?: () => void
  showActions?: boolean
}

export default function Receipt({ sale, onClose, showActions = true }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { business } = useAuthStore()
  
  // Obtener el nombre del mÃ©todo de pago
  const getPaymentMethodName = (method: PaymentMethod) => {
    const methods = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.NEQUI]: 'Nequi',
      [PaymentMethod.DAVIPLATA]: 'Daviplata',
      [PaymentMethod.CREDIT]: 'CrÃ©dito (Fiado)'
    }
    return methods[method] || method
  }
  
  // Imprimir recibo
  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML
    if (!printContent) return
    
    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) return
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${sale.invoiceNumber || sale.id}</title>
          <style>
            @page { 
              size: 80mm auto;
              margin: 0;
            }
            body { 
              font-family: monospace; 
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 10px;
            }
            .receipt { 
              width: 100%;
              max-width: 280px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 8px 0;
            }
            .item { 
              display: flex; 
              justify-content: space-between;
              margin: 4px 0;
            }
            .item-name { 
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .total { 
              font-size: 14px; 
              font-weight: bold;
              margin-top: 8px;
            }
            .footer { 
              margin-top: 16px;
              text-align: center;
              font-size: 10px;
            }
            @media print {
              body { margin: 0; }
            }
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
  
  // Compartir por WhatsApp (simulado)
  const handleShare = () => {
    const message = `
*${business?.name}*
${business?.address}
Tel: ${business?.phone}
NIT: ${business?.nit}

RECIBO DE VENTA
${sale.invoiceNumber ? `No. ${sale.invoiceNumber}` : ''}
${formatDateTime(sale.date)}

---PRODUCTOS---
${sale.items.map(item => 
  `${item.product.name}\n${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}`
).join('\n\n')}

---TOTALES---
Subtotal: ${formatCurrency(sale.subtotal)}
IVA: ${formatCurrency(sale.tax)}
TOTAL: ${formatCurrency(sale.total)}

Pago: ${getPaymentMethodName(sale.paymentMethod)}
${sale.cashReceived ? `Recibido: ${formatCurrency(sale.cashReceived)}\nCambio: ${formatCurrency(sale.change || 0)}` : ''}

Â¡Gracias por su compra!
    `.trim()
    
    // En producciÃ³n, esto abrirÃ­a WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
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
        
        {/* Contenido del recibo */}
        <div ref={receiptRef} className="receipt p-6">
          {/* Header */}
          <div className="center mb-4">
            <h2 className="bold text-lg">{business?.name || 'NexoPOS'}</h2>
            <p className="text-xs text-gray-600">
              {business?.address && `${business.address}\n`}
              {business?.phone && `Tel: ${business.phone}\n`}
              {business?.nit && `NIT: ${business.nit}`}
            </p>
          </div>
          
          <Separator className="divider" />
          
          {/* InformaciÃ³n de la venta */}
          <div className="text-xs mb-3">
            <div className="item">
              <span>Fecha:</span>
              <span>{formatDateTime(sale.date)}</span>
            </div>
            {sale.invoiceNumber && (
              <div className="item">
                <span>No. Factura:</span>
                <span className="bold">{sale.invoiceNumber}</span>
              </div>
            )}
            {sale.customerId && (
              <div className="item">
                <span>Cliente:</span>
                <span>ID: {sale.customerId}</span>
              </div>
            )}
          </div>
          
          <Separator className="divider" />
          
          {/* Items */}
          <div className="mb-3">
            <div className="bold text-xs mb-2">PRODUCTOS</div>
            {sale.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="item-name text-xs font-medium">
                  {item.product.name}
                  {item.variant && ` - ${item.variant.name}`}
                </div>
                <div className="item text-xs">
                  <span className="text-gray-600">
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.total)}
                  </span>
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
          
          {/* Totales */}
          <div className="mb-3">
            <div className="item text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="item text-xs">
                <span>Descuento:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="item text-xs">
              <span>IVA:</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            <div className="item total text-base">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
          
          <Separator className="divider" />
          
          {/* InformaciÃ³n de pago */}
          <div className="mb-3">
            <div className="item text-xs">
              <span>Forma de pago:</span>
              <span className="font-medium">
                {getPaymentMethodName(sale.paymentMethod)}
              </span>
            </div>
            {sale.paymentMethod === PaymentMethod.CASH && sale.cashReceived && (
              <>
                <div className="item text-xs">
                  <span>Recibido:</span>
                  <span>{formatCurrency(sale.cashReceived)}</span>
                </div>
                <div className="item text-xs font-medium">
                  <span>Cambio:</span>
                  <span>{formatCurrency(sale.change || 0)}</span>
                </div>
              </>
            )}
            {sale.paymentMethod === PaymentMethod.CREDIT && (
              <div className="text-xs text-center mt-2 p-2 bg-yellow-50 rounded">
                <span className="font-medium">VENTA A CRÃ‰DITO</span>
              </div>
            )}
          </div>
          
          <Separator className="divider" />
          
          {/* Footer */}
          <div className="footer">
            <p className="text-xs mb-2">Â¡Gracias por su compra!</p>
            {business?.dianResolution && (
              <div className="text-[10px] text-gray-500">
                <p>ResoluciÃ³n DIAN: {business.dianResolution.resolution}</p>
                <p>
                  Autoriza del {business.dianResolution.prefix}{business.dianResolution.startNumber} 
                  al {business.dianResolution.prefix}{business.dianResolution.endNumber}
                </p>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">
              Powered by NexoPOS
            </p>
          </div>
        </div>
        
        {/* Acciones */}
        {showActions && (
          <>
            <Separator />
            <div className="p-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  )
}
