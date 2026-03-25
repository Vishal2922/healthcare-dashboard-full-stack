import { Component } from 'react';
import styled, { keyframes } from 'styled-components';

/* ─── Animations ────────────────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
`;

/* ─── Styled Components ─────────────────────────────────────────────────────── */
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: ${({ theme }) => theme?.colors?.background || '#f8fafc'};
  font-family: 'DM Sans', 'Inter', sans-serif;
`;

const Card = styled.div`
  max-width: 520px;
  width: 100%;
  text-align: center;
  padding: 48px 40px;
  background: ${({ theme }) => theme?.colors?.surface || '#fff'};
  border-radius: ${({ theme }) => theme?.borderRadius?.xl || '16px'};
  box-shadow: ${({ theme }) => theme?.shadows?.lg || '0 10px 25px rgba(0,0,0,0.08)'};
  animation: ${fadeIn} 0.5s ease-out;
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Title = styled.h1`
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
`;

const Message = styled.p`
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#64748b'};
`;

const ErrorDetail = styled.details`
  margin: 20px 0 28px;
  text-align: left;
  background: ${({ theme }) =>
    theme?.colors?.background === '#0f172a' ? 'rgba(255,255,255,0.05)' : '#fef2f2'};
  border: 1px solid ${({ theme }) =>
    theme?.colors?.error ? `${theme.colors.error}33` : '#fecaca'};
  border-radius: ${({ theme }) => theme?.borderRadius?.md || '8px'};
  overflow: hidden;
  transition: all 0.2s ease;
`;

const ErrorSummary = styled.summary`
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.error || '#ef4444'};
  cursor: pointer;
  user-select: none;

  &:hover {
    opacity: 0.8;
  }
`;

const ErrorText = styled.pre`
  margin: 0;
  padding: 12px 16px;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme?.colors?.error || '#dc2626'};
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) =>
    theme?.colors?.error ? `${theme.colors.error}22` : '#fecaca'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  padding: 12px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: ${({ theme }) => theme?.colors?.primary || '#20b486'};
  border: none;
  border-radius: ${({ theme }) => theme?.borderRadius?.md || '8px'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${({ theme }) =>
    theme?.colors?.primary ? `${theme.colors.primary}40` : 'rgba(32,180,134,0.25)'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${({ theme }) =>
      theme?.colors?.primary ? `${theme.colors.primary}50` : 'rgba(32,180,134,0.35)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryBtn = styled.button`
  padding: 12px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
  background: transparent;
  border: 1.5px solid ${({ theme }) => theme?.colors?.border || '#e2e8f0'};
  border-radius: ${({ theme }) => theme?.borderRadius?.md || '8px'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme?.colors?.background || '#f1f5f9'};
    border-color: ${({ theme }) => theme?.colors?.textSecondary || '#94a3b8'};
  }
`;

/* ─── ErrorBoundary Class Component ─────────────────────────────────────────── */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console for debugging
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Wrapper>
          <Card>
            <IconCircle>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </IconCircle>

            <Title>Something went wrong</Title>
            <Message>
              An unexpected error occurred while rendering this page.
              Don&apos;t worry — your data is safe.
            </Message>

            {this.state.error && (
              <ErrorDetail>
                <ErrorSummary>View error details</ErrorSummary>
                <ErrorText>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </ErrorText>
              </ErrorDetail>
            )}

            <ButtonGroup>
              <PrimaryBtn onClick={this.handleReload}>
                Reload Page
              </PrimaryBtn>
              <SecondaryBtn onClick={this.handleGoHome}>
                Go to Dashboard
              </SecondaryBtn>
            </ButtonGroup>
          </Card>
        </Wrapper>
      );
    }

    return this.props.children;
  }
}
