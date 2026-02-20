import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, CheckCircle, Printer, Clock, FolderOpen, Download, ArrowRight, X } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleSignIn = () => {
    setShowModal(true);
  };

  const handleContinueWithLark = () => {
    // Mock SSO - Navigate to app
    navigate('/app');
  };

  const features = [
    {
      icon: FileText,
      title: 'Bulk Document Generation',
      description: 'Generate hundreds of personalized documents from Excel data in minutes with our template system.',
    },
    {
      icon: Printer,
      title: 'Direct Printing',
      description: 'Send documents directly to your printers organized by area. No manual sorting required.',
    },
    {
      icon: Clock,
      title: 'Audit Trail',
      description: 'Complete tracking of all document activities. Know who processed what and when.',
    },
    {
      icon: FolderOpen,
      title: 'Area-Based Sorting',
      description: 'Documents automatically organized by area for efficient courier distribution and delivery.',
    },
    {
      icon: FolderOpen,
      title: 'Template Manager',
      description: 'Update and manage document templates with version history. Preview and switch between versions easily.',
    },
    {
      icon: Download,
      title: 'Export & Download',
      description: 'Download generated documents as ZIP files or export data for reporting.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'var(--surface-1)', 
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-1)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center justify-center" 
              style={{ 
                width: '32px', 
                height: '32px', 
                backgroundColor: 'var(--success)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            >
              <FileText style={{ color: 'var(--text-inverse)' }} size={20} />
            </div>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '20px', 
              fontWeight: 700,
              color: 'var(--text-1)' 
            }}>
              DL Generator
            </span>
          </div>
          <button
            onClick={handleSignIn}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--success)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              transition: `all var(--motion-fast) var(--ease-standard)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 mb-6"
              style={{
                backgroundColor: 'var(--success-soft)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--success)',
                  borderRadius: 'var(--radius-full)',
                }}
              ></div>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--success)',
              }}>
                Document Management System
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: 'var(--text-1)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-6)',
            }}>
              Streamline Your <span style={{ color: 'var(--success)' }}>Demand Letter Generation</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--text-2)',
              lineHeight: 1.7,
              marginBottom: 'var(--space-8)',
            }}>
              Generate, manage, and track demand letters efficiently with our powerful document processing platform. Save time and increase productivity.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSignIn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '14px 28px',
                  backgroundColor: 'var(--success)',
                  color: 'var(--text-inverse)',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all var(--motion-fast) var(--ease-standard)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button 
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'var(--surface-1)',
                  color: 'var(--text-2)',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '16px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: `all var(--motion-fast) var(--ease-standard)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div 
              style={{
                backgroundColor: 'var(--surface-1)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-8)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-5)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle style={{ color: 'var(--success)' }} size={20} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-2)',
                }}>
                  Auto-Generated
                </span>
              </div>
              <div className="space-y-3 mb-6">
                <div style={{
                  height: '12px',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-full)',
                  width: '100%',
                }}></div>
                <div style={{
                  height: '12px',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-full)',
                  width: '83.33%',
                }}></div>
                <div style={{
                  height: '12px',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-full)',
                  width: '66.67%',
                }}></div>
              </div>
              <div style={{
                height: '48px',
                backgroundColor: 'var(--success)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                }}>
                  Generate Document
                </span>
              </div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-16px',
                  right: '-16px',
                  backgroundColor: 'var(--success)',
                  color: 'var(--text-inverse)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-3)',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                100% End-to-end Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ 
        backgroundColor: 'var(--surface-1)', 
        padding: '80px 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-1)',
              marginBottom: 'var(--space-4)',
              letterSpacing: '-0.02em',
            }}>
              Powerful Features
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}>
              Everything you need to manage your document generation workflow efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-8)',
                  border: '1px solid var(--border)',
                  transition: `all var(--motion-medium) var(--ease-standard)`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--success)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--success) 0%, #F0FDF4 100%)',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}>
                  <feature.icon style={{ color: 'var(--text-inverse)' }} size={24} />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  marginBottom: 'var(--space-3)',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--success) 0%, #F0FDF4 100%)',
        padding: '80px 0',
      }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: 'var(--space-4)',
            letterSpacing: '-0.02em',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--text-1)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-8)',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          }}>
            Join your team and start generating documents efficiently today. Sign in with your Lark account to begin.
          </p>
          <button
            onClick={handleSignIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '16px 32px',
              backgroundColor: 'var(--surface-1)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              transition: `all var(--motion-fast) var(--ease-standard)`,
              boxShadow: 'var(--shadow-3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-3)';
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            Sign in with Lark
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--surface-dark)',
        padding: 'var(--space-8) 0',
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--success)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText style={{ color: 'var(--text-inverse)' }} size={20} />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-inverse)',
              }}>
                DL Generator
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-3)',
            }}>
              © 2026 DL Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            zIndex: 50,
          }}
        >
          <div 
            style={{
              backgroundColor: 'var(--surface-1)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-5)',
              maxWidth: '448px',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                padding: 'var(--space-2)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: `all var(--motion-fast) var(--ease-standard)`,
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} style={{ color: 'var(--text-inverse)' }} />
            </button>

            {/* Green Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--success) 0%, var(--info) 100%)',
              padding: 'var(--space-12) var(--space-8)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--surface-1)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
                boxShadow: 'var(--shadow-3)',
              }}>
                <FileText style={{ color: 'var(--success)' }} size={32} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-inverse)',
                marginBottom: 'var(--space-2)',
                letterSpacing: '-0.02em',
              }}>
                Welcome Back
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                Sign in to access DL Generator
              </p>
            </div>

            {/* White Body */}
            <div style={{ padding: 'var(--space-8)' }}>
              <button
                onClick={handleContinueWithLark}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  padding: '16px 24px',
                  backgroundColor: 'var(--success)',
                  color: 'var(--text-inverse)',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all var(--motion-fast) var(--ease-standard)`,
                  marginBottom: 'var(--space-4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                Continue with Lark
              </button>
              <p style={{
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--text-3)',
              }}>
                Secure authentication powered by Lark
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}