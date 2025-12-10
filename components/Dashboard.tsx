import React, { useMemo } from 'react';
import { PropertyData, FinancialParams } from '../types';
import { calculateMetrics, formatCurrency, formatPercent } from '../utils/calculations';
import { MetricCard } from './MetricCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FinancialInputs } from './FinancialInputs';

interface DashboardProps {
  property: PropertyData;
  params: FinancialParams;
  onPropertyChange: (p: PropertyData) => void;
  onParamsChange: (p: FinancialParams) => void;
  isPdfGenerating?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  property, 
  params, 
  onPropertyChange, 
  onParamsChange,
  isPdfGenerating = false
}) => {
  const metrics = useMemo(() => calculateMetrics(property, params), [property, params]);

  const expenseData = [
    { name: 'Taxes', value: property.propertyTaxAnnual, color: '#94a3b8' },
    { name: 'Insurance', value: property.insuranceAnnual, color: '#cbd5e1' },
    { name: 'HOA', value: property.hoaMonthly * 12, color: '#e2e8f0' },
    { name: 'Maintenance', value: metrics.effectiveGrossIncome * (property.maintenanceRate / 100), color: '#64748b' },
    { name: 'Mortgage', value: metrics.annualDebtService, color: '#0ea5e9' },
  ];

  const comps = property.comps || [];

  return (
    <div 
      id="dashboard-container"
      className={`max-w-7xl mx-auto px-4 py-8 print:p-0 print:max-w-none ${isPdfGenerating ? 'bg-white p-6 max-w-none w-[1000px]' : ''}`}
    >
      <div className="mb-8 print:mb-4">
        <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{property.address}</h1>
        <p className="text-gray-500 mt-2 max-w-3xl print:text-sm">{property.description}</p>
        <div className="mt-4 flex gap-2 print:mt-2">
           <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium print:bg-transparent print:p-0 print:text-blue-600">
             {property.numUnits} Units
           </span>
           <span className={`print:hidden text-gray-300 ${isPdfGenerating ? 'hidden' : ''}`}>•</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium print:bg-transparent print:p-0 print:text-green-700">
             Est. List: {formatCurrency(property.listPrice)}
           </span>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-6 ${isPdfGenerating ? 'grid-cols-1 gap-6' : ''}`}>
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 order-2 lg:order-1 print:order-2">
          <FinancialInputs 
            property={property}
            params={params}
            onPropertyChange={onPropertyChange}
            onParamsChange={onParamsChange}
            isPdfMode={isPdfGenerating}
          />
        </div>

        {/* Right Column: Metrics & Visuals */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6 print:order-1 print:space-y-4">
          
          {/* Top Level Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-2 print:gap-2">
            <MetricCard 
              label="Cap Rate" 
              value={`${metrics.capRate.toFixed(2)}%`}
              highlight={true}
              tooltip="Net Operating Income divided by Purchase Price. Indicates the potential return on an investment property."
            />
            <MetricCard 
              label="Cash on Cash" 
              value={`${metrics.cashOnCashReturn.toFixed(2)}%`}
              tooltip="Annual pre-tax cash flow divided by total cash invested."
            />
            <MetricCard 
              label="Monthly Cash Flow" 
              value={formatCurrency(metrics.annualCashFlow / 12)}
              tooltip="Net income per month after all expenses and mortgage payments."
              trend={metrics.annualCashFlow > 0 ? 'positive' : 'negative'}
            />
             <MetricCard 
              label="Net Operating Income" 
              value={formatCurrency(metrics.noi)}
              subValue="Annual"
              tooltip="Annual revenue minus all necessary operating expenses."
            />
          </div>

          {/* Breakdown & Charts */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border print:p-4 print:break-inside-avoid ${isPdfGenerating ? 'shadow-none border p-4' : ''}`}>
             <h3 className="text-lg font-semibold text-gray-800 mb-4 print:text-base print:mb-2">Annual Expense Breakdown</h3>
             <div className="flex flex-col md:flex-row items-center print:flex-row">
                <div className="w-full md:w-1/2 h-64 print:h-48 print:w-1/2">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                         <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                         <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-8 space-y-3 print:space-y-1 print:w-1/2 print:text-sm">
                   <div className="flex justify-between border-b pb-2 print:pb-1">
                      <span className="text-gray-600">Gross Income</span>
                      <span className="font-medium text-green-600">{formatCurrency(metrics.grossAnnualIncome)}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2 print:pb-1">
                      <span className="text-gray-600">Effective Gross Income</span>
                      <span className="font-medium text-gray-800">{formatCurrency(metrics.effectiveGrossIncome)}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2 print:pb-1">
                      <span className="text-gray-600">Operating Expenses</span>
                      <span className="font-medium text-red-400">-{formatCurrency(metrics.totalOperatingExpenses)}</span>
                   </div>
                   <div className="flex justify-between border-b pb-2 print:pb-1">
                      <span className="text-gray-600">Debt Service</span>
                      <span className="font-medium text-red-400">-{formatCurrency(metrics.annualDebtService)}</span>
                   </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-gray-900">Total Annual Cash Flow</span>
                      <span className={`font-bold ${metrics.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.annualCashFlow)}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* Comparable Listings */}
          {comps.length > 0 && (
             <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border print:p-4 print:break-inside-avoid ${isPdfGenerating ? 'shadow-none border p-4' : ''}`}>
                <div className="flex justify-between items-center mb-4 print:mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 print:text-base">Rental Comps Sourced</h3>
                  <span className="text-xs text-gray-400 print:text-gray-500">Data simulated via Gemini Search</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 print:text-xs">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 print:bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 print:px-2 print:py-1">Address</th>
                        <th className="px-4 py-3 print:px-2 print:py-1">Price</th>
                        <th className="px-4 py-3 print:px-2 print:py-1">Details</th>
                        <th className="px-4 py-3 print:px-2 print:py-1">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((comp, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 print:px-2 print:py-1">{comp.address}</td>
                          <td className="px-4 py-3 print:px-2 print:py-1">{formatCurrency(comp.price)}/mo</td>
                          <td className="px-4 py-3 print:px-2 print:py-1">{comp.bedrooms}bd, {comp.bathrooms}ba</td>
                          <td className="px-4 py-3 print:px-2 print:py-1">
                             <span className="px-2 py-1 bg-gray-100 rounded text-xs print:bg-transparent print:p-0">
                               {comp.source || 'Unknown'}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};