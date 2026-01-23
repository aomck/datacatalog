import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth-actions';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  // If already authenticated, redirect to app
  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect('/app/catalog');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-4xl w-full mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Data Catalog
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              ระบบจัดการข้อมูลแค็ตตาล็อก
            </p>
            <p className="text-lg text-gray-500">
              Information System Operation Center (ISOC)
            </p>
          </div>

          <div className="mb-12">
            <div className="w-24 h-24 bg-primary-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-primary-900 mb-2">
                  📊 จัดการข้อมูล
                </h3>
                <p className="text-sm text-gray-600">
                  จัดเก็บและจัดการข้อมูลแค็ตตาล็อกอย่างเป็นระบบ
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-primary-900 mb-2">
                  🔐 ความปลอดภัย
                </h3>
                <p className="text-sm text-gray-600">
                  ระบบจัดการสิทธิ์และการเข้าถึงข้อมูลที่ปลอดภัย
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-primary-900 mb-2">
                  ⚡ ใช้งานง่าย
                </h3>
                <p className="text-sm text-gray-600">
                  ออกแบบมาเพื่อความสะดวกและง่ายต่อการใช้งาน
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full max-w-md mx-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              เข้าสู่ระบบ
            </Link>
            <p className="text-sm text-gray-500">
              ใช้บัญชีองค์กรของคุณเพื่อเข้าสู่ระบบ
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
