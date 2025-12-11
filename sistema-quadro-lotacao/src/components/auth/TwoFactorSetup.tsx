import React, { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { setupTwoFactor, enableTwoFactor, verifyTwoFactor, user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step === 'setup') {
      initializeSetup();
    }
  }, [step]);

  const initializeSetup = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const setupData = await setupTwoFactor();
      setQrCode(setupData.qrCode);
      setSecret(setupData.secret);
      setBackupCodes(setupData.backupCodes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup 2FA';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // First verify the code
      const isValid = await verifyTwoFactor({
        code: verificationCode,
        secret: secret,
      });

      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        return;
      }

      // Enable 2FA
      const result = await enableTwoFactor(verificationCode);
      setBackupCodes(result.backupCodes);
      setStep('complete');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const downloadBackupCodes = () => {
    const content = `Sistema de Gestão de Quadro de Lotação - Backup Codes
Generated: ${new Date().toLocaleString()}
User: ${user?.email}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to log in.
After using a backup code, it will no longer be valid.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quadro-vagas-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'setup') {
    return (
      <div className="two-factor-setup">
        <div className="setup-header">
          <h2>Setup Two-Factor Authentication</h2>
          <p>Secure your account with an additional layer of protection</p>
        </div>

        {isLoading ? (
          <div className="loading">
            <p>Setting up 2FA...</p>
          </div>
        ) : (
          <div className="setup-content">
            <div className="step-indicator">
              <span className="step active">1</span>
              <span className="step">2</span>
              <span className="step">3</span>
            </div>

            <div className="setup-instructions">
              <h3>Step 1: Scan QR Code</h3>
              <p>
                Use your authenticator app (Google Authenticator, Authy, etc.) 
                to scan this QR code:
              </p>

              <div className="qr-code-container">
                {qrCode && (
                  <img 
                    src={qrCode} 
                    alt="2FA QR Code" 
                    className="qr-code"
                  />
                )}
              </div>

              <div className="manual-entry">
                <p>Can't scan? Enter this code manually:</p>
                <div className="secret-code">
                  <code>{secret}</code>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(secret)}
                    className="btn btn-sm btn-secondary"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="setup-actions">
              <button 
                type="button"
                onClick={() => setStep('verify')}
                className="btn btn-primary"
                disabled={!qrCode}
              >
                Next: Verify Code
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="two-factor-setup">
        <div className="setup-header">
          <h2>Verify Your Setup</h2>
          <p>Enter the 6-digit code from your authenticator app</p>
        </div>

        <div className="setup-content">
          <div className="step-indicator">
            <span className="step completed">1</span>
            <span className="step active">2</span>
            <span className="step">3</span>
          </div>

          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoComplete="one-time-code"
                className="verification-input"
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <div className="setup-actions">
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button 
                type="button"
                onClick={() => setStep('setup')}
                className="btn btn-secondary"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="two-factor-setup">
        <div className="setup-header">
          <h2>2FA Successfully Enabled!</h2>
          <p>Your account is now protected with two-factor authentication</p>
        </div>

        <div className="setup-content">
          <div className="step-indicator">
            <span className="step completed">1</span>
            <span className="step completed">2</span>
            <span className="step active">3</span>
          </div>

          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>Two-factor authentication has been enabled for your account.</p>
          </div>

          {backupCodes.length > 0 && (
            <div className="backup-codes">
              <h3>Backup Codes</h3>
              <p>
                Save these backup codes in a safe place. You can use them to access 
                your account if you lose your authenticator device.
              </p>
              
              <div className="codes-container">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    <span className="code-number">{index + 1}.</span>
                    <code>{code}</code>
                  </div>
                ))}
              </div>

              <div className="backup-actions">
                <button 
                  type="button"
                  onClick={downloadBackupCodes}
                  className="btn btn-secondary"
                >
                  Download Codes
                </button>
                <button 
                  type="button"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="btn btn-secondary"
                >
                  Copy All
                </button>
              </div>

              <div className="warning">
                <strong>Important:</strong> Each backup code can only be used once. 
                After using a code, it will no longer be valid.
              </div>
            </div>
          )}

          <div className="setup-actions">
            <button 
              type="button"
              onClick={handleComplete}
              className="btn btn-primary"
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}