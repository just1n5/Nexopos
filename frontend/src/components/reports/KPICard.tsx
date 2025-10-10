import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SubLabel {
  label: string;
  value: string;
}

interface KPICardProps {
  title: string;
  mainValue: string;
  subLabels?: SubLabel[];
  variant?: 'default' | 'totalizador';
  changeIndicator?: {
    value: number;
    label: string;
  };
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  mainValue,
  subLabels,
  variant = 'default',
  changeIndicator,
}) => {
  return (
    <div
      className={`rounded-xl p-6 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 ${
        variant === 'totalizador' ? 'border-l-[3px] border-l-[#7C3AED]' : ''
      }`}
    >
      {/* Título */}
      <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">{title}</h3>

      {/* Valor Principal */}
      <p className="text-[32px] font-bold text-gray-900 dark:text-white leading-none mb-2">
        {mainValue}
      </p>

      {/* Indicador de Cambio */}
      {changeIndicator && (
        <div className="flex items-center gap-1.5 mt-3">
          {changeIndicator.value > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              changeIndicator.value > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {changeIndicator.value > 0 ? '+' : ''}
            {changeIndicator.value}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{changeIndicator.label}</span>
        </div>
      )}

      {/* Sub-etiquetas (Solo para desglose de IVA) */}
      {subLabels && subLabels.length > 0 && (
        <div className="mt-4 space-y-2">
          {subLabels.map((sub, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {sub.label}: <span className="text-gray-900 dark:text-white font-medium">{sub.value}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
