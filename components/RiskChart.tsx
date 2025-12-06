import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AuditFlag, RiskLevel } from '../types';

interface RiskChartProps {
  flags: AuditFlag[];
}

const RiskChart: React.FC<RiskChartProps> = ({ flags }) => {
  const data = [
    { name: 'High Risk', value: flags.filter(f => f.risk_level === RiskLevel.High).length, color: '#ef4444' },
    { name: 'Medium Risk', value: flags.filter(f => f.risk_level === RiskLevel.Medium).length, color: '#f97316' },
    { name: 'Low Risk', value: flags.filter(f => f.risk_level === RiskLevel.Low).length, color: '#eab308' },
    { name: 'Safe Practice', value: flags.filter(f => f.risk_level === RiskLevel.None).length, color: '#22c55e' },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Risk Distribution</h3>
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
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-slate-800">{flags.length}</p>
        <p className="text-sm text-slate-500">Total Events Analyzed</p>
      </div>
    </div>
  );
};

export default RiskChart;