import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  title?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, dataKey, xAxisKey, color = '#3B82F6', title }) => {
  return (
    <div className="w-full h-full">
      {title && <h3 className="text-white font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#colorGradient)" />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChart;
