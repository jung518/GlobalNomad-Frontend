import { useMemo, useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';

import { ArrowDown } from '@/assets/icons';
import Title from '@/components/common/Title';
import MyPageMobileToggle from '@/components/common/MyPageMobileToggle';

import Dropdown from '@/components/common/dropdown/Dropdown';
import DropdownTrigger from '@/components/common/dropdown/DropdownTrigger';
import DropdownList from '@/components/common/dropdown/DropdownList';
import DropdownItem from '@/components/common/dropdown/DropdownItem';

import { useMyActivity } from '@/hooks/useMyActivity';
import { useMyActivitySchedules } from '@/hooks/useMyActivitySchedules';

import { eventType, EventBadge } from '@/components/common/badge/EventBadge';
import type { MyActivitySchedulesResponse } from '@/apis/type';
import ReservationInfoModal from '@/components/common/modal/ReservationCard/ReservationInfoModal';
import { useReservedSchedule } from '@/hooks/useReservedSchedule';
import { dayPickerKoreanProps, toYmd } from '@/utils/dateUtils';

//수정
type PopoverState = {
  top: number;
  left: number;
  placement: 'right' | 'left';
} | null;

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

//달력에 그려지는 예약 status
//밸류값을 꺼내서 타입정의
type DayCounts = {
  [eventType.reservation]: number;
  [eventType.approved]: number;
  [eventType.completed]: number;
};
//인포모달에 보여줄 한국식 날짜
//데이트 피커의date 를 바아서 toYmd(date)를 거쳐서 뱃지에 날짜 저장 뱃지클릭하면 해당날짜가 모달에 출력
const ymdToKorean = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) {
    return ymd;
  }
  return `${y}년 ${m}월 ${d}일`;
};

export default function BookingStatusPage({ setMobileOpen, mobileOpen }: Props) {
  //드롭다운 체험 title
  const { data: activities = [], isLoading, isError } = useMyActivity();
  //드롭다운에서 사용자가 선택한 체험id
  //체험 미선택 시 undefined
  const [selectedActivityId, setSelectedActivityId] = useState<number | undefined>(undefined);
  //월이 바뀔때마다 해당 월에 관련된 api호출하기 위해
  const [monthDate, setMonthDate] = useState(new Date());
  //모달 상태
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  //선택되는 뱃지
  const [selectBadge, setSelectBadge] = useState<string | null>(null);
  //수정
  const [popover, setPopover] = useState<PopoverState>(null);
  // const handleBadgeClick = (dateYmd: string) => () => {
  //   openReservationModal(dateYmd);
  // };

  const openReservationModal = (dateYmd: string, anchorEl: HTMLElement) => {
    setSelectBadge(dateYmd);
    setIsReservationModalOpen(true);

    // ✅ 뱃지(또는 wrapper)의 화면 좌표
    const rect = anchorEl.getBoundingClientRect();

    // ✅ 모달 대략 폭(너 모달 폭에 맞춰 조정)
    const MODAL_W = 360;
    const GAP = 8;

    // ✅ 오른쪽 공간이 충분하면 오른쪽, 아니면 왼쪽
    const canPlaceRight = rect.right + GAP + MODAL_W <= window.innerWidth;
    const placement: 'right' | 'left' = canPlaceRight ? 'right' : 'left';

    const left = placement === 'right' ? rect.right + GAP : rect.left - GAP - MODAL_W;

    // ✅ top은 “뱃지의 위쪽 기준” (원하면 rect.top 대신 rect.bottom도 가능)
    let top = rect.top;

    // ✅ 화면 아래로 넘어가면 위로 올리기 (모달 높이 대략값)
    const MODAL_H = 420; // 너 모달 높이 비슷하게
    if (top + MODAL_H > window.innerHeight) {
      top = Math.max(8, window.innerHeight - MODAL_H - 8);
    }

    setPopover({ top, left, placement });
  };

  const handleBadgeClick = (dateYmd: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    openReservationModal(dateYmd, e.currentTarget as HTMLElement);
  };

  // const openReservationModal = (dateYmd: string) => {
  //   setSelectBadge(dateYmd);
  //   setIsReservationModalOpen(true);
  // };

  const closeReservationModal = () => {
    setIsReservationModalOpen(false);
    setSelectBadge(null);
  };

  //실제 스크롤 요소 찾아서 스크롤 바 숨기기
  useEffect(() => {
    const el = document.scrollingElement as HTMLElement | null;
    if (!el) {
      return;
    }

    el.classList.add('scrollbar-hide');
    return () => el.classList.remove('scrollbar-hide');
  }, []);

  //selectBadge 에 날짜가 있다면
  const reservedDate = selectBadge ?? undefined;

  //data의 이름 변경, 선택된 체험id와 날짜와,모달이true면 데이터 받기(hook에서 enabled로 제어)
  const { data: reservedSchedules = [] } = useReservedSchedule(
    selectedActivityId,
    reservedDate,
    isReservationModalOpen
  );

  // api요청시 해당 연,월을 인자로 같이 보냄
  const year = String(monthDate.getFullYear());
  const month = String(monthDate.getMonth() + 1).padStart(2, '0');

  //이름 변경 및 useMyActivitySchedules에 체험아이디와 ,date를 같이 보낸다.
  const {
    data: dashboard = [],
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useMyActivitySchedules({
    activityId: selectedActivityId,
    year,
    month,
  });

  // 드롭다운 트리거에 보여줄 선택된 체험 객체
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) {
      return undefined;
    }
    return activities.find((a) => a.id === selectedActivityId);
  }, [activities, selectedActivityId]);

  // MyActivitySchedulesResponse의 타입을 배열 => 객체형태로
  const countsByDate = useMemo(() => {
    return dashboard.reduce<Record<string, DayCounts>>((acc, item: MyActivitySchedulesResponse) => {
      acc[item.date] = {
        [eventType.reservation]: item.reservations.pending,
        [eventType.approved]: item.reservations.confirmed,
        [eventType.completed]: item.reservations.completed,
      };
      return acc;
    }, {});
  }, [dashboard]);

  useEffect(() => {
    if (!selectedActivityId) {
      return;
    }
    const exists = activities.some((a) => a.id === selectedActivityId);
    if (!exists) {
      setSelectedActivityId(undefined);
    }
  }, [activities, selectedActivityId]);

  return (
    <div className='flex min-h-0 flex-col gap-3.5'>
      <MyPageMobileToggle mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className='flex flex-col gap-7.5 py-2.5'>
        <div className='flex flex-col gap-2.5'>
          <Title as='h3' size='xl' weight='bold'>
            예약 현황
          </Title>
          <span className='font-md-medium text-gray-500'>
            내 체험에 예약된 내역들을 한 눈에 확인할 수 있습니다.
          </span>
        </div>

        {/* ✅ 체험 선택 드롭다운 */}
        <div>
          <Dropdown className='relative w-full'>
            <DropdownTrigger className='flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2'>
              <span className='truncate'>{selectedActivity?.title ?? '체험을 선택하세요'}</span>
              <ArrowDown />
            </DropdownTrigger>

            <DropdownList className='absolute top-full left-0 z-50 mt-2 max-h-70 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-md'>
              {isLoading && <div className='px-3 py-2 text-sm text-gray-400'>불러오는 중...</div>}
              {isError && (
                <div className='px-3 py-2 text-sm text-red-500'>체험 목록을 불러오지 못했어요.</div>
              )}

              {!isLoading &&
                !isError &&
                activities.map((a) => (
                  <DropdownItem
                    key={a.id}
                    onClick={() => setSelectedActivityId(a.id)}
                    className='rounded-lg px-3 py-2 hover:bg-gray-50'>
                    {a.title}
                  </DropdownItem>
                ))}

              {!isLoading && !isError && activities.length === 0 && (
                <div className='px-3 py-2 text-sm text-gray-400'>등록된 체험이 없어요.</div>
              )}
            </DropdownList>
          </Dropdown>
        </div>

        {/* ✅ dashboard 로딩/에러 */}
        {selectedActivityId && (
          <div className='px-1 text-sm'>
            {isDashboardLoading && <span className='text-gray-400'>예약 현황 불러오는 중...</span>}
            {isDashboardError && (
              <span className='text-red-500'>예약 현황을 불러오지 못했어요.</span>
            )}
          </div>
        )}

        {/* ✅ 달력 */}
        <div className='h-screen min-h-0 flex-1'>
          <DayPicker
            {...dayPickerKoreanProps}
            className='relative h-full w-full'
            month={monthDate}
            onMonthChange={setMonthDate}
            classNames={{
              caption:
                'relative mb-2 md:mb-[30px] flex items-center justify-center rounded-xl bg-gray-50 py-2 md:py-3 gap-2.5',
              caption_label:
                'px-[10px] md:px-0 whitespace-nowrap text-base sm:font-2xl-bold lg:font-2xl-bold font-lg-bold pointer-events-none',
              day: 'w-[91.42px] h-[105px]',
              nav: 'absolute inset-0', // 캡션 안에서 전체 덮게
              month: 'flex flex-col gap-2 md:gap-[30px] items-center h-full w-full ',
              button_previous: 'absolute left-[30%] lg:-top-0.5 sm:-top-0.5 -top-1',
              button_next: 'absolute right-[30%] lg:-top-0.5 sm:-top-0.5 -top-1',
              month_grid: 'lg:w-[640px] lg:h-[779px] md:h-[779px] w-full h-[500px]',
              months: 'w-full h-full ',
            }}
            modifiersClassNames={{
              today: 'bg-primary-50 text-primary-500 font-bold rounded-full',
            }}
            components={{
              //Chevron 데이트 피커의 svg교체를 위한 컴포넌트 덮어쓴다는 느낌, 버튼까지 바꾸려면 nav
              //orientation => Chevron 의 속성중 하나로 어로우 버튼의 좌,우 판별을 위해
              //props 기존에 있던 svg가 받던 프롭스들이 교체된 프롭스에도 전달하기 위해
              //다른 컴포넌트를 커스텀 하고 싶으면 공식문서에서 확인
              Chevron: ({ orientation, className, ...props }) => {
                const rotate = orientation === 'left' ? 'rotate-90' : '-rotate-90';
                return <ArrowDown {...props} className={`${className ?? ''} ${rotate} h-5 w-5`} />;
              },
              //Day 를 커스텀 하기
              //모든 타입의 props
              Day: (props: any) => {
                //date에 해당날짜 칸의 Date객체 추출
                const date: Date = props.date ?? props.day?.date ?? props.day;
                //date문자열로 변환 해서 key담기
                const key = toYmd(date);
                //key에 해당하는 status들 가져와서 객체화 조회, counts에 담기
                const counts = countsByDate[key];

                // const isOpenThisDay = isReservationModalOpen && selectBadge === key;

                return (
                  <td className={props.className}>
                    <div className='flex h-full w-full flex-col items-center'>
                      {/* 날짜(기존 children) */}
                      <div className='w-full text-center'>{props.children}</div>

                      {/* counts가 있으면 뱃지 렌더링 */}
                      {counts && (
                        <div className='relative mt-1 flex w-[45px] flex-col items-center gap-1 px-1 lg:w-[67px]'>
                          <EventBadge
                            type={eventType.reservation}
                            count={counts[eventType.reservation]}
                            onClick={handleBadgeClick(key)}
                          />
                          <EventBadge
                            type={eventType.approved}
                            count={counts[eventType.approved]}
                            onClick={handleBadgeClick(key)}
                          />
                          <EventBadge
                            type={eventType.completed}
                            count={counts[eventType.completed]}
                            onClick={handleBadgeClick(key)}
                          />

                          {/* ✅ PC(lg)에서는 셀 기준 팝오버(딤 없음) */}
                          {isReservationModalOpen && selectBadge && popover && (
                            <div
                              className='fixed z-10000 hidden lg:block'
                              style={{
                                top: popover.top - 100,
                                left: popover.left,
                              }}
                              onClick={(e) => e.stopPropagation()}>
                              <ReservationInfoModal
                                isOpen={isReservationModalOpen}
                                onClose={closeReservationModal}
                                dateText={ymdToKorean(selectBadge)}
                                activityId={selectedActivityId!}
                                dateYmd={selectBadge!}
                                reservedSchedules={reservedSchedules}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                );
              },
            }}
          />
        </div>
      </div>

      {/* ✅ 모바일(md 이하): 딤 + 바텀시트 */}
      {isReservationModalOpen && selectBadge && (
        <div className='lg:hidden'>
          <div className='fixed inset-0 z-9999 bg-black/40' onClick={closeReservationModal} />

          <div className='fixed inset-x-0 bottom-0 z-10000' onClick={(e) => e.stopPropagation()}>
            <ReservationInfoModal
              isOpen={isReservationModalOpen}
              onClose={closeReservationModal}
              dateText={ymdToKorean(selectBadge)}
              activityId={selectedActivityId!}
              dateYmd={selectBadge!}
              reservedSchedules={reservedSchedules}
            />
          </div>
        </div>
      )}

      {/* ✅ PC(lg 이상): 바깥 클릭 닫기용 투명 레이어 */}
      {isReservationModalOpen && selectBadge && (
        <div
          className='fixed inset-0 z-9998 hidden bg-transparent lg:block'
          onClick={closeReservationModal}
        />
      )}
    </div>
  );
}
