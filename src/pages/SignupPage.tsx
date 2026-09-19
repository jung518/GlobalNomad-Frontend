// src/pages/SignupPage.tsx
import { kakaoApi } from '@/apis/kakao';
import { KakaoLogin } from '@/assets/images';
import { Logo } from '@/components/common/Logo';
import { PrimaryButton, SecondaryButton } from '@/components/common/button';
import { PasswordInput, TextInput } from '@/components/common/input';
import { useSignupForm } from '@/hooks/useSignupForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const SignupPage = () => {
  const { registerOptions, errors, isSubmitting, isFormValid, handleSubmit, getErrorMessage } =
    useSignupForm();

  const handleKakaoSignup = () => {
    // 카카오 회원가입 모드로 설정
    sessionStorage.setItem(STORAGE_KEYS.KAKAO_SIGNUP_MODE, 'true');

    const kakaoAuthUrl = kakaoApi.getKakaoAuthUrl('sign-up');
    window.location.href = kakaoAuthUrl;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mx-auto my-15 flex max-w-82 flex-col items-center justify-center sm:my-30 sm:max-w-160'>
      <Logo
        direction='vertical'
        iconClassName='h-[144px] w-[144px] mb-6'
        titleClassName='h-[31px] w-[255px]'
        className='mb-15.5'
      />
      <div className='flex w-full flex-col items-center gap-7.5'>
        <div className='flex w-full flex-col items-center justify-center gap-5'>
          {/* 이메일 */}
          <TextInput
            label='이메일'
            type='email'
            autoComplete='email'
            placeholder='이메일을 입력해주세요'
            {...registerOptions.email}
            error={!!errors.email}
            errorMessage={getErrorMessage(errors.email)}
          />

          {/* 닉네임 */}
          <TextInput
            label='닉네임'
            autoComplete='username'
            placeholder='닉네임을 입력해 주세요'
            {...registerOptions.nickname}
            error={!!errors.nickname}
            errorMessage={getErrorMessage(errors.nickname)}
          />

          {/* 비밀번호 */}
          <PasswordInput
            label='비밀번호'
            autoComplete='new-password'
            placeholder='8자 이상 입력해주세요'
            {...registerOptions.password}
            error={!!errors.password}
            errorMessage={getErrorMessage(errors.password)}
          />

          {/* 비밀번호 확인 */}
          <PasswordInput
            label='비밀번호 확인'
            autoComplete='new-password'
            placeholder='비밀번호를 한 번 더 입력해 주세요'
            {...registerOptions.passwordConfirm}
            error={!!errors.passwordConfirm}
            errorMessage={getErrorMessage(errors.passwordConfirm)}
          />
        </div>

        <PrimaryButton
          type='submit'
          disabled={!isFormValid || isSubmitting}
          className='font-lg-bold w-full'>
          {isSubmitting ? '처리 중...' : '회원가입하기'}
        </PrimaryButton>

        <div className='font-lg-medium flex w-full items-center justify-around gap-4 text-gray-500'>
          <div className='h-px flex-1 bg-gray-300'></div>
          <div>SNS 계정으로 회원가입하기</div>
          <div className='h-px flex-1 bg-gray-300'></div>
        </div>

        <SecondaryButton type='button' className='w-full' onClick={handleKakaoSignup}>
          <div className='flex items-center gap-2 text-gray-600'>
            <img src={KakaoLogin} alt='카카오 로그인 버튼' className='h-6 w-6' />
            카카오 회원가입
          </div>
        </SecondaryButton>

        <div className='text-gray-400'>
          회원이신가요?{' '}
          <Link to={ROUTES.login} className='underline'>
            로그인하기
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignupPage;
