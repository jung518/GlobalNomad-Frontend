import Card from '@/components/common/card';
import Title from '@/components/common/Title';
import { Earth } from '@/assets/icons';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '@/components/common/button';
import CancelReservationModal from '@/components/common/modal/CancelReservationModal';
import MyPageMobileToggle from '@/components/common/MyPageMobileToggle';
import { useState } from 'react';
import { useDeleteActivityMutation } from '@/hooks/queries/useDeleteActivityMutation';
import { useMyActivitiesInfinite } from '@/hooks/queries/useMyActivitiesInfinite';
import { useInfiniteScrollObserver } from '@/hooks/useInfiniteScrollObserver';
import { ROUTES } from '@/constants/routes';

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function MyExperiencesPage({ setMobileOpen, mobileOpen }: Props) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const navigate = useNavigate();
  // 무한 스크롤 훅
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyActivitiesInfinite();
  const activities = data?.pages.flatMap((page) => page.activities) ?? [];
  const bottomRef = useInfiniteScrollObserver({ hasNextPage, isFetchingNextPage, fetchNextPage });

  // 삭제 버튼 클릭
  const handleDelete = (id: number) => {
    setSelectedActivityId(id);
    setIsCancelModalOpen(true);
  };

  // 삭제 뮤테이션
  const { mutate: deleteMutate } = useDeleteActivityMutation(
    () => setIsCancelModalOpen(false),
    () => setSelectedActivityId(null)
  );

  const handleConfirmCancel = () => {
    if (selectedActivityId !== null) {
      deleteMutate(selectedActivityId);
    }
  };

  if (isLoading) {
    return <div className='px-4 py-10'>로딩 중...</div>;
  }
  if (isError) {
    return <div className='px-4 py-10'>데이터를 불러오지 못했습니다.</div>;
  }

  return (
    <div className='flex w-full max-w-160 flex-col gap-3.5'>
      <MyPageMobileToggle mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className='mb-7.5 flex flex-col gap-3 py-2.5 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-col gap-2.5'>
          <Title as='h3' size='xl' weight='bold'>
            내 체험 관리
          </Title>
          <div className='font-md-medium text-gray-500'>
            내가 등록한 체험을 수정하거나 삭제할 수 있습니다.
          </div>
        </div>
        <PrimaryButton
          onClick={() => navigate(ROUTES.activityCreate)}
          className='font-lg-bold md:h-12 md:w-34.5'>
          체험 등록하기
        </PrimaryButton>
      </div>
      {activities.length === 0 ? (
        <div className='mt-8 flex flex-col items-center justify-center gap-7.5'>
          <Earth />
          <div className='font-xl-medium text-center whitespace-nowrap text-gray-600'>
            아직 등록한 체험이 없어요
          </div>
        </div>
      ) : (
        <div className='mb-3 flex flex-col gap-7.5 lg:gap-6'>
          {activities.map((activity) => (
            <Card key={activity.id} variant='list'>
              <div className='flex w-full items-stretch justify-between'>
                <Card.Content className='flex flex-1 flex-col justify-center'>
                  <Card.Title title={activity.title} className='mb-1.5 lg:mb-2' />
                  <Card.Rating
                    rating={activity.rating}
                    reviewCount={activity.reviewCount}
                    className='mb-2.5 lg:mb-3'
                  />
                  <Card.Price price={activity.price} className='mb-2.5 lg:mb-5' />
                  <Card.CardButton
                    onEdit={() => navigate(ROUTES.activityEdit(activity.id))}
                    onDelete={() => handleDelete(activity.id)}
                  />
                </Card.Content>
                <Card.Image src={activity.bannerImageUrl} alt={activity.title} />
              </div>
            </Card>
          ))}
          <div ref={bottomRef} className='h-1' />
        </div>
      )}
      <CancelReservationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        cancelText='아니요'
        confirmText='예'>
        삭제하시겠습니까?
      </CancelReservationModal>
    </div>
  );
}
