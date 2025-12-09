import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AuditFlag, RiskLevel } from '../types';

interface RiskChartProps {
  flags: AuditFlag[];
}

const RiskChart: React.FC<RiskChartProps> = ({ flags }) => {
  const data = [
    { name: 'High Risk', value: flags.filter(f => f.risk_level === RiskLevel.High).length, color: '#ef4444' }, // red-500
    { name: 'Medium Risk', value: flags.filter(f => f.risk_level === RiskLevel.Medium).length, color: '#f97316' }, // orange-500
    { name: 'Low Risk', value: flags.filter(f => f.risk_level === RiskLevel.Low).length, color: '#eab308' }, // yellow-500
    { name: 'Safe Practice', value: flags.filter(f => f.risk_level === RiskLevel.None).length, color: '#10b981' }, // emerald-500
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-cyan-900/30 shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-cyan-400 rounded-full"></span>
        Risk Distribution
      </h3>
      <div className="flex-grow min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid rgba(34, 211, 238, 0.2)', 
                  backgroundColor: '#0B1221', 
                  color: '#F8FAFC',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
                }}
                itemStyle={{ color: '#F8FAFC' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center border-t border-slate-800 pt-4">
        <p className="text-3xl font-bold text-slate-100 font-mono">{flags.length}</p>
        <p className="text-xs text-cyan-500/70 uppercase tracking-widest font-bold mt-1">Total Events Analyzed</p>
      </div>
    </div>
  );
};

export default RiskChart;