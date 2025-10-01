import React from 'react'

export default function Settings() {
  const [settings, setSettings] = React.useState({
    companyName: 'ProcureX Inc.',
    companyEmail: 'contact@procurex.com',
    currency: 'KES',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    theme: 'light',
    fiscalYearStart: '01',
    timezone: 'Africa/Nairobi'
  })

  const [activeTab, setActiveTab] = React.useState<'general' | 'notifications' | 'security' | 'integrations'>('general')

  const handleSave = () => {
    console.log('Saving settings:', settings)
    alert('Settings saved successfully!')
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Settings</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage your application preferences and configurations</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar Tabs */}
        <div style={{ 
          width: 240, 
          backgroundColor: '#fff', 
          borderRadius: 8, 
          padding: 16,
          height: 'fit-content',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Settings
          </div>
          {[
            { id: 'general', icon: '⚙️', label: 'General' },
            { id: 'notifications', icon: '🔔', label: 'Notifications' },
            { id: 'security', icon: '🔒', label: 'Security' },
            { id: 'integrations', icon: '🔌', label: 'Integrations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                marginBottom: 4,
                backgroundColor: activeTab === tab.id ? '#f0f9ff' : 'transparent',
                border: 'none',
                borderLeft: activeTab === tab.id ? '3px solid #0ea5e9' : '3px solid transparent',
                color: activeTab === tab.id ? '#0ea5e9' : '#475569',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: 4,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 24, border: '1px solid #e2e8f0' }}>
          {activeTab === 'general' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>General Settings</h2>
              
              <div className="form-grid">
                <label>
                  <span>Company Name</span>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </label>

                <label>
                  <span>Company Email</span>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  />
                </label>

                <label>
                  <span>Default Currency</span>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </label>

                <label>
                  <span>Language</span>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                    <option value="fr">French</option>
                  </select>
                </label>

                <label>
                  <span>Fiscal Year Start Month</span>
                  <select
                    value={settings.fiscalYearStart}
                    onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0')
                      const monthName = new Date(2000, i, 1).toLocaleString('en', { month: 'long' })
                      return <option key={month} value={month}>{monthName}</option>
                    })}
                  </select>
                </label>

                <label>
                  <span>Timezone</span>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  >
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </label>

                <label>
                  <span>Theme</span>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>Notification Preferences</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Email Notifications</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>Receive updates via email</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                      style={{ width: 20, height: 20 }}
                    />
                  </label>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Push Notifications</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>Receive browser push notifications</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: e.target.checked }
                      })}
                      style={{ width: 20, height: 20 }}
                    />
                  </label>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>SMS Notifications</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>Receive updates via SMS</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, sms: e.target.checked }
                      })}
                      style={{ width: 20, height: 20 }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>Security Settings</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>Change Password</h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                    Update your password regularly to keep your account secure
                  </p>
                  <button className="btn-primary">Change Password</button>
                </div>

                <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>Two-Factor Authentication</h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-secondary">Enable 2FA</button>
                </div>

                <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>Active Sessions</h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                    Manage devices where you're currently logged in
                  </p>
                  <button className="btn-secondary">View Sessions</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>Integrations</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { name: 'M-PESA API', icon: '📱', status: 'Connected', color: '#22c55e' },
                  { name: 'Slack', icon: '💬', status: 'Not Connected', color: '#94a3b8' },
                  { name: 'Google Drive', icon: '📁', status: 'Connected', color: '#22c55e' },
                  { name: 'Zapier', icon: '⚡', status: 'Not Connected', color: '#94a3b8' }
                ].map((integration, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 20,
                      backgroundColor: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{integration.icon}</div>
                    <h3 style={{ marginTop: 0, marginBottom: 4 }}>{integration.name}</h3>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: integration.color + '20',
                      color: integration.color,
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12
                    }}>
                      {integration.status}
                    </div>
                    <button 
                      className="btn-secondary" 
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      {integration.status === 'Connected' ? 'Manage' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: 32, 
            paddingTop: 24, 
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12
          }}>
            <button className="btn-secondary">Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
