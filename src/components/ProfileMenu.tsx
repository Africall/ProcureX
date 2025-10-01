import React from 'react'

interface ProfileMenuProps {
  userName?: string
  userEmail?: string
  userRole?: string
}

export default function ProfileMenu({ 
  userName = 'Admin User', 
  userEmail = 'admin@procurex.com',
  userRole = 'Administrator'
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          backgroundColor: 'transparent',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc'
          e.currentTarget.style.borderColor = '#cbd5e1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {getInitials(userName)}
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>{userName}</span>
          <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.2 }}>{userRole}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 220,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{userName}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{userEmail}</div>
          </div>

          <div style={{ padding: 8 }}>
            <a
              href="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                color: 'inherit',
                textDecoration: 'none',
                borderRadius: 4,
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>👤</span>
              <span>My Profile</span>
            </a>

            <a
              href="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                color: 'inherit',
                textDecoration: 'none',
                borderRadius: 4,
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>⚙️</span>
              <span>Settings</span>
            </a>

            <a
              href="/help"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                color: 'inherit',
                textDecoration: 'none',
                borderRadius: 4,
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>❓</span>
              <span>Help & Support</span>
            </a>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', padding: 8 }}>
            <button
              onClick={() => {
                // Add logout logic here
                console.log('Logout clicked')
                alert('Logout functionality will be implemented')
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ef4444',
                borderRadius: 4,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
