import { useEffect, useState } from 'react';
import Card from '@/components/common/card';
import CancelReservationModal from '@/components/common/modal/CancelReservationModal';
import ReviewModal from '@/components/common/modal/ReviewModal';
import { FilterButton, PrimaryButton } from '@/components/common/button';
import Title from '@/components/common/Title';
import { Earth } from '@/assets/icons';
import MyPageMobileToggle from '@/components/common/MyPageMobileToggle';
import type { MyReservationsResponse } from '@/apis/type';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMyReservationsInfinite } from '@/hooks/queries/useMyReservationsQuery';
import { useCancelReservationMutation } from '@/hooks/queries/useCancelReservationMutation';
import { useReviewReservationMutation } from '@/hooks/queries/useReviewReservationMutation';
import { useInfiniteScrollObserver } from '@/hooks/useInfiniteScrollObserver';
import { ROUTES } from '@/constants/routes';
import type { ReservationStatusWithCanceled } from '@/types/reservation';

// ReservationStatusWithCanceled와 어긋나면 타입 에러로 바로 드러나도록 satisfies로 검증
const STATUS_LIST = [
  'confirmed',
  'canceled',
  'declined',
  'completed',
  'pending',
] as const satisfies readonly ReservationStatusWithCanceled[];

const STATUS_TEXT_MAP: Record<Status, string> = {
  confirmed: '예약 완료',
  canceled: '예약 취소',
  declined: '예약 거절',
  completed: '체험 완료',
  pending: '예약 대기',
};

type Status = (typeof STATUS_LIST)[number];
type SelectedStatus = 'all' | Status;
type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
type ReservationItem = MyReservationsResponse['reservations'][number];

export default function ReservationPage({ setMobileOpen, mobileOpen }: Props) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); // 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null); // 선택된 예약 정보
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [searchParams, setSearchParams] = useSearchParams(); // 필터 상태
  const rawStatus = searchParams.get('status');
  const navigate = useNavigate();
  const statusParam: SelectedStatus =
    rawStatus && STATUS_LIST.includes(rawStatus as Status) ? (rawStatus as Status) : 'all';

  const isReviewModalClose = () => setIsReviewModalOpen(false); // 리뷰 모달 닫기
  const [selected, setSelected] = useState<SelectedStatus>(statusParam);

  useEffect(() => {
    setSelected(statusParam);
  }, [statusParam]);

  const updateSearchParams = (status: SelectedStatus) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'reservation');
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    setSearchParams(params);
  };

  const handleFilterClick = (status: Status) => {
    setSelected(status);
    updateSearchParams(status);
  };
  const handleAllClick = () => {
    setSelected('all');
    updateSearchParams('all');
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyReservationsInfinite(selected);
  const bottomRef = useInfiniteScrollObserver({ hasNextPage, isFetchingNextPage, fetchNextPage });
  const allFetchedReservations = data?.pages.flatMap((page) => page.reservations) ?? [];
  const { data: allData } = useMyReservationsInfinite('all');
  const hasAnyReservation = allData?.pages.some((page) => page.reservations.length > 0) ?? false;

  // 클라이언트에서 체험 완료로 자동 변환
  const rawReservations = allFetchedReservations.map((res) => {
    const now = new Date();
    const endDateTime = new Date(`${res.date}T${res.endTime}`);
    if (res.status === 'confirmed' && now > endDateTime) {
      return { ...res, status: 'completed' as const };
    }
    return res;
  });

  // 선택된 상태 필터 적용 + 최신순 정렬
  const reservations = rawReservations
    .filter((res) => {
      if (selected === 'all') {
        return true;
      }
      return res.status === selected;
    })
    .sort((a, b) => {
      // 날짜 최신순 (DESC)
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      // 같은 날짜면 시작시간 최신순 (DESC)
      return b.startTime.localeCompare(a.startTime);
    });

  // 후기 작성 버튼 클릭
  const handleReviewClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
    setIsReviewModalOpen(true);
  };

  // 후기 제출
  const handleSubmitReview = (data: { rating: number; content: string }) => {
    if (!selectedReservation) {
      return;
    }
    reviewMutate({
      reservationId: selectedReservation.id,
      data,
    });
  };
  // 후기 작성
  const { mutate: reviewMutate } = useReviewReservationMutation(() => setIsReviewModalOpen(false));

  // 예약 취소 버튼 클릭
  const handleCancelClick = (id: number) => {
    setSelectedReservationId(id);
    setIsCancelModalOpen(true);
  };

  const { mutate: cancelMutate } = useCancelReservationMutation(
    () => setIsCancelModalOpen(false),
    () => setSelectedReservationId(null)
  );

  // 예약 취소 확정
  const handleConfirmCancel = () => {
    if (!selectedReservationId) {
      return;
    }
    cancelMutate(selectedReservationId);
  };

  if (isLoading) {
    return <div className='px-4 py-10'>로딩 중...</div>;
  }
  if (isError) {
    return <div className='px-4 py-10'>예약 내역을 불러오지 못했어요.</div>;
  }

  return (
    <div className='flex w-full max-w-160 flex-col gap-3.5'>
      <MyPageMobileToggle mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className='flex max-w-160 flex-col items-start gap-2.5 py-2.5'>
        <Title as='h3' size='xl' weight='bold'>
          예약내역
        </Title>
        <div className='font-md-medium text-gray-500'>예약내역 변경 및 취소할 수 있습니다.</div>
      </div>
      {hasAnyReservation && (
        <div className='scrollbar-hide mr-6 flex flex-nowrap gap-2 overflow-x-auto pb-[13px] md:pb-7.5'>
          <FilterButton selected={selected === 'all'} onClick={handleAllClick}>
            전체
          </FilterButton>
          {STATUS_LIST.map((s) => (
            <FilterButton key={s} selected={selected === s} onClick={() => handleFilterClick(s)}>
              {STATUS_TEXT_MAP[s]}
            </FilterButton>
          ))}
        </div>
      )}
      {reservations.length === 0 ? (
        <div className='mt-8 flex flex-col items-center justify-center gap-7.5'>
          <div className='flex flex-col items-center justify-center'>
            <Earth className='mb-7.5' />
            <div className='font-xl-medium text-center whitespace-nowrap text-gray-600'>
              아직 예약한 체험이 없어요
            </div>
          </div>
          <PrimaryButton
            className='font-lg-medium h-13.5 w-45.5 rounded-2xl px-10 py-3.5'
            onClick={() => navigate(ROUTES.home)}>
            둘러보기
          </PrimaryButton>
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-7.5 lg:gap-6'>
            {reservations.map((item, idx) => {
              const prev = reservations[idx - 1];
              const isDateChanged = idx !== 0 && prev?.date !== item.date; // ✅ 날짜 경계

              return (
                <div key={item.id} className='flex flex-col'>
                  {/* ✅ 날짜가 바뀌는 “경계”에만 구분선 */}
                  {isDateChanged && <div className='my-6 h-px w-full bg-gray-50' />}

                  <Card variant='reservation'>
                    <div className='mt-5 mb-3 ml-2 lg:hidden'>
                      <Card.Schedule
                        date={item.date}
                        startTime={item.startTime}
                        endTime={item.endTime}
                        isMobileDate
                      />
                    </div>

                    <div className='flex flex-row'>
                      <Card.Content>
                        <Card.Badge status={item.status} />
                        <Card.Title title={item.activity.title} />
                        <div className='font-sm-medium text-gray-500 lg:hidden'>
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className='hidden lg:block'>
                          <Card.Schedule
                            date={item.date}
                            startTime={item.startTime}
                            endTime={item.endTime}
                          />
                        </div>
                        <div className='flex w-full items-center justify-between'>
                          <Card.Price price={item.totalPrice} headCount={item.headCount} />
                          <div className='hidden lg:flex'>
                            <Card.CardButton
                              status={item.status}
                              onReviewClick={() => handleReviewClick(item)}
                              onCancelClick={() => handleCancelClick(item.id)}
                              reviewSubmitted={
                                item.status === 'completed' ? item.reviewSubmitted : undefined
                              }
                            />
                          </div>
                        </div>
                      </Card.Content>
                      <Card.Image src={item.activity.bannerImageUrl} alt={item.activity.title} />
                    </div>

                    <div className='lg:hidden'>
                      <Card.CardButton
                        status={item.status}
                        onReviewClick={() => handleReviewClick(item)}
                        onCancelClick={() => handleCancelClick(item.id)}
                        reviewSubmitted={
                          item.status === 'completed' ? item.reviewSubmitted : undefined
                        }
                      />
                    </div>
                  </Card>
                </div>
              );
            })}

            <div ref={bottomRef} className='h-1' />
          </div>
        </>
      )}

      <CancelReservationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        cancelText='아니요'
        confirmText='예약 취소'>
        예약을 취소하시겠습니까?
      </CancelReservationModal>
      {selectedReservation && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={isReviewModalClose}
          title={selectedReservation.activity.title}
          date={selectedReservation.date}
          startTime={selectedReservation.startTime}
          endTime={selectedReservation.endTime}
          headCount={selectedReservation.headCount}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
