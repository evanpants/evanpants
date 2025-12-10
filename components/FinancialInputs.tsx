import React from 'react';
import { PropertyData, FinancialParams } from '../types';

interface FinancialInputsProps {
  property: PropertyData;
  params: FinancialParams;
  onPropertyChange: (p: PropertyData) => void;
  onParamsChange: (p: FinancialParams) => void;
  isPdfMode?: boolean;
}

export const FinancialInputs: React.FC<FinancialInputsProps> = ({
  property,
  params,
  onPropertyChange,
  onParamsChange,
  isPdfMode = false,
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

  // Styles
  const inputClass = `
    w-full px-3 py-2 border border-blue-200 rounded-lg 
    focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow 
    bg-blue-50 text-gray-900 font-medium placeholder-gray-400
    print:hidden
  `;
  
  const labelClass = `block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide ${isPdfMode ? 'text-gray-500 mb-0' : ''} print:text-gray-500 print:mb-0`;
  const sectionHeaderClass = `flex items-center text-sm font-bold text-brand-700 mb-3 ${isPdfMode ? 'text-black border-b border-gray-300 pb-1 mb-2' : ''} print:text-black print:border-b print:border-gray-300 print:pb-1 print:mb-2`;
  const pdfValueClass = "font-bold text-black text-right w-full";
  
  // Container logic: if PDF mode, remove fixed height and overflow
  const containerClass = `
    bg-white p-6 rounded-xl shadow-sm border border-gray-100 
    ${isPdfMode ? 'h-auto overflow-visible shadow-none border-none p-0' : 'h-full overflow-y-auto'}
    print:h-auto print:overflow-visible print:shadow-none print:border-none print:p-0
  `;

  return (
    <div className={containerClass}>
      <h3 className={`text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100 ${isPdfMode ? 'hidden' : ''} print:hidden`}>
        Investment Assumptions
      </h3>
      
      <div className={`space-y-8 ${isPdfMode ? 'space-y-4' : ''} print:space-y-4`}>
        {/* Mortgage Section */}
        <div className="print:break-inside-avoid">
          <h4 className={sectionHeaderClass}>
            <svg className={`w-4 h-4 mr-2 ${isPdfMode ? 'hidden' : ''} print:hidden`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Mortgage Details
          </h4>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isPdfMode ? 'grid-cols-2 gap-x-8 gap-y-1' : ''} print:grid-cols-2 print:gap-x-8 print:gap-y-1`}>
            <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
              <label className={labelClass}>Down Payment (%)</label>
              {isPdfMode ? (
                <span className={pdfValueClass}>{params.downPaymentPercent}</span>
              ) : (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={params.downPaymentPercent}
                  onChange={(e) => handleParamChange('downPaymentPercent', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              )}
            </div>
            <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
              <label className={labelClass}>Interest Rate (%)</label>
              {isPdfMode ? (
                <span className={pdfValueClass}>{params.interestRate}</span>
              ) : (
                <input
                  type="number"
                  step="0.1"
                  value={params.interestRate}
                  onChange={(e) => handleParamChange('interestRate', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              )}
            </div>
            <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
              <label className={labelClass}>Loan Term (Years)</label>
              {isPdfMode ? (
                <span className={pdfValueClass}>{params.loanTermYears}</span>
              ) : (
                <select
                  value={params.loanTermYears}
                  onChange={(e) => handleParamChange('loanTermYears', parseInt(e.target.value))}
                  className={`${inputClass} appearance-none`}
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                </select>
              )}
            </div>
             <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
              <label className={labelClass}>Closing Costs (%)</label>
              {isPdfMode ? (
                <span className={pdfValueClass}>{params.closingCostsPercent}</span>
              ) : (
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={params.closingCostsPercent}
                  onChange={(e) => handleParamChange('closingCostsPercent', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              )}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="print:break-inside-avoid">
           <h4 className={sectionHeaderClass}>
            <svg className={`w-4 h-4 mr-2 ${isPdfMode ? 'hidden' : ''} print:hidden`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Property Details
           </h4>
           <div className={`grid grid-cols-1 gap-4 ${isPdfMode ? 'gap-2' : ''} print:gap-2`}>
              <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                 <label className={labelClass}>Purchase Price ($)</label>
                 {isPdfMode ? (
                   <span className={pdfValueClass}>{property.listPrice}</span>
                 ) : (
                   <input
                    type="number"
                    value={property.listPrice}
                    onChange={(e) => handlePropChange('listPrice', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                 )}
              </div>
              
              <div className={`grid grid-cols-1 gap-4 ${isPdfMode ? 'gap-2' : ''} print:gap-2`}>
                <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                  <label className={labelClass}>Total Units</label>
                  {isPdfMode ? (
                    <span className={pdfValueClass}>{property.numUnits}</span>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={property.numUnits}
                      onChange={(e) => handleNumUnitsChange(parseFloat(e.target.value) || 1)}
                      className={inputClass}
                    />
                  )}
                </div>
                
                {/* Dynamic Rent Inputs */}
                <div className={`bg-blue-50/50 p-3 rounded-lg border border-blue-100 ${isPdfMode ? 'bg-transparent border-none p-0' : ''} print:bg-transparent print:border-none print:p-0`}>
                  <label className={`block text-xs font-bold text-brand-800 mb-3 uppercase tracking-wide border-b border-blue-200 pb-1 ${isPdfMode ? 'text-gray-500 border-none mb-1' : ''} print:text-gray-500 print:border-none print:mb-1`}>
                    Rent Per Unit
                  </label>
                  <div className={`grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 ${isPdfMode ? 'max-h-none grid-cols-2 gap-x-8 gap-y-1' : ''} print:max-h-none print:grid-cols-2 print:gap-x-8 print:gap-y-1`}>
                    {property.unitRents && property.unitRents.map((rent, idx) => (
                      <div key={idx} className={`relative ${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                        <label className={`text-[10px] text-gray-500 font-bold mb-0.5 block ${isPdfMode ? 'text-gray-500 mb-0' : ''} print:text-gray-500 print:mb-0`}>Unit {idx + 1}</label>
                        {isPdfMode ? (
                          <span className={pdfValueClass}>{rent}</span>
                        ) : (
                          <input 
                             type="number"
                             value={rent}
                             onChange={(e) => handleUnitRentChange(idx, parseFloat(e.target.value) || 0)}
                             className={inputClass}
                          />
                        )}
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

        {/* Expenses Section */}
        <div className="print:break-inside-avoid">
            <h4 className={sectionHeaderClass}>
              <svg className={`w-4 h-4 mr-2 ${isPdfMode ? 'hidden' : ''} print:hidden`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Fixed Expenses
            </h4>
            <div className={`grid grid-cols-2 gap-4 ${isPdfMode ? 'grid-cols-2 gap-x-8 gap-y-1' : ''} print:grid-cols-2 print:gap-x-8 print:gap-y-1`}>
                <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                  <label className={labelClass}>Annual Tax ($)</label>
                  {isPdfMode ? (
                    <span className={pdfValueClass}>{property.propertyTaxAnnual}</span>
                  ) : (
                    <input
                      type="number"
                      value={property.propertyTaxAnnual}
                      onChange={(e) => handlePropChange('propertyTaxAnnual', parseFloat(e.target.value) || 0)}
                      className={inputClass}
                    />
                  )}
                </div>
                <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                   <label className={labelClass}>Annual Ins. ($)</label>
                   {isPdfMode ? (
                     <span className={pdfValueClass}>{property.insuranceAnnual}</span>
                   ) : (
                     <input
                      type="number"
                      value={property.insuranceAnnual}
                      onChange={(e) => handlePropChange('insuranceAnnual', parseFloat(e.target.value) || 0)}
                      className={inputClass}
                    />
                   )}
                </div>
                 <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                   <label className={labelClass}>Monthly HOA ($)</label>
                   {isPdfMode ? (
                     <span className={pdfValueClass}>{property.hoaMonthly}</span>
                   ) : (
                     <input
                      type="number"
                      value={property.hoaMonthly}
                      onChange={(e) => handlePropChange('hoaMonthly', parseFloat(e.target.value) || 0)}
                      className={inputClass}
                    />
                   )}
                </div>
              </div>
        </div>

        {/* Operating Factors */}
        <div className="print:break-inside-avoid">
            <h4 className={sectionHeaderClass}>
              <svg className={`w-4 h-4 mr-2 ${isPdfMode ? 'hidden' : ''} print:hidden`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Variable Factors
            </h4>
            <div className={`grid grid-cols-2 gap-4 ${isPdfMode ? 'grid-cols-2 gap-x-8 gap-y-1' : ''} print:grid-cols-2 print:gap-x-8 print:gap-y-1`}>
                <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                  <label className={labelClass}>Maint. Rate (%)</label>
                  {isPdfMode ? (
                    <span className={pdfValueClass}>{property.maintenanceRate}</span>
                  ) : (
                    <input
                      type="number"
                      step="0.5"
                      value={property.maintenanceRate}
                      onChange={(e) => handlePropChange('maintenanceRate', parseFloat(e.target.value) || 0)}
                      className={inputClass}
                    />
                  )}
                </div>
                <div className={`${isPdfMode ? 'flex justify-between items-center' : ''} print:flex print:justify-between print:items-center`}>
                   <label className={labelClass}>Vacancy Rate (%)</label>
                   {isPdfMode ? (
                     <span className={pdfValueClass}>{property.vacancyRate}</span>
                   ) : (
                     <input
                      type="number"
                       step="0.5"
                      value={property.vacancyRate}
                      onChange={(e) => handlePropChange('vacancyRate', parseFloat(e.target.value) || 0)}
                      className={inputClass}
                    />
                   )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};