import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const AnalyticsView = ({ stats }) => {
  return (
    <div style={{ gridColumn: 'span 2' }}>
      <div className="analytics-grid">
         <div className="analytics-card">
            <p className="analytics-label">Total Completed Revenue</p>
            <p className="analytics-val">₹{stats.revenue.toLocaleString('en-IN')}</p>
         </div>
         <div className="analytics-card">
            <p className="analytics-label">Total Orders</p>
            <p className="analytics-val">{stats.orders}</p>
         </div>
         <div className="analytics-card">
            <p className="analytics-label">Total Network Entities</p>
            <p className="analytics-val">{stats.users + stats.companies}</p>
         </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="var(--teal-600)" /> Revenue Performance (GMV Trend)
        </h3>
        <div style={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.gmvTrend || []}>
              <defs>
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--teal-600)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--teal-600)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <ChartTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--teal-600)" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
