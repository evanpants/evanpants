import React from 'react';
import { PropertyData, FinancialParams } from '../types';

interface FinancialInputsProps {
  property: PropertyData;
  params: FinancialParams;
  onPropertyChange: (p: PropertyData) => void;
  onParamsChange: (p: FinancialParams) => void;
}

export const FinancialInputs: React.FC<FinancialInputsProps> = ({
  property,
  params,
  onPropertyChange,
  onParamsChange,
}) => {
  const handleParamChange = (key: keyof FinancialParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handlePropChange = (key: keyof PropertyData, value: number) => {
    onPropertyChange({ ...property, [key]: value });
  };

  const handleNumUnitsChange = (val: number) => {
    const newCount = Math.max(1, Math.floor(val));
    let newRents = [...(property.unitRents || [])];
    
    if (newCount > newRents.length) {
      // Fill new slots with the last known rent or the estimated average
      const fillValue = newRents.length > 0 ? newRents[newRents.length - 1] : property.estimatedRentPerUnit;
      for (let i = newRents.length; i < newCount; i++) {
        newRents.push(fillValue);
      }
    } else if (newCount < newRents.length) {
      newRents = newRents.slice(0, newCount);
    }

    onPropertyChange({ 
      ...property, 
      numUnits: newCount, 
      unitRents: newRents 
    });
  };

  const handleUnitRentChange = (index: number, val: number) => {
    const newRents = [...(property.unitRents || [])];
    newRents[index] = val;
    onPropertyChange({ ...property, unitRents: newRents });
  };

  // Improved contrast styles: Light blue background for inputs
  const inputClass = "w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow bg-blue-50 text-gray-900 font-medium placeholder-gray-400";
  const labelClass = "block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full overflow-y-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
        Investment Assumptions
      </h3>
      
      <div className="space-y-8">
        {/* Mortgage Section */}
        <div>
          <h4 className="flex items-center text-sm font-bold text-brand-700 mb-3">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Mortgage Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Down Payment (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={params.downPaymentPercent}
                onChange={(e) => handleParamChange('downPaymentPercent', parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={params.interestRate}
                onChange={(e) => handleParamChange('interestRate', parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Loan Term (Years)</label>
              <select
                value={params.loanTermYears}
                onChange={(e) => handleParamChange('loanTermYears', parseInt(e.target.value))}
                className={`${inputClass} appearance-none`}
              >
                <option value={15}>15 Years</option>
                <option value={30}>30 Years</option>
              </select>
            </div>
             <div>
              <label className={labelClass}>Closing Costs (%)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={params.closingCostsPercent}
                onChange={(e) => handleParamChange('closingCostsPercent', parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
           <h4 className="flex items-center text-sm font-bold text-brand-700 mb-3">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Property Details
           </h4>
           <div className="grid grid-cols-1 gap-4">
              <div>
                 <label className={labelClass}>Purchase Price ($)</label>
                 <input
                  type="number"
                  value={property.listPrice}
                  onChange={(e) => handlePropChange('listPrice', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Total Units</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={property.numUnits}
                    onChange={(e) => handleNumUnitsChange(parseFloat(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>
                
                {/* Dynamic Rent Inputs */}
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-brand-800 mb-3 uppercase tracking-wide border-b border-blue-200 pb-1">
                    Rent Per Unit
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {property.unitRents && property.unitRents.map((rent, idx) => (
                      <div key={idx} className="relative">
                        <label className="text-[10px] text-gray-500 font-bold mb-0.5 block">Unit {idx + 1}</label>
                        <input 
                           type="number"
                           value={rent}
                           onChange={(e) => handleUnitRentChange(idx, parseFloat(e.target.value) || 0)}
                           className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                  {(!property.unitRents || property.unitRents.length === 0) && (
                     <div className="text-sm text-gray-400 italic p-2">No units defined.</div>
                  )}
                </div>

              </div>
           </div>
        </div>

        {/* Expenses Section (Tax, Insurance, HOA) */}
        <div>
            <h4 className="flex items-center text-sm font-bold text-brand-700 mb-3">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Fixed Expenses
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Annual Tax ($)</label>
                  <input
                    type="number"
                    value={property.propertyTaxAnnual}
                    onChange={(e) => handlePropChange('propertyTaxAnnual', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                   <label className={labelClass}>Annual Ins. ($)</label>
                   <input
                    type="number"
                    value={property.insuranceAnnual}
                    onChange={(e) => handlePropChange('insuranceAnnual', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                 <div>
                   <label className={labelClass}>Monthly HOA ($)</label>
                   <input
                    type="number"
                    value={property.hoaMonthly}
                    onChange={(e) => handlePropChange('hoaMonthly', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>
        </div>

        {/* Operating Factors */}
        <div>
            <h4 className="flex items-center text-sm font-bold text-brand-700 mb-3">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Variable Factors
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Maint. Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={property.maintenanceRate}
                    onChange={(e) => handlePropChange('maintenanceRate', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                   <label className={labelClass}>Vacancy Rate (%)</label>
                   <input
                    type="number"
                     step="0.5"
                    value={property.vacancyRate}
                    onChange={(e) => handlePropChange('vacancyRate', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
