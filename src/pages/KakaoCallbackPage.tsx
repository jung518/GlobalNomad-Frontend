// src/pages/KakaoCallbackPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { token } from '@/apis/auth/token';
import { http } from '@/apis/http';
import { KAKAO_REDIRECT_URI } from '@/libs/config';
import { isAxiosError } from 'axios';
import { useSnackBar } from '@/providers/SnackBarProvider';
import { generateKakaoNickname } from '@/utils/generateKakaoNickname';
import { getApiErrorMessage } from '@/utils/errorMessages';
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

    //카카오 회원가입: 랜덤 닉네임으로 계정 생성 + 토큰 저장 + 홈으로 이동
    const signUpWithKakao = async (code: string) => {
      const kakaoNickname = generateKakaoNickname();

      const signUpResponse = await http.post('/oauth/sign-up/kakao', {
        nickname: kakaoNickname,
        token: code,
        redirectUri: KAKAO_REDIRECT_URI,
      });

      sessionStorage.removeItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE);
      token.setTokens(signUpResponse.data.accessToken, signUpResponse.data.refreshToken);
      showSnack(`${kakaoNickname}님, 환영합니다! 닉네임은 언제든 수정할 수 있어요.`, 'success', {
        duration: 1500,
      });
      navigate(ROUTES.home, { replace: true });
    };

    //카카오 로그인: 토큰 저장 + 홈으로 이동
    const signInWithKakao = async (code: string) => {
      const response = await http.post('/oauth/sign-in/kakao', {
        token: code,
        redirectUri: KAKAO_REDIRECT_URI,
      });

      token.setTokens(response.data.accessToken, response.data.refreshToken);
      showSnack('로그인에 성공했습니다.', 'success');
      navigate(ROUTES.home, { replace: true });
    };

    //회원가입/로그인 흐름 공통 에러 처리
    const handleKakaoCallbackError = (error: unknown, isKakaoSignUpMode: boolean) => {
      const isUnregisteredLoginAttempt =
        isAxiosError(error) && error.response?.status === 403 && !isKakaoSignUpMode;

      if (isUnregisteredLoginAttempt) {
        // 로그인 모드에서 아직 가입되지 않은 사용자 -> 회원가입 유도
        showSnack('가입되지 않은 사용자입니다. 회원가입을 진행해주세요.', 'error', {
          onClose: () => navigate(ROUTES.signup, { replace: true }),
        });
        return;
      }

      sessionStorage.removeItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE);
      showSnack(getApiErrorMessage(error, '카카오 처리에 실패했습니다.'), 'error', {
        duration: 1000,
      });
      navigate(ROUTES.login, { replace: true });
    };

    const handleKakaoCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        showSnack('카카오 인증에 실패했습니다.', 'error', {
          onClose: () => navigate(ROUTES.login, { replace: true }),
        });
        return;
      }

      const isKakaoSignUpMode = sessionStorage.getItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE) === 'true';

      try {
        if (isKakaoSignUpMode) {
          await signUpWithKakao(code);
        } else {
          await signInWithKakao(code);
        }
      } catch (error) {
        handleKakaoCallbackError(error, isKakaoSignUpMode);
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
