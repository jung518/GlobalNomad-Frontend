import { Down, User } from '@/assets/icons';
import Avatar from '@/components/common/Avatar';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/hooks/queries/useLogoutMutation';
import { useProfileImageStore } from '@/stores/profileImageStore';
import { ROUTES } from '@/constants/routes';

interface Props {
  userName?: string; // optional로 변경
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
}

export const HeaderUserMenu = ({
  userName,
  isOpen,
  onToggle,
  onClose,
  onLogin,
  onSignUp,
}: Props) => {
  const isLoggedIn = !!userName; // userName이 있으면 로그인 상태
  const navigate = useNavigate();
  const { mutate: logout, isPending } = useLogoutMutation();
  const resetProfileImage = useProfileImageStore((state) => state.reset);

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        resetProfileImage();
        navigate(ROUTES.home);
        onClose();
      },
    });
  };

  const handleMyPage = () => {
    navigate('/mypage');
    onClose();
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      console.warn('onLogin prop이 제공되지 않았습니다.');
    }
    onClose();
  };
  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      console.warn('onSignUp prop이 제공되지 않았습니다.');
    }
    onClose();
  };

  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    return (
      <div className='relative'>
        <button
          onClick={handleLogin}
          className='font-md-medium hover:text-primary-500 cursor-pointer rounded-lg px-4 py-2 text-gray-950'>
          로그인
        </button>
        <button
          onClick={handleSignUp}
          className='font-md-medium hover:text-primary-500 cursor-pointer rounded-lg px-4 py-2 text-gray-950'>
          회원가입
        </button>
      </div>
    );
  }

  // 로그인한 경우
  return (
    <div className='relative'>
      <button
        onClick={onToggle}
        className='flex cursor-pointer items-center space-x-2 rounded-lg px-1 py-2'
        aria-expanded={isOpen}
        aria-haspopup='true'>
        <Avatar />
        <span className='font-md-medium text-gray-950'>{userName}</span>
        <Down className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg bg-white text-gray-950 shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-shadow duration-200'>
          <button
            onClick={handleMyPage}
            className='hover:bg-primary-100 font-sm-medium flex w-full cursor-pointer items-center space-x-2 px-4 py-3 text-left'>
            <User className='h-4 w-4' />
            <span>마이페이지</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className='hover:bg-primary-100 font-sm-medium flex w-full cursor-pointer items-center space-x-2 border-t border-gray-100 px-4 py-3 text-left'>
            <LogOut className='h-4 w-4' />
            <span>{isPending ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
