import { Outlet, useNavigate } from 'react-router-dom';
import Footer from './Footer/Footer';
import { Header } from '@/components/common/Header/Header';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';

const Layout = () => {
  const navigate = useNavigate();

  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const user = useAuthStore((state) => state.user);

  // 초기화 전에는 로딩 화면 표시
  if (!isInitialized) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-gray-500'>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        userName={user?.nickname}
        onLogin={() => navigate(ROUTES.login)}
        onSignUp={() => navigate(ROUTES.signup)}
      />
      <Outlet />
      <Footer />
    </>
  );
};
export default Layout;
