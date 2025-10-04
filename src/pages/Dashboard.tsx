import React, { useState } from 'react'
import { useFormatCurrency } from '../utils/currency'
import { useDashboardStatus } from '../hooks/useDashboard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

// Sample data for the sales chart
const salesData = [
  { month: 'Jan', sales: 35000 },
  { month: 'Feb', sales: 42000 },
  { month: 'Mar', sales: 38000 },
  { month: 'Apr', sales: 45000 },
  { month: 'May', sales: 52000 },
  { month: 'Jun', sales: 48000 },
  { month: 'Jul', sales: 55000 },
  { month: 'Aug', sales: 62000 },
  { month: 'Sep', sales: 58000 },
  { month: 'Oct', sales: 65000 },
  { month: 'Nov', sales: 72000 },
  { month: 'Dec', sales: 68000 },
]

// Sample products data
const productsData = [
  { id: '#50285D', customer: 'John Doe', avatar: 'JD', destination: 'USA', flag: '🇺🇸', date: 'Sep 28, 2024', cost: '$450.00', status: 'Completed' },
  { id: '#50286A', customer: 'Sarah Smith', avatar: 'SS', destination: 'UK', flag: '🇬🇧', date: 'Sep 27, 2024', cost: '$320.00', status: 'Pending' },
  { id: '#50287B', customer: 'Mike Johnson', avatar: 'MJ', destination: 'Canada', flag: '🇨🇦', date: 'Sep 26, 2024', cost: '$890.00', status: 'Completed' },
  { id: '#50288C', customer: 'Emma Wilson', avatar: 'EW', destination: 'Australia', flag: '🇦🇺', date: 'Sep 25, 2024', cost: '$560.00', status: 'Cancel' },
  { id: '#50289D', customer: 'David Brown', avatar: 'DB', destination: 'Germany', flag: '🇩🇪', date: 'Sep 24, 2024', cost: '$720.00', status: 'Pending' },
]

const Dashboard: React.FC = () => {
  const status = useDashboardStatus()
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const fmt = useFormatCurrency()

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total Orders */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>1,495</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>vs Last month</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>↗ +5.6%</div>
        </div>

        {/* Total Delivery */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Delivery</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>1,383</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>vs Last month</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>↗ +5.6%</div>
        </div>

        {/* Total Shipments */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Shipments</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>4,387</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>vs Last month</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>↘ -0.5%</div>
        </div>

        {/* Total Revenue */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>$382,407</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>vs Last month</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>↗ +2.5%</div>
        </div>
      </div>

      {/* Chart and Shipment Tracking Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Sales Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Sales</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{fmt(463602.39)}</span>
                <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>↗ +18%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setTimePeriod('weekly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: timePeriod === 'weekly' ? '#3b82f6' : '#f1f5f9',
                  color: timePeriod === 'weekly' ? 'white' : '#64748b'
                }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setTimePeriod('monthly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: timePeriod === 'monthly' ? '#3b82f6' : '#f1f5f9',
                  color: timePeriod === 'monthly' ? 'white' : '#64748b'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setTimePeriod('yearly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: timePeriod === 'yearly' ? '#3b82f6' : '#f1f5f9',
                  color: timePeriod === 'yearly' ? 'white' : '#64748b'
                }}
              >
                Yearly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [fmt(value), 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Shipment Tracking */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Shipment Tracking</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Order Placed</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Sep 25, 2024</div>
              </div>
              <span style={{ color: '#3b82f6' }}>✓</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Preparing to ship</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Sep 26, 2024</div>
              </div>
              <span style={{ color: '#3b82f6' }}>✓</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Confirm Shipment</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Pending</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Picked up</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Pending</div>
              </div>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                ⚠️ Shipment #50285D delayed by 1 day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Products</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Customer</th>
              <th>Destination</th>
              <th>Date</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {productsData.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {product.avatar}
                    </div>
                    <span>{product.customer}</span>
                  </div>
                </td>
                <td>
                  <span style={{ marginRight: '8px' }}>{product.flag}</span>
                  {product.destination}
                </td>
                <td style={{ color: '#64748b' }}>{product.date}</td>
                <td style={{ fontWeight: '600' }}>{fmt(Number(product.cost.replace(/[^0-9.-]+/g, '')))}</td>
                <td>
                  <span className={`status-pill ${
                    product.status === 'Completed' ? 'status-paid' :
                    product.status === 'Pending' ? 'status-part-paid' :
                    'status-overdue'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <button style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                    👁️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard