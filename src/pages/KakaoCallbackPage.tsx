// src/pages/KakaoCallbackPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { token } from '@/apis/auth/token';
import { http } from '@/apis/http';
import { KAKAO_REDIRECT_URI } from '@/libs/config';
import { isAxiosError } from 'axios';
import { useSnackBar } from '@/providers/SnackBarProvider';
import { generateKakaoNickname } from '@/utils/generateKakaoNickname';
import { Spinner } from '@/components/common/Spinner';
import { ROUTES } from '@/constants/routes';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const KakaoCallbackPage = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const { showSnack } = useSnackBar();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleKakaoCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        showSnack('카카오 인증에 실패했습니다.', 'error', {
          onClose: () => navigate(ROUTES.login, { replace: true }),
        });
        return;
      }

      // 회원가입 모드인지 확인
      const isKakaoSignUpMode = sessionStorage.getItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE) === 'true';
      console.log('✅isKakaoSignUpMode:', isKakaoSignUpMode);

      try {
        const requestData = {
          token: code,
          redirectUri: KAKAO_REDIRECT_URI,
        };

        if (isKakaoSignUpMode) {
          const kakaoNickname = generateKakaoNickname();

          const signUpResponse = await http.post('/oauth/sign-up/kakao', {
            nickname: kakaoNickname,
            ...requestData,
          });

          // 세션 스토리지 정리
          sessionStorage.removeItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE);
          console.log('✅🔥isKakaoSignUpMode:', isKakaoSignUpMode);

          token.setTokens(signUpResponse.data.accessToken, signUpResponse.data.refreshToken);
          showSnack(
            `${kakaoNickname}님, 환영합니다! 닉네임은 언제든 수정할 수 있어요.`,
            'success',
            { duration: 1500 }
          );
          navigate(ROUTES.home, { replace: true });
        } else {
          // 로그인 모드
          const response = await http.post('/oauth/sign-in/kakao', requestData);

          token.setTokens(response.data.accessToken, response.data.refreshToken);
          showSnack('로그인에 성공했습니다.', 'success');
          navigate(ROUTES.home, { replace: true });
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403 && !isKakaoSignUpMode) {
          // 로그인 모드에서 가입되지 않은 사용자
          console.log('😀isKakaoSignUpMode:', isKakaoSignUpMode);

          showSnack('가입되지 않은 사용자입니다. 회원가입을 진행해주세요.', 'error', {
            onClose: () => navigate(ROUTES.signup, { replace: true }),
          });
        } else {
          // 에러 시 세션 정리
          sessionStorage.removeItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE);
          console.log('😀🔥isKakaoSignUpMode:', isKakaoSignUpMode);

          const errorMessage =
            isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : '카카오 처리에 실패했습니다.';

          showSnack(errorMessage, 'error', { duration: 1000 });
          navigate(ROUTES.login, { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleKakaoCallback();
  }, [navigate, showSnack]);

  return (
    <div className='flex h-screen items-center justify-center'>
      {isLoading && (
        <div className='flex flex-col items-center gap-4'>
          <Spinner size={48} />
          <div className='text-lg font-medium'>카카오 로그인 처리 중</div>
          <div className='text-sm text-gray-500'>잠시만 기다려주세요.</div>
        </div>
      )}
    </div>
  );
};

export default KakaoCallbackPage;
