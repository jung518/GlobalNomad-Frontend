import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileImageStore } from '@/stores/profileImageStore';
import { PrimaryButton } from '@/components/common/button';
import { PasswordInput, TextInput } from '@/components/common/input';
import Title from '@/components/common/Title';
import MyPageMobileToggle from '@/components/common/MyPageMobileToggle';
import { useEditMyInfoMutation } from '@/hooks/queries/useEditMyInfoMutation';
import { uploadImageToServer } from '@/apis/upload';
import type { User, UserEditRequest } from '@/apis/type';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type FormValues = {
  nickname: string;
  email: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export default function MyProfilePage({ mobileOpen, setMobileOpen }: Props) {
  const { file, setFile, setProfileImageUrl } = useProfileImageStore();
  const { user: myInfo } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  useEffect(() => {
    if (!myInfo) {
      return;
    }
    reset({
      nickname: myInfo.nickname,
      email: myInfo.email,
      newPassword: '',
      newPasswordConfirm: '',
    });
    setProfileImageUrl(myInfo.profileImageUrl ?? '');
  }, [myInfo, reset, setProfileImageUrl]);

  const nickname = watch('nickname');
  const newPassword = watch('newPassword');
  const newPasswordConfirm = watch('newPasswordConfirm');
  const editMyInfoMutation = useEditMyInfoMutation((data: User) => {
    setProfileImageUrl(data.profileImageUrl ?? '');
    setFile(null);
    reset({
      nickname: data.nickname,
      email: data.email,
      newPassword: '',
      newPasswordConfirm: '',
    });
    setTimeout(() => navigate('/'), 3000);
  });
  const isFormChanged = useMemo(() => {
    if (!myInfo) {
      return false;
    }
    const isNicknameChanged = nickname?.trim() !== '' && nickname !== myInfo.nickname;
    const isPasswordChanged = newPassword?.trim() !== '' || newPasswordConfirm?.trim() !== '';
    const isImageChanged = !!file;
    return isNicknameChanged || isPasswordChanged || isImageChanged;
  }, [nickname, newPassword, newPasswordConfirm, file, myInfo]);
  const onSubmit = async (values: FormValues) => {
    if (!myInfo) {
      return;
    }
    const payload: Partial<UserEditRequest> = {};

    if (values.nickname.trim() && values.nickname !== myInfo.nickname) {
      payload.nickname = values.nickname.trim();
    }
    if (values.newPassword.trim()) {
      payload.newPassword = values.newPassword.trim();
    }
    if (file) {
      payload.profileImageUrl = await uploadImageToServer(file);
    }
    if (Object.keys(payload).length === 0) {
      return;
    }
    editMyInfoMutation.mutate(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex w-full max-w-160 flex-col gap-5 md:gap-6'>
      <MyPageMobileToggle
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        burgerClassName='z-80 block h-6 w-6 cursor-pointer text-gray-900 md:hidden'
      />

      <div className='flex flex-col items-start gap-2.5 py-2.5'>
        <Title as='h3' size='xl' weight='bold'>
          내 정보
        </Title>

        <div className='font-md-medium text-gray-500'>
          닉네임과 비밀번호, 프로필 이미지를 수정하실 수 있습니다.
        </div>
      </div>
      <div className='flex flex-col gap-4.5 md:gap-6'>
        <TextInput
          label='닉네임'
          autoComplete='nickname'
          maxLength={8}
          {...register('nickname', {
            maxLength: { value: 8, message: '닉네임은 8자 이내로 입력해주세요' },
          })}
        />
        <TextInput
          label='이메일'
          type='email'
          autoComplete='email'
          placeholder={myInfo?.email ?? ''}
          disabled
          className='cursor-not-allowed bg-gray-50 text-gray-400'
          {...register('email')}
        />
        <PasswordInput
          label='비밀번호'
          placeholder='8자 이상 입력해 주세요.'
          autoComplete='new-password'
          {...register('newPassword', {
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/,
              message: '8자 이상, 영문과 숫자를 포함해야 됩니다.',
            },
          })}
          error={!!errors.newPassword}
          errorMessage={errors.newPassword?.message}
        />
        <PasswordInput
          label='비밀번호 확인'
          placeholder='비밀번호를 한 번 더 입력해주세요'
          autoComplete='new-password'
          {...register('newPasswordConfirm', {
            validate: (value) =>
              !newPassword || value === newPassword || '비밀번호가 일치하지 않습니다',
          })}
          error={!!errors.newPasswordConfirm}
          errorMessage={errors.newPasswordConfirm?.message}
        />
      </div>
      <div className='flex justify-center'>
        <PrimaryButton
          type='submit'
          disabled={!isFormChanged || !isValid}
          className='font-lg-bold md:font-md-bold mt-8 mb-3 h-12 w-full rounded-[14px] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 md:mt-6 md:h-[41px] md:w-30 md:rounded-xl lg:w-auto lg:max-w-160'>
          수정하기
        </PrimaryButton>
      </div>
    </form>
  );
}
