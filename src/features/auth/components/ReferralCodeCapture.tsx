import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * This component captures the referral code from URL (?ref=CODE)
 * and stores it in localStorage so it persists across navigation.
 * Should be rendered near the root of the app.
 */
export function ReferralCodeCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      // Only save if there isn't already a pending code
      // (avoid overwriting with different codes during a session)
      const existingCode = localStorage.getItem('pending_referral_code');
      if (!existingCode) {
        localStorage.setItem('pending_referral_code', refCode.toUpperCase());
        console.log('Referral code captured from URL:', refCode.toUpperCase());
      }
    }
  }, [searchParams]);

  return null;
}
