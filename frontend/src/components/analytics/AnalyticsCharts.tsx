import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartProps {
  title: string;
  data: any[];
  className?: string;
}

export const TimelineChart: React.FC<ChartProps & { dataKeys?: string[] }> = ({
  title,
  data,
  dataKeys = ['sessions', 'users'],
  className = '',
}) => {
  const colors = ['#3b82f6', '#a855f7'];

  return (
    <div className={`analytics-chart ${className}`}>
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {dataKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EngagementChart: React.FC<ChartProps> = ({
  title,
  data,
  className = '',
}) => {
  return (
    <div className={`analytics-chart ${className}`}>
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DistributionChart: React.FC<
  ChartProps & { dataKey?: string; nameKey?: string }
> = ({ title, data, dataKey = 'value', nameKey = 'name', className = '' }) => {
  const colors = ['#3b82f6', '#a855f7', '#10b981', '#f97316', '#ef4444'];

  return (
    <div className={`analytics-chart ${className}`}>
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComparisonChart: React.FC<ChartProps & { dataKeys?: string[] }> = ({
  title,
  data,
  dataKeys = ['current', 'previous'],
  className = '',
}) => {
  const colors = ['#3b82f6', '#e5e7eb'];

  return (
    <div className={`analytics-chart ${className}`}>
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {dataKeys.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={colors[idx]} radius={[8, 8, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
