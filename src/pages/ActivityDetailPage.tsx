import 'react-day-picker/dist/style.css';
import '@/styles/day-picker.css';
import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isDateAvailable, toYmd } from '@/utils/dateUtils';
import Title from '@/components/common/Title';
import { PrimaryButton } from '@/components/common/button/PrimaryButton';
import { TimeSelectButton } from '@/components/common/button/TimeSelectButton';
import { DayPicker } from 'react-day-picker';
import BottomSheet from '@/components/common/modal/BottomSheet';
import CancelReservationModal from '@/components/common/modal/CancelReservationModal';
import AlertModal from '@/components/common/modal/AlertModal';
import ActivityInfo from './ActivityDetail/ActivityInfo';
import ActivityImageGallery from './ActivityDetail/ActivityImageGallery';
import ActivityReservationPanel from './ActivityDetail/ActivityReservationPanel';
import ActivityMobileReservationBar from './ActivityDetail/ActivityMobileReservationBar';
import ActivityReviews from './ActivityDetail/ActivityReviews';
import ActivityMap from './ActivityDetail/ActivityMap';
import { useActivityDetail } from '@/hooks/queries/useActivityDetail';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useDeleteActivityMutation } from '@/hooks/queries/useDeleteActivityMutation';
import { useSnackBar } from '@/providers/SnackBarProvider';
import { createActivityReservation, getActivitySchedules } from '@/apis/activity';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivityScheduleResponse } from '@/apis/type';
import { ArrowDown } from '@/assets/icons';
import { truncateBySentence } from '@/utils/truncateBySentence';
import { dayPickerKoreanProps } from '@/utils/dateUtils';

const SHORT_DESCRIPTION_MAX_LENGTH = 100;

function ActivityDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnack } = useSnackBar();

  // URL에서 activityId 가져오기
  const { activityId } = useParams<{ activityId: string }>();

  // 현재 로그인한 사용자 정보 (useShallow로 리렌더링 최적화)
  const { user, isAuthenticated } = useAuthStore(
    useShallow((state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }))
  );

  // API 데이터 불러오기
  const { data: activity, isLoading, isError } = useActivityDetail(Number(activityId));

  // 예약 관련 상태
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null); // scheduleId로 변경
  const [participantCount, setParticipantCount] = useState(1);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // 삭제 확인 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 알림 모달 상태
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  // 캘린더에서 보고 있는 월 상태 (API 호출에 사용)
  const [viewedMonth, setViewedMonth] = useState<Date>(new Date());

  // 현재 보고 있는 월의 연/월 계산
  const currentYear = viewedMonth.getFullYear();
  const currentMonth = viewedMonth.getMonth() + 1;

  // 예약 가능일 조회
  const { data: schedules, isFetched: isScheduleLoaded } = useQuery({
    queryKey: ['activitySchedules', activityId, currentYear, currentMonth],
    queryFn: () =>
      getActivitySchedules({
        activityId: Number(activityId),
        year: currentYear,
        month: currentMonth,
      }),
    enabled: !!activityId,
  });

  // 선택한 날짜에 해당하는 시간대 필터링
  const availableTimeSlots = useMemo(() => {
    if (!schedules || !selectedDate) {
      return [];
    }
    // 타임존 이슈 방지: 로컬 날짜를 YYYY-MM-DD 형식으로 변환
    const dateStr = toYmd(selectedDate);
    const schedule = schedules.find((s: ActivityScheduleResponse) => s.date === dateStr);
    return schedule?.times || [];
  }, [schedules, selectedDate]);

  // 예약 가능한 날짜들 (times 배열에 시간이 있는 날짜만)
  const availableDates = useMemo(() => {
    if (!schedules) {
      return [];
    }
    // times 배열이 존재하고 길이가 1 이상인 날짜만 필터링
    // 타임존 이슈 방지: "2026-01-27" -> new Date(2026, 0, 27)로 변환
    return schedules
      .filter((s: ActivityScheduleResponse) => s.times && s.times.length > 0)
      .map((s: ActivityScheduleResponse) => {
        const [year, month, day] = s.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  }, [schedules]);

  // 본인의 체험인지 확인
  const isOwner = useMemo(() => {
    if (!activity || !user) {
      return false;
    }
    return activity.userId === user.id;
  }, [activity, user]);

  // 예약 mutation
  const reservationMutation = useMutation({
    mutationFn: () =>
      createActivityReservation(Number(activityId), {
        scheduleId: selectedTimeSlot!,
        headCount: participantCount,
      }),
    onSuccess: () => {
      showSnack('예약이 완료되었습니다!', 'success');
      queryClient.invalidateQueries({ queryKey: ['activitySchedules'] });
      // 상태 초기화
      setSelectedDate(undefined);
      setSelectedTimeSlot(null);
      setParticipantCount(1);
      setIsBottomSheetOpen(false);
    },
    onError: (error: unknown) => {
      // 바텀시트 닫기 (AlertModal이 가려지지 않도록)
      setIsBottomSheetOpen(false);
      // API 응답에서 에러 메시지 추출, 없으면 기본 메시지 표시
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '이미 예약된 시간입니다.';
      setAlertModal({ isOpen: true, message: errorMessage });
    },
  });

  // 삭제 mutation (useDeleteActivityMutation 훅 사용)
  const { mutate: deleteMutate } = useDeleteActivityMutation(() => {
    setIsDeleteModalOpen(false);
    navigate('/');
  });

  // 예약 버튼 활성화 조건 (boolean 타입으로 명시)
  const isReservationEnabled = !!(selectedDate && selectedTimeSlot && participantCount > 0);

  // 케밥 메뉴 핸들러
  const handleEdit = () => {
    navigate(`/activities/edit/${activityId}`);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // 삭제 확인 핸들러
  const handleConfirmDelete = () => {
    if (activityId) {
      deleteMutate(Number(activityId));
    }
  };

  // 참가 인원 증감 핸들러
  const handleIncrement = () => {
    setParticipantCount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (participantCount > 1) {
      setParticipantCount((prev) => prev - 1);
    }
  };

  // 예약하기 핸들러 (데스크톱)
  const handleReservation = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!isReservationEnabled) {
      return;
    }
    reservationMutation.mutate();
  };

  // 모바일 예약하기 핸들러 (바텀시트 열기)
  const handleMobileReservation = () => {
    setIsBottomSheetOpen(true);
  };

  // 바텀시트 닫기
  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
  };

  // 알림 모달 닫기 (useCallback으로 메모이제이션)
  const handleCloseAlertModal = useCallback(() => {
    setAlertModal({ isOpen: false, message: '' });
  }, []);

  // 캘린더 월 변경 핸들러
  const handleMonthChange = (date: Date) => {
    setViewedMonth(date);
  };

  // 예약 가능한 날짜인지 확인하는 함수 (useCallback으로 메모이제이션)
  const checkDateAvailable = useCallback(
    (date: Date) => isDateAvailable(date, availableDates),
    [availableDates]
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-200px)] items-center justify-center'>
        <span className='font-lg-medium text-gray-500'>체험 정보를 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (isError || !activity) {
    return (
      <div className='flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4'>
        <span className='font-lg-medium text-gray-700'>체험 정보를 불러올 수 없습니다.</span>
        <span className='font-md-medium text-gray-500'>잠시 후 다시 시도해주세요.</span>
      </div>
    );
  }

  // API 데이터를 컴포넌트에서 사용할 형태로 변환
  // 체험 상세 페이지에서는 subImages만 사용 (최소 1개, 최대 4개)
  const images = activity.subImages.map((img) => img.imageUrl);

  return (
    <div className='w-full'>
      {/* 컨텐츠 래퍼 - 반응형 너비 및 패딩 */}
      <div className='mx-auto w-full max-w-300 px-6 py-6 sm:px-7.5 sm:py-10 lg:px-10'>
        {/* 메인 레이아웃: 좌측 컨텐츠 + 우측 예약 영역 */}
        <div className='flex flex-col gap-6 lg:flex-row lg:gap-6'>
          {/* 좌측 영역 - 체험 정보 */}
          <div className='flex-1 lg:max-w-192.5'>
            {/* 체험 타이틀 및 정보 (모바일/태블릿에서 상단 노출) */}
            <div className='lg:hidden'>
              <ActivityInfo
                category={activity.category}
                title={activity.title}
                rating={activity.rating}
                reviewCount={activity.reviewCount}
                address={activity.address}
                shortDescription={truncateBySentence(
                  activity.description,
                  SHORT_DESCRIPTION_MAX_LENGTH
                )}
                onEdit={handleEdit}
                onDelete={handleDelete}
                variant='mobile'
                showKebabMenu={isOwner}
              />
            </div>

            {/* 체험 이미지 영역 */}
            <ActivityImageGallery images={images} title={activity.title} />

            {/* 체험 설명 */}
            <section className='mb-10'>
              <Title as='h3' size='xl' weight='bold' className='mb-4'>
                체험 설명
              </Title>
              <p className='font-lg-medium leading-[1.8] whitespace-pre-wrap text-gray-800'>
                {activity.description}
              </p>
            </section>

            {/* 오시는 길 */}
            <section className='mb-10 border-t border-gray-100 pt-10'>
              <Title as='h3' size='xl' weight='bold' className='mb-4'>
                오시는 길
              </Title>
              <p className='font-md-medium mb-4 flex items-center gap-1 text-gray-700'>
                <span>{activity.address}</span>
              </p>
              <ActivityMap address={activity.address} />
            </section>

            {/* 후기 영역 */}
            <ActivityReviews activityId={activity.id} />
          </div>

          {/* 우측 영역 - 예약 정보 (데스크톱) */}
          <aside className='hidden lg:block lg:w-[384px]'>
            <div className='sticky top-24'>
              {/* 상단 정보 영역 */}
              <ActivityInfo
                category={activity.category}
                title={activity.title}
                rating={activity.rating}
                reviewCount={activity.reviewCount}
                address={activity.address}
                shortDescription={truncateBySentence(
                  activity.description,
                  SHORT_DESCRIPTION_MAX_LENGTH
                )}
                onEdit={handleEdit}
                onDelete={handleDelete}
                variant='desktop'
                showKebabMenu={isOwner}
              />

              {/* 예약 정보 박스 - 본인 체험이 아닐 때만 표시 */}
              {!isOwner && (
                <ActivityReservationPanel
                  price={activity.price}
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedTimeSlot(null); // 날짜 변경 시 시간 초기화
                  }}
                  selectedTimeSlot={selectedTimeSlot}
                  onSelectTimeSlot={setSelectedTimeSlot}
                  participantCount={participantCount}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onReservation={handleReservation}
                  availableTimeSlots={availableTimeSlots}
                  availableDates={availableDates}
                  isReservationEnabled={isReservationEnabled}
                  isLoading={reservationMutation.isPending}
                  onMonthChange={handleMonthChange}
                  isScheduleLoaded={isScheduleLoaded}
                />
              )}
            </div>
          </aside>
        </div>

        {/* 모바일/태블릿 하단 고정 예약 바 - 본인 체험이 아닐 때만 표시 */}
        {!isOwner && (
          <ActivityMobileReservationBar
            price={activity.price}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            selectedTimeSlotDisplay={(() => {
              const foundSlot = availableTimeSlots.find((slot) => slot.id === selectedTimeSlot);
              return foundSlot ? `${foundSlot.startTime}~${foundSlot.endTime}` : undefined;
            })()}
            onOpenBottomSheet={handleMobileReservation}
            onReservation={handleReservation}
            isReservationEnabled={isReservationEnabled}
          />
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <CancelReservationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        cancelText='아니요'
        confirmText='삭제'>
        정말 삭제하시겠습니까?
      </CancelReservationModal>

      {/* 알림 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={handleCloseAlertModal}
        message={alertModal.message}
      />

      {/* 바텀시트 - 모바일/태블릿 예약 폼 (본인 체험이 아닐 때만 표시) */}
      {!isOwner && (
        <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
          <div className='px-6 py-6 sm:px-7.5'>
            {/* 바텀시트 헤더 */}
            <div className='flex items-center justify-between'>
              <Title as='h3' size='xl' weight='bold'>
                날짜
              </Title>
              <button
                onClick={handleCloseBottomSheet}
                className='font-lg-medium text-gray-600 hover:text-gray-900'>
                ✕
              </button>
            </div>

            {/* 날짜 및 시간 선택 영역 */}
            <div className='mb-6 flex flex-col gap-6 sm:flex-row'>
              {/* 날짜 선택 */}
              <div className='flex-1'>
                <DayPicker
                  {...dayPickerKoreanProps}
                  mode='single'
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTimeSlot(null); // 날짜 변경 시 시간 초기화
                  }}
                  onMonthChange={handleMonthChange}
                  className='font-md-medium w-full rounded-xl bg-white p-4'
                  classNames={{
                    // 캡션 전체(컨테이너)
                    caption: 'relative mb-3 flex items-center justify-center',
                    caption_label:
                      'px-[10px] md:px-0 whitespace-nowrap text-base md:text-xl text-gray-900 pointer-events-none absolute top-2.5',
                  }}
                  modifiers={{
                    available: checkDateAvailable,
                  }}
                  modifiersClassNames={{
                    selected: 'custom-selected',
                    today: 'custom-today',
                    disabled: 'text-gray-300 cursor-not-allowed',
                    available: 'font-bold text-primary-500',
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: 'var(--color-primary-500)',
                      color: 'white',
                      fontWeight: 700,
                      borderRadius: '9999px',
                    },
                    today: {
                      backgroundColor: 'var(--color-primary-100)',
                      color: 'var(--color-primary-500)',
                      fontWeight: 700,
                      borderRadius: '9999px',
                    },
                  }}
                  components={{
                    Chevron: ({ orientation, className, ...props }) => {
                      const rotate = orientation === 'left' ? 'rotate-90' : '-rotate-90';
                      return (
                        <ArrowDown {...props} className={`${className ?? ''} ${rotate} h-5 w-5`} />
                      );
                    },
                  }}
                  disabled={[
                    { before: new Date() },
                    // 스케줄 데이터가 로드되었으면, 예약 가능한 날짜만 활성화
                    (date) => isScheduleLoaded && !checkDateAvailable(date),
                  ]}
                />
              </div>

              {/* 예약 가능한 시간 (날짜 선택 시에만 보임) */}
              <div className='flex-1'>
                {selectedDate ? (
                  <div>
                    <Title as='h4' size='lg' weight='bold' className='mt-4 mb-4'>
                      예약 가능한 시간
                    </Title>
                    <div className='space-y-2'>
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((slot) => (
                          <TimeSelectButton
                            key={slot.id}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                            selected={selectedTimeSlot === slot.id}
                            className='w-full'>
                            {slot.startTime}~{slot.endTime}
                          </TimeSelectButton>
                        ))
                      ) : (
                        <p className='font-md-medium text-center text-gray-500'>
                          예약 가능한 시간이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='flex h-full items-center justify-center rounded-xl border border-gray-300 bg-gray-50'>
                    <p className='font-md-medium text-gray-500'>날짜를 선택해주세요.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 참가 인원 수 */}
            <div className='mb-6 flex items-center justify-between'>
              <Title as='h4' size='lg' weight='bold'>
                참여 인원 수
              </Title>
              <div className='flex items-center gap-3 rounded-3xl border border-gray-100 p-0'>
                <button
                  onClick={handleDecrement}
                  className='flex h-11 w-11 items-center justify-center text-3xl text-gray-500 transition-colors hover:text-gray-700'>
                  −
                </button>
                <span className='font-lg-medium min-w-10 text-center text-gray-900'>
                  {participantCount}
                </span>
                <button
                  onClick={handleIncrement}
                  className='flex h-11 w-11 items-center justify-center text-3xl text-gray-500 transition-colors hover:text-gray-700'>
                  +
                </button>
              </div>
            </div>

            {/* 총 금액 및 예약 버튼 */}
            <div className='space-y-4 border-t border-gray-100 pt-6'>
              <div className='flex items-center justify-between'>
                <span className='font-lg-medium text-gray-900'>총 합계</span>
                <Title as='h3' size='2xl' weight='bold'>
                  ₩ {(activity.price * participantCount).toLocaleString()}
                </Title>
              </div>
              <PrimaryButton
                size='lg'
                onClick={handleReservation}
                className='w-full'
                disabled={!isReservationEnabled || reservationMutation.isPending}>
                {reservationMutation.isPending ? '예약 중...' : '확인'}
              </PrimaryButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default ActivityDetailPage;
