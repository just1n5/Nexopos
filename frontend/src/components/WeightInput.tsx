import { useState } from 'react';
import { Scale, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const GRAMS_IN_POUND = 453.592;

interface WeightInputProps {
  productName: string;
  pricePerGram: number;
  onConfirm: (weightInGrams: number, total: number) => void;
  onCancel: () => void;
}

export default function WeightInput({ 
  productName, 
  pricePerGram, 
  onConfirm, 
  onCancel 
}: WeightInputProps) {
  const [weightInPounds, setWeightInPounds] = useState<string>('');

  const calculateTotal = (pounds: number) => {
    if (!pounds || pounds <= 0) return 0;
    const weightInGrams = pounds * GRAMS_IN_POUND;
    return weightInGrams * pricePerGram;
  };

  const total = calculateTotal(parseFloat(weightInPounds));
  const pricePerPound = pricePerGram * GRAMS_IN_POUND;

  const handleConfirm = () => {
    const poundsNum = parseFloat(weightInPounds);
    if (poundsNum > 0) {
      const weightInGrams = poundsNum * GRAMS_IN_POUND;
      onConfirm(weightInGrams, total);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Venta por Peso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-lg">{productName}</h3>
          <p className="text-sm text-gray-600">
            Precio: {formatCurrency(pricePerPound)}/lb
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Peso en Libras (lb)
          </label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={weightInPounds}
              onChange={(e) => setWeightInPounds(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ej: 1.5"
              className="text-lg pr-12"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              lb
            </span>
          </div>
        </div>

        {/* Botones de peso rápido */}
        <div className="grid grid-cols-4 gap-2">
          {[0.25, 0.5, 1, 2].map((lb) => (
            <Button
              key={lb}
              variant="outline"
              size="sm"
              onClick={() => setWeightInPounds(lb.toString())}
            >
              {lb} lb
            </Button>
          ))}
        </div>

        {/* Total calculado */}
        {weightInPounds && parseFloat(weightInPounds) > 0 && (
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Total:</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {weightInPounds} lb × {formatCurrency(pricePerPound)}/lb
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!weightInPounds || parseFloat(weightInPounds) <= 0}
          >
            Agregar al Carrito
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}