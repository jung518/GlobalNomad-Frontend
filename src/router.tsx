import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/common/Layout.tsx';
import MainPage from '@/pages/MainPage.tsx';
import LoginPage from '@/pages/LoginPage.tsx';
import NotFoundPage from '@/pages/NotFoundPage.tsx';
import ActivityDetailPage from '@/pages/ActivityDetailPage.tsx';
import MyPageLayout from '@/pages/MyPageLayout.tsx';
import CreateActivityPage from '@/pages/CreateActivityPage.tsx';
import EditActivityPage from '@/pages/EditActivityPage.tsx';
import SignupPage from '@/pages/SignupPage.tsx';
import KakaoCallbackPage from '@/pages/KakaoCallbackPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <NotFoundPage />,
    children: [
      {
        // Layout을 사용하는 보호된 라우트
        element: <Layout />,
        children: [
          { index: true, element: <MainPage /> },
          { path: 'activities/:activityId', element: <ActivityDetailPage /> },
          { path: 'mypage', element: <MyPageLayout /> },
          { path: 'activities/create', element: <CreateActivityPage /> },
          { path: 'activities/edit/:activityId', element: <EditActivityPage /> },
        ],
      },
      // Layout 없는 인증 페이지들
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      {
        path: '/oauth/kakao',
        element: <KakaoCallbackPage />,
      },
    ],
  },
]);
