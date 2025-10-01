import React from 'react'

export default function Profile() {
  const [profile, setProfile] = React.useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@procurex.com',
    phone: '+254 712 345 678',
    role: 'Administrator',
    department: 'Management',
    bio: 'System administrator with full access to all modules.',
    avatar: ''
  })

  const [isEditing, setIsEditing] = React.useState(false)

  const handleSave = () => {
    console.log('Saving profile:', profile)
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>My Profile</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage your personal information and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Profile Card */}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: 8, 
          padding: 24,
          border: '1px solid #e2e8f0',
          height: 'fit-content',
          textAlign: 'center'
        }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 600,
              margin: '0 auto 20px'
            }}
          >
            {getInitials(profile.firstName, profile.lastName)}
          </div>

          <h2 style={{ margin: 0, marginBottom: 4 }}>
            {profile.firstName} {profile.lastName}
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>{profile.role}</p>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{profile.email}</p>

          <button 
            className="btn-secondary" 
            style={{ width: '100%', marginBottom: 8 }}
            onClick={() => alert('Upload avatar functionality')}
          >
            📷 Change Photo
          </button>

          <div style={{ 
            marginTop: 24, 
            paddingTop: 24, 
            borderTop: '1px solid #e2e8f0',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Department</div>
              <div style={{ fontWeight: 500 }}>{profile.department}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Phone</div>
              <div style={{ fontWeight: 500 }}>{profile.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Member Since</div>
              <div style={{ fontWeight: 500 }}>January 2024</div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: 8, 
          padding: 24,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Personal Information</h2>
            {!isEditing && (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              <span>First Name</span>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Last Name</span>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Phone Number</span>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
              />
            </label>

            <label>
              <span>Role</span>
              <input
                type="text"
                value={profile.role}
                disabled
                style={{ backgroundColor: '#f8fafc' }}
              />
            </label>

            <label>
              <span>Department</span>
              <select
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                disabled={!isEditing}
              >
                <option value="Management">Management</option>
                <option value="Finance">Finance</option>
                <option value="Procurement">Procurement</option>
                <option value="Operations">Operations</option>
                <option value="IT">IT</option>
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Bio</span>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </label>
          </div>

          {isEditing && (
            <div style={{ 
              marginTop: 24, 
              paddingTop: 24, 
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setIsEditing(false)
                  // Reset to original values in real app
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}

          {/* Activity Section */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { action: 'Updated invoice INV-1001', time: '2 hours ago', icon: '📄' },
                { action: 'Created new bill BILL-2045', time: '5 hours ago', icon: '📝' },
                { action: 'Reconciled bank account', time: 'Yesterday', icon: '🏦' },
                { action: 'Generated financial report', time: '2 days ago', icon: '📊' }
              ].map((activity, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    backgroundColor: '#f8fafc',
                    borderRadius: 8
                  }}
                >
                  <span style={{ fontSize: 24 }}>{activity.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{activity.action}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
