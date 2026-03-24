import styled, { keyframes } from 'styled-components';

/**
 * IdleWarningModal
 *
 * Shown 60 seconds before auto-logout.
 * Matches existing UI style (DM Sans, #0e1b2a, styled-components).
 *
 * Props:
 *   visible       → boolean
 *   secondsLeft   → number (60 → 0)
 *   onExtend      → () => void  — "Stay Logged In" clicked
 *   onLogout      → () => void  — "Logout Now" clicked
 */

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(0.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 27, 42, 0.55);
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(14, 27, 42, 0.18);
  padding: 36px 32px 28px;
  z-index: 10000;
  animation: ${slideUp} 0.22s ease;
  font-family: 'DM Sans', sans-serif;
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff8e6;
  border: 2px solid #f6c74b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin: 0 auto 20px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #0e1b2a;
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 14px;
  color: #718096;
  margin: 0 0 24px;
  line-height: 1.6;
`;

const CountdownRing = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    #e53e3e ${({ $pct }) => _pct($pct)}%,
    #fee2e2 ${({ $pct }) => _pct($pct)}%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #fff;
  }
`;

const _pct = (pct) => Math.round(pct * 100) / 100;

const CountdownNumber = styled.span`
  position: relative;
  z-index: 1;
  font-size: 22px;
  font-weight: 700;
  color: #e53e3e;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
`;

const StayBtn = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: #0e1b2a;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #1a2d43; }
`;

const LogoutBtn = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #718096;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover { border-color: #c53030; color: #c53030; }
`;

export default function IdleWarningModal({ visible, secondsLeft, onExtend, onLogout }) {
  if (!visible) return null;

  // conic-gradient percentage: 100% when 60s, 0% when 0s
  const pct = (secondsLeft / 60) * 100;

  return (
    <Overlay onClick={onExtend}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <IconWrap>⏱</IconWrap>

        <Title>Still there?</Title>
        <Subtitle>
          You've been idle for a while. You'll be automatically<br />
          logged out in:
        </Subtitle>

        <CountdownRing $pct={pct}>
          <CountdownNumber>{secondsLeft}</CountdownNumber>
        </CountdownRing>

        <BtnRow>
          <StayBtn onClick={onExtend}>Stay Logged In</StayBtn>
          <LogoutBtn onClick={onLogout}>Logout Now</LogoutBtn>
        </BtnRow>
      </Modal>
    </Overlay>
  );
}