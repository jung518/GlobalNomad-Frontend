import { useEffect, useMemo, useState } from 'react';
import Label from '@/components/common/Label';
import Title from '@/components/common/Title';
import { BaseInput } from '@/components/common/input/BaseInput';
import TextArea from '@/components/common/TextArea';
import { ArrowDown, Plus, Minus } from '@/assets/icons';
import Dropdown from '@/components/common/dropdown/Dropdown';
import DropdownTrigger from '@/components/common/dropdown/DropdownTrigger';
import DropdownList from '@/components/common/dropdown/DropdownList';
import DropdownItem from '@/components/common/dropdown/DropdownItem';
import { DatePicker } from '@/components/common/DatePicker';
import { CircleButton } from '@/components/common/button/CircleButton';
import { PrimaryButton } from '@/components/common/button';
import BannerImageSection from '@/components/common/image-upload/BannerImageSection';
import IntroImageSection from '@/components/common/image-upload/IntroImageSection';
import type { ScheduleRow } from '@/types/ScheduleRow';
import type { ActivityCategory } from '@/apis/type';
import { ACTIVITY_CATEGORIES } from '@/constants/activityCategory';
import { useDaumPostcodePopup } from 'react-daum-postcode';
import type { Address } from 'react-daum-postcode';
import { useSnackBar } from '@/providers/SnackBarProvider';

//import { normalizeDate } from '@/utils/normalizeDate';
const MAX_BANNER = 1;
const MAX_INTRO = 4;
const MAX_TITLE_LENGTH = 25;
const MAX_CONTENT = 1000;
const MAX_PRICE = 11;
//문자열 시간을 받아서 숫자로 바꾸는 함수
//time을 받아서 " : " 기준으로 나눈다음 첫번째 인자를 리턴한다.
const toHour = (time: string) => Number(time.split(':')[0]);

// 00:00 ~ 23:00
//hour은 인덱스를 받아서 문자열로 바꾼다 대신에 두자리수여야 하고 한자리 수일경우 0을 채운다 ex) 09
//그러고 뒤에 :00을 붙여서 리턴한다 ex) 09:00
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i).padStart(2, '0');
  return `${hour}:00`;
});

//사용자가 draft에 입력하는 상태 값
//date가 옵셔널이 아니면 date초기값 필수
//등록 시 에는 date가 필수지만 입력상황에는 필수가 아니여서 옵셔널
//예약 가능시간 타입
type ScheduleDraft = {
  date?: Date;
  startTime: string;
  endTime: string;
};

//등록 시 draft를 초기화 하는 함수
//미리 만들어서 addScheduleFromDraft 함수에 넣어주기만 하면 된다.
// new Date() 가능하지만 설정하면 비밀번호 안보이는 아이콘 생김

//예약 가능 시간 초기값
const createDraft = (): ScheduleDraft => ({
  date: undefined,
  startTime: '00:00',
  endTime: '01:00',
});

//서버로부터 오는 서버이미지 한장의 타입
type ExistingSubImage = { id: number; imageUrl: string };

//등록,수정 페이지에서 공통으로 쓰는 폼의 초기 타입
export type ActivityFormInitialData = {
  title: string;
  category: ActivityCategory;
  description: string;
  price: number;
  address: string;
  rows: ScheduleRow[];
  bannerImageUrl: string;
  subImageUrls: { id: number; imageUrl: string }[];
};

//사용자가 입력한 값을 공통폼이 페이지로 제출할 타입
export type ActivityFormValues = {
  title: string;
  category: ActivityCategory;
  description: string;
  price: number;
  address: string;
  rows: ScheduleRow[];
  removedSubImageIds: number[];

  // 업로드는 페이지에서 처리하므로 파일/기존값만 넘김
  bannerFile?: File; // 새로 선택한 배너(없으면 undefined)
  introFiles: File[]; // 새로 추가한 소개 이미지들

  existingBannerUrl: string; // edit 초기 주입 값
  existingSubImageUrls: ExistingSubImage[]; // edit 초기 주입 값
};

//페이지가 폼을 어떻게 동작시킬지 정하는 타입
type ActivityFormProps = {
  mode: 'create' | 'edit';
  // edit일 때 초기값 주입
  initialData?: ActivityFormInitialData;
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * ✅ 변경: payload(CreateActivityRequest)가 아니라 "폼 값"을 넘김
   * 페이지에서 mode에 맞는 payload로 변환해서 API 호출
   */
  onSubmit: (values: ActivityFormValues) => Promise<void> | void;

  // 페이지에서의 상태를 받아서 버튼 비활성화
  isPending?: boolean;

  // 버튼 문구
  submitText: string;

  // 타이틀 문구
  titleText: string;
};

export default function ActivityForm({
  mode,
  initialData,
  onSubmit,
  isPending = false,
  submitText,
  titleText,
  onDirtyChange,
}: ActivityFormProps) {
  const [category, setCategory] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [draft, setDraft] = useState<ScheduleDraft>(createDraft());
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [title, setTitle] = useState('');

  const [bannerImages, setBannerImages] = useState<File[]>([]);
  const [introImages, setIntroImages] = useState<File[]>([]);

  const [existingBannerUrl, setExistingBannerUrl] = useState<string>('');
  const [existingSubImageUrls, setExistingSubImageUrls] = useState<ExistingSubImage[]>(
    initialData?.subImageUrls ?? []
  );
  const [removedSubImageIds, setRemovedSubImageIds] = useState<number[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(''); //초기값 저장
  const { showSnack } = useSnackBar();
  const open = useDaumPostcodePopup();

  const handleComplete = (data: Address) => {
    setAddress(data.address);
  };
  //로컬스토리지에 저장할 value

  //현재 폼 상태
  const makeSnapshot = () =>
    JSON.stringify({
      title,
      category,
      text,
      price,
      address,
      rows: rows.map((r) => ({
        date: r.date ? r.date.toISOString().split('T')[0] : null, //(YYYY-MM-DD) 만 비교 [날짜T,시간Z] 그 중 날짜만
        startTime: r.startTime,
        endTime: r.endTime,
        serverTimeId: (r as any).serverTimeId ?? null, //수정페이지이면 서버에서 보내준 row아이디
      })),
      existingBannerUrl, //서버에서 보내준 기존 배너 url, 사진이 변경되면 url이 변경되서 변화 감지
      existingSubImageUrls, //서버에서 보내준 서브 url, 서브 url중 하나라도 바뀌면 변화 감지
      removedSubImageIds, // edit 페이지일때 서버에서 준 서브이미지가 삭제되면 해당 id로 변화 감지
      bannerCount: bannerImages.length, // 배너이미지의 카운트 감지 0 > 1 , 1 > 0 기존과 갯수가 같으면 감지 못함
      introCount: introImages.length, // 서브이미지의 카운트 감지 기존 갯수와 같으면 감지 못함
    });

  //마운트 되자마자 상태
  const makeSnapshotFromInitialData = (data: ActivityFormInitialData) =>
    JSON.stringify({
      title: data.title ?? '',
      category: data.category ?? '',
      text: data.description ?? '',
      price: String(data.price ?? ''),
      address: data.address ?? '',
      rows: (data.rows ?? []).map((r) => ({
        date: r.date ? r.date.toISOString().split('T')[0] : null,
        startTime: r.startTime,
        endTime: r.endTime,
        serverTimeId: (r as any).serverTimeId ?? null,
      })),
      existingBannerUrl: data.bannerImageUrl ?? '',
      existingSubImageUrls: data.subImageUrls ?? [],
      removedSubImageIds: [], // 빈 배열 삭제되서 삭제 아이디가 담기면 변화 감지?
      bannerCount: 0, //마운트 되자마자 사용자가 새로운 파일을 아직 첨부 안해서 0
      introCount: 0,
    });

  //등록페이지 에서 초기 기준점을 잡고 onDirtyChange를 false로 초기화
  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    // 이미 잡혀있으면 재설정 방지
    if (initialSnapshot) {
      return;
    }

    const snap = makeSnapshot();
    setInitialSnapshot(snap);
    onDirtyChange?.(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // 수정모드: 초기값 주입
  useEffect(() => {
    if (!initialData) {
      return;
    }

    setTitle(initialData.title ?? '');
    setCategory(initialData.category ?? '');
    setText(initialData.description ?? '');
    setPrice(String(initialData.price ?? ''));
    setAddress(initialData.address ?? '');
    setRows(initialData.rows ?? []);
    setExistingBannerUrl(initialData.bannerImageUrl ?? '');
    setExistingSubImageUrls(initialData.subImageUrls ?? []);

    // edit에서도 "새로 업로드"부터 작동하게 초기화
    setBannerImages([]);
    setIntroImages([]);
    setDraft(createDraft());

    const snap = makeSnapshotFromInitialData(initialData);
    setInitialSnapshot(snap);
    onDirtyChange?.(false);
  }, [initialData]);

  useEffect(() => {
    if (!initialSnapshot) {
      return;
    }
    const dirty = makeSnapshot() !== initialSnapshot;
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialSnapshot,
    title,
    category,
    text,
    price,
    address,
    rows,
    existingBannerUrl,
    existingSubImageUrls,
    removedSubImageIds,
    bannerImages.length,
    introImages.length,
  ]);

  // 유효성
  const isFormValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      title.length <= 25 &&
      category &&
      text.trim().length <= 1000 &&
      Number(price) > 0 &&
      Number(price) < 99999999999 &&
      address.trim().length > 0 &&
      rows.length > 0
    );
  }, [title, category, text, price, address, rows.length]);

  // 이미지 add/remove
  const addBannerImage = (file: File) => {
    setBannerImages((prev) => {
      if (prev.length >= MAX_BANNER) {
        return prev;
      }
      return [...prev, file];
    });
  };

  const removeBannerImage = (index: number) => {
    setBannerImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addIntroImage = (file: File) => {
    setIntroImages((prev) => {
      if (prev.length >= MAX_INTRO) {
        return prev;
      }
      return [...prev, file];
    });
  };

  const removeIntroImage = (index: number) => {
    setIntroImages((prev) => prev.filter((_, i) => i !== index));
  };

  //사용자가 입력한 값을 담는 함수
  const onChangeTitle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    const limitValue = value.slice(0, MAX_TITLE_LENGTH);
    setTitle(limitValue);
  };

  const handleClickCategory = (value: string) => {
    setCategory(value);
  };

  const onChangeText = (value: string) => {
    const limitText = value.slice(0, MAX_CONTENT);
    setText(limitText);
  };

  const formatNumber = (value: string) => {
    if (!value) {
      return;
    }
    return Number(value).toLocaleString();
  };

  //날짜 바꾸는 함수
  const handleDraftDate = (selectedDate: Date) => {
    setDraft((prev) => ({ ...prev, date: selectedDate }));
  };

  //사용자가 선택한 값을 받아서 종료시간을 filter 하고 그 중 첫번째 인자를 고르는 함수
  //배열로 만들었던 시간들 중 사용자가 선택한 시간(nextStartTime) 보다 큰 값만 추출
  //추출 한 값중 첫 번째 인덱스를 종료시간에 담는다.
  //세터함수에 이전 값을 가져와서(date) 시작시간과 종료시간을 사용자가 지정함 값으로 바꾼다.
  const handleDraftStartTime = (nextStartTime: string) => {
    const nextEndOptions = TIME_OPTIONS.filter((t) => toHour(t) > toHour(nextStartTime));
    const nextEndTime = nextEndOptions[0] ?? nextStartTime;

    setDraft((prev) => ({
      ...prev,
      startTime: nextStartTime,
      endTime: nextEndTime,
    }));
  };

  // 종료시간을 직접 바꿨을 때 값 저장
  // 위에 코드는 시작시간을 바꾸면 종료시간을 시간시작 + 1시간인 값으로 바꿔주지만
  // handleDraftEndTime 사용자가 종료시간도 직접 선택했을때의 값을 저장
  const handleDraftEndTime = (nextEndTime: string) => {
    setDraft((prev) => ({ ...prev, endTime: nextEndTime }));
  };

  //date를 필수로 하기위해 조건문
  //setRows는 이전에 rows를 받고 새로운 row를 추가해서 새로운 배열을 만듦
  //서버에 post시 아직 서버의 id를 모르기 때문에 랜덤으로 구분하기 위한 아이디값 생성
  //date옆에 ! 는 타입스크립트에게 null, undefinded가 아니라는 확신을 준다.
  //위에 만들어 두었던 초기화 함수 실행
  //    addScheduleFromDraft

  const addScheduleFromDraft = () => {
    const toYmd = (d: Date) => d.toISOString().split('T')[0];
    // 1) 날짜 없으면 끝
    if (!draft.date) {
      return;
    }

    const draftDateKey = toYmd(draft.date);

    // 2) rows의 date도 같은 포맷으로 비교
    const isDuplicate = rows.some((row) => {
      const rowDateKey = toYmd(row.date);
      return (
        rowDateKey === draftDateKey &&
        row.startTime === draft.startTime &&
        row.endTime === draft.endTime
      );
    });

    if (isDuplicate) {
      showSnack('예약이 겹치는 시간대가 있습니다.', 'error');
      return;
    }

    // 3) 타입 맞는 ScheduleRow만 추가 (setRows는 딱 1번)
    const newRow: ScheduleRow = {
      uiId: crypto.randomUUID(),
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
    };

    setRows((prev) => [...prev, newRow]);
    setDraft(createDraft());
  };

  //사용자가 선택한 값을 인자로 받아서 이전 rows값들 중
  //row.id와 사용자가 선택한 uiId가 같지 않은 것 들만 추출해서 새 배열로 만든다.
  //즉 사용자가 선택한 아이디만 삭제
  const removeRow = (uiId: string) => {
    setRows((prevRows) => prevRows.filter((row) => row.uiId !== uiId));
  };

  const handleRemoveExistingSubImage = (id: number) => {
    // 1) 화면에서 제거
    setExistingSubImageUrls((prev) => prev.filter((img) => img.id !== id));

    // 2) 서버 삭제용 id 누적
    setRemovedSubImageIds((prev) => [...prev, id]);
  };

  /**
   * ✅ 공통 submit 변경
   * - 공통폼에서는 업로드/POST/PATCH payload 생성 안 함
   * - 폼 값만 모아서 페이지로 넘김
   */
  const handleSubmit = async () => {
    if (!isFormValid || isPending) {
      return;
    }

    const values: ActivityFormValues = {
      title,
      category: category as ActivityCategory,
      description: text,
      price: Number(price),
      address,
      rows,
      bannerFile: bannerImages[0],
      introFiles: introImages,
      existingBannerUrl,
      existingSubImageUrls,
      removedSubImageIds,
    };

    await onSubmit(values);
  };

  return (
    <div className='mx-auto flex w-full flex-col gap-7.5 px-6 md:w-175 md:px-7.5 lg:px-0'>
      <div className='flex flex-col gap-6'>
        <Title as='h3' className='font-xl-bold text-gray-950'>
          {titleText}
        </Title>

        {/* 제목 */}
        <div className='flex flex-col gap-2.5'>
          <Label className='font-lg-bold text-gray-950'>제목</Label>
          <BaseInput
            value={title}
            onChange={onChangeTitle}
            id='title'
            placeholder='제목을 입력해 주세요'
          />
        </div>

        {/* 카테고리 */}
        <div className='flex flex-col gap-2.5'>
          <Label className='font-lg-bold text-gray-950'>카테고리</Label>

          <Dropdown className='relative w-full'>
            <DropdownTrigger className='flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2'>
              <span className={category ? 'text-gray-900' : 'text-gray-400'}>
                {category || '카테고리를 선택해 주세요'}
              </span>
              <ArrowDown />
            </DropdownTrigger>

            <DropdownList className='absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-gray-100 bg-white p-1 shadow-md'>
              {ACTIVITY_CATEGORIES.map((c) => (
                <DropdownItem
                  key={c}
                  onClick={() => handleClickCategory(c)}
                  className='rounded-lg px-3 py-2 hover:bg-gray-50'>
                  {c}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </div>

        {/* 설명 */}
        <div className='flex flex-col gap-2.5'>
          <Label className='font-lg-bold text-gray-950'>설명</Label>
          <TextArea
            value={text}
            onChange={onChangeText}
            variant='default'
            placeholder='설명을 최대 1000자 입니다.'
          />
        </div>

        {/* 가격 */}
        <div className='flex flex-col gap-2.5'>
          <Label className='font-lg-bold text-gray-950'>가격</Label>
          <BaseInput
            value={price ? `${formatNumber(price)}` : ''}
            onChange={(e) => {
              //문자전체 중 0에서9까지가 아닌 모든 문자는 "" 로 만들어 제거, / /는 정규식, ^는 부정, [0-9]는 0~9까지 ,g는 글로벌 문자전체
              const onlyNumber = e.target.value.replace(/[^0-9]/g, '');
              const limitPrice = onlyNumber.slice(0, MAX_PRICE);
              setPrice(limitPrice);
            }}
            id='price'
            placeholder='체험 금액을 입력해 주세요'
          />
        </div>

        {/* 주소 */}
        <div className='flex flex-col gap-2.5'>
          <Label className='font-lg-bold text-gray-950'>주소</Label>
          <BaseInput
            readOnly
            onClick={() => open({ onComplete: handleComplete })}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            id='address'
            placeholder='주소를 입력해 주세요'
          />
        </div>
      </div>

      {/* 예약 가능한 시간대 */}
      <div className='w-full'>
        <Title className='font-lg-bold mb-4.5 text-gray-950' as='h4'>
          예약 가능한 시간대
        </Title>

        <div className='flex flex-col gap-2.5'>
          <div className='hidden w-full grid-cols-[1fr_160px_200px_auto] items-end gap-4 sm:grid'>
            <Label className='font-lg-medium text-gray-950'>날짜</Label>
            <Label className='font-lg-medium text-gray-950'>시작 시간</Label>
            <Label className='font-lg-medium text-gray-950'>종료 시간</Label>
            <span />
          </div>

          <div className='flex flex-col gap-3 sm:grid sm:w-full sm:grid-cols-[1fr_160px_160px_auto] sm:items-center sm:gap-4'>
            <div className='flex items-end gap-3 sm:block'>
              <div className='flex-1'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>날짜</Label>
                <DatePicker value={draft.date} onChange={handleDraftDate} />
              </div>
            </div>

            <div className='grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 sm:contents'>
              <div className='w-full sm:w-40'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>시작 시간</Label>
                <Dropdown className='relative w-full'>
                  <DropdownTrigger className='flex h-13.5 w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2'>
                    <span>{draft.startTime}</span>
                    <ArrowDown />
                  </DropdownTrigger>

                  <DropdownList className='absolute top-full left-0 z-50 mt-2 max-h-40 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-md'>
                    {TIME_OPTIONS.map((time) => (
                      <DropdownItem
                        key={time}
                        onClick={() => handleDraftStartTime(time)}
                        className='rounded-lg px-3 py-2 hover:bg-gray-50'>
                        {time}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </div>

              <span className='mb-4 text-gray-400 sm:hidden'>-</span>

              <div className='w-full sm:w-40'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>종료 시간</Label>
                <Dropdown className='relative w-full'>
                  <DropdownTrigger className='flex h-13.5 w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2'>
                    <span>{draft.endTime}</span>
                    <ArrowDown />
                  </DropdownTrigger>

                  <DropdownList className='absolute top-full left-0 z-50 mt-2 max-h-40 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-md'>
                    {TIME_OPTIONS.filter((t) => toHour(t) > toHour(draft.startTime)).map((time) => (
                      <DropdownItem
                        key={time}
                        onClick={() => handleDraftEndTime(time)}
                        className='rounded-lg px-3 py-2 hover:bg-gray-50'>
                        {time}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </div>

              <div className='mb-1.5 shrink-0 sm:hidden'>
                <CircleButton variant='plus' icon={<Plus />} onClick={addScheduleFromDraft} />
              </div>

              <div className='hidden sm:flex sm:justify-end'>
                <CircleButton variant='plus' icon={<Plus />} onClick={addScheduleFromDraft} />
              </div>
            </div>
          </div>
        </div>

        <span className='mt-5 mb-5 block w-full border-b border-gray-100' />

        {rows.map((row) => (
          <div
            key={row.uiId}
            className='mt-5 flex flex-col gap-3 sm:grid sm:w-full sm:grid-cols-[1fr_160px_160px_auto] sm:items-center sm:gap-4'>
            <div className='flex items-end gap-3 sm:block'>
              <div className='flex-1'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>날짜</Label>
                <div className='flex h-13.5 items-center rounded-xl border border-gray-100 bg-white px-3 py-2 text-gray-700'>
                  {row.date.toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 sm:contents'>
              <div className='w-full sm:w-40'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>시작 시간</Label>
                <div className='flex h-13.5 items-center rounded-xl border border-gray-100 bg-white px-3 py-2 text-gray-900'>
                  {row.startTime}
                </div>
              </div>

              <span className='mb-4 text-gray-400 sm:hidden'>-</span>

              <div className='w-full sm:w-40'>
                <Label className='font-lg-medium text-gray-950 sm:hidden'>종료 시간</Label>
                <div className='flex h-13.5 items-center rounded-xl border border-gray-100 bg-white px-3 py-2 text-gray-900'>
                  {row.endTime}
                </div>
              </div>

              <div className='hidden sm:flex sm:justify-end'>
                <CircleButton
                  variant='minus'
                  icon={<Minus />}
                  onClick={() => removeRow(row.uiId)}
                />
              </div>

              <div className='mb-1.5 shrink-0 sm:hidden'>
                <CircleButton
                  variant='minus'
                  icon={<Minus />}
                  onClick={() => removeRow(row.uiId)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 배너 이미지 */}
      <div className='flex flex-col gap-2.5'>
        <Label>
          <span className='font-lg-bold text-gray-950'>배너 이미지 등록</span>
        </Label>
        <BannerImageSection
          images={bannerImages}
          maxFiles={MAX_BANNER}
          onAdd={addBannerImage}
          onRemove={removeBannerImage}
          onRemoveExisting={() => setExistingBannerUrl('')}
          existingUrl={existingBannerUrl}
        />
      </div>

      {/* 소개 이미지 */}
      <div className='flex flex-col gap-2.5'>
        <Label>
          <span className='font-lg-bold text-gray-950'>소개 이미지 등록</span>
        </Label>
        <IntroImageSection
          images={introImages}
          maxFiles={MAX_INTRO}
          onAdd={addIntroImage}
          onRemove={removeIntroImage}
          onRemoveExisting={handleRemoveExistingSubImage}
          existingUrls={existingSubImageUrls}
        />
      </div>

      {/* 제출 버튼 */}
      <div className='mb-7.5 flex justify-center md:mb-13.25 lg:mb-26.5'>
        <PrimaryButton
          disabled={!isFormValid || isPending}
          onClick={handleSubmit}
          className='font-md-bold h-10.25 w-30'>
          {isPending ? (mode === 'create' ? '등록 중...' : '수정 중...') : submitText}
        </PrimaryButton>
      </div>
    </div>
  );
}
