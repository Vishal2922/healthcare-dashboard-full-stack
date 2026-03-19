import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../modules/auth/hooks/useAuth';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import {
  HeartFilled,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

/* ─── Animations ──────────────────────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/* ─── Google Fonts ────────────────────────────────────────────────────────── */
const GlobalLogin = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

/* ─── Page Layout ─────────────────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f7f5f0;
  font-family: 'DM Sans', sans-serif;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

/* ─── Left Panel ──────────────────────────────────────────────────────────── */
const Panel = styled.aside`
  background: #0e1b2a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 860px) {
    display: none;
  }
`;

const PanelLines = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 59px,
      rgba(255, 255, 255, 0.03) 60px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 59px,
      rgba(255, 255, 255, 0.03) 60px
    );
`;

const PanelGlow = styled.div`
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(32, 180, 134, 0.18) 0%,
    transparent 70%
  );
`;

const PanelGlow2 = styled.div`
  position: absolute;
  top: -50px;
  left: -50px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(32, 180, 134, 0.07) 0%,
    transparent 70%
  );
`;

const PanelTop = styled.div`
  position: relative;
  z-index: 1;
`;

const PanelBottom = styled.div`
  position: relative;
  z-index: 1;
`;

const BrandMark = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 3.5rem;
`;

const BrandIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #20b486;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
`;

const BrandName = styled.span`
  font-weight: 500;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.01em;
`;

const PanelHeading = styled.h2`
  font-family: 'Fraunces', serif;
  font-weight: 300;
  font-style: italic;
  font-size: 38px;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.92);
  margin: 0 0 1.5rem;
  max-width: 320px;
`;

const PanelSub = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.42);
  margin: 0;
  max-width: 280px;
  line-height: 1.7;
`;

const StatRow = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const StatNum = styled.div`
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 26px;
  color: #20b486;
  line-height: 1;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const TrustBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.28);
`;

const TrustDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #20b486;
  display: inline-block;
  animation: ${pulse} 2.5s ease-in-out infinite;
`;

/* ─── Right Form Area ─────────────────────────────────────────────────────── */
const FormArea = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${fadeUp} 0.55s ease both;
`;

const FormHeader = styled.div`
  margin-bottom: 2.5rem;
`;

const WelcomeLabel = styled.p`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #20b486;
  margin: 0 0 10px;
`;

const FormTitle = styled.h1`
  font-family: 'Fraunces', serif;
  font-weight: 300;
  font-size: 32px;
  color: #0e1b2a;
  margin: 0 0 8px;
  line-height: 1.15;
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  color: #7a8694;
  margin: 0;
  line-height: 1.6;
`;

/* ─── Form ────────────────────────────────────────────────────────────────── */
const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 28px;
`;

const Field = styled.div``;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #4a5568;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ForgotBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #20b486;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &:hover {
    color: #17946d;
    text-decoration: underline;
  }
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  height: 46px;
  border: 1.5px solid ${({ $hasError }) => ($hasError ? '#e53e3e' : '#e2e8f0')};
  border-radius: 10px;
  padding: 0 46px 0 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #0e1b2a;
  background: white;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder {
    color: #bfc7d1;
  }

  &:focus {
    border-color: #20b486;
    box-shadow: 0 0 0 3px rgba(32, 180, 134, 0.12);
  }

  &:disabled {
    background: #f7f9fb;
    color: #a0aab4;
    cursor: not-allowed;
  }
`;

const InputIconWrap = styled.div`
  position: absolute;
  right: 14px;
  color: #bfc7d1;
  display: flex;
  align-items: center;
  pointer-events: ${({ $clickable }) => ($clickable ? 'auto' : 'none')};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  background: none;
  border: none;
  padding: 0;
  transition: color 0.15s;
  font-size: 16px;

  &:hover {
    color: ${({ $clickable }) => ($clickable ? '#4a5568' : '#bfc7d1')};
  }
`;

/* ─── Error Alert ─────────────────────────────────────────────────────────── */
const ErrorAlert = styled.div`
  background: #fff5f5;
  border: 1.5px solid #fed7d7;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: ${shake} 0.4s ease;
`;

const ErrorIconWrap = styled.div`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fc8181;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  font-size: 9px;
  color: white;
`;

const ErrorText = styled.p`
  font-size: 13.5px;
  color: #c53030;
  margin: 0;
  line-height: 1.5;
`;

/* ─── Submit Button ───────────────────────────────────────────────────────── */
const SubmitButton = styled.button`
  width: 100%;
  height: 50px;
  border-radius: 12px;
  border: none;
  background: ${({ disabled }) => (disabled ? '#a0d8c8' : '#0e1b2a')};
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s, transform 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;

  &:hover:not(:disabled) {
    background: #1a2d43;
  }

  &:active:not(:disabled) {
    transform: scale(0.985);
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

/* ─── Footer ──────────────────────────────────────────────────────────────── */
const FormFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #a0aab4;
`;

/* ─── LoginPage Component ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, isLoggedIn, dismissError } = useAuth();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const usernameRef = useRef(null);

  // Tenant detection
  const host = window.location.hostname;
  const rootDomain = process.env.REACT_APP_APP_DOMAIN || 'localhost';
  const tenantCode =
    host !== rootDomain && host.endsWith(`.${rootDomain}`)
      ? host.replace(`.${rootDomain}`, '')
      : null;

  // Redirect after successful login based on role
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Auto-focus username field on mount
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Clear error whenever user edits the form
  useEffect(() => {
    if (error) dismissError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    login(username.trim(), password);
  };

  const isDisabled = loading || !username.trim() || !password;

  return (
    <>
      <GlobalLogin />

      <Page>
        {/* ── Left branding panel ── */}
        <Panel>
          <PanelLines />
          <PanelGlow />
          <PanelGlow2 />

          <PanelTop>
            <BrandMark>
              <BrandIcon>
                <HeartFilled />
              </BrandIcon>
              <BrandName>ClinicOS</BrandName>
            </BrandMark>

            <PanelHeading>Healthcare that moves at your pace.</PanelHeading>

            <PanelSub>
              A unified platform for clinics — from patient intake to billing,
              all in one secure workspace.
            </PanelSub>
          </PanelTop>

          <PanelBottom>
            <StatRow>
              <div>
                <StatNum>99.9%</StatNum>
                <StatLabel>Uptime</StatLabel>
              </div>
              <div>
                <StatNum>AES-256</StatNum>
                <StatLabel>Encryption</StatLabel>
              </div>
              <div>
                <StatNum>RBAC</StatNum>
                <StatLabel>Role control</StatLabel>
              </div>
            </StatRow>

            <TrustBar>
              <TrustDot />
              All systems operational
            </TrustBar>
          </PanelBottom>
        </Panel>

        {/* ── Right form panel ── */}
        <FormArea>
          <FormCard>
            <FormHeader>
              <WelcomeLabel>Staff portal</WelcomeLabel>
              <FormTitle>Sign in</FormTitle>
              <FormSubtitle>
                {tenantCode
                  ? 'Use your staff credentials to access your workspace.'
                  : 'Workspace not found. Please navigate to your clinic\'s domain.'}
              </FormSubtitle>
            </FormHeader>

            {!tenantCode ? (
              <ErrorAlert role="alert">
                <ErrorIconWrap>
                  <CloseOutlined />
                </ErrorIconWrap>
                <ErrorText>
                  Direct login from the root domain is not permitted. Please access your personalized clinic login page (e.g., <strong>yourclinic.{rootDomain}</strong>).
                </ErrorText>
              </ErrorAlert>
            ) : (
              <Form onSubmit={handleSubmit} noValidate>
              {/* Error alert */}
              {error && (
                <ErrorAlert role="alert">
                  <ErrorIconWrap>
                    <CloseOutlined />
                  </ErrorIconWrap>
                  <ErrorText>{error}</ErrorText>
                </ErrorAlert>
              )}

              <FieldGroup>
                {/* Username */}
                <Field>
                  <Label htmlFor="username">Username</Label>
                  <InputWrap>
                    <Input
                      ref={usernameRef}
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="your.username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      $hasError={!!error}
                    />
                    <InputIconWrap aria-hidden="true">
                      <UserOutlined />
                    </InputIconWrap>
                  </InputWrap>
                </Field>

                {/* Password */}
                <Field>
                  <LabelRow>
                    <Label htmlFor="password">Password</Label>
                    <ForgotBtn type="button" tabIndex={-1}>
                      Forgot password?
                    </ForgotBtn>
                  </LabelRow>
                  <InputWrap>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      $hasError={!!error}
                    />
                    <InputIconWrap
                      as="button"
                      type="button"
                      $clickable
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </InputIconWrap>
                  </InputWrap>
                </Field>
              </FieldGroup>

              {/* Submit */}
              <SubmitButton type="submit" disabled={isDisabled}>
                {loading ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  'Sign in to workspace'
                )}
              </SubmitButton>

              {/* Security footer */}
              <FormFooter>
                <SafetyCertificateOutlined />
                JWT · CSRF protected · AES-256 encrypted
              </FormFooter>
            </Form>
            )}
          </FormCard>
        </FormArea>
      </Page>
    </>
  );
}