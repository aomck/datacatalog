'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Alert } from '@mui/material';
import { tokenAuthAction } from '@/lib/auth-actions';

export default function TokenAuthPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const token = params.token as string;

        if (!token) {
          setError('Token is required');
          setLoading(false);
          return;
        }

        // Call server action to validate token and set cookies
        const result = await tokenAuthAction(token);

        if (result.success) {
          // Redirect to catalog page
          router.push('/app/catalog');
          router.refresh();
        } else {
          setError(result.message);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please try again.');
        setLoading(false);
      }
    };

    authenticate();
  }, [params.token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        {loading ? (
          <div className="text-center">
            <CircularProgress size={60} />
            <p className="mt-4 text-gray-600 text-lg">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        ) : error ? (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
