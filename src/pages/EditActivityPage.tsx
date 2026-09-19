import ActivityForm from '@/components/ActivityForm';
import type { ActivityFormInitialData, ActivityFormValues } from '@/components/ActivityForm';
import { useGetActivityDetail } from '@/hooks/useEditActivity';
import { usePatchActivity } from '@/hooks/usePatchActivity';
import { uploadActivityImage } from '@/apis/uploadActivityImage';
import type { ActivityCategory, MyActivityEditRequest } from '@/apis/type';
import NotFoundPage from '@/pages/NotFoundPage';
import CancelReservationModal from '@/components/common/modal/CancelReservationModal';
import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackBar } from '@/providers/SnackBarProvider';
import { useUnsavedChangesBlocker } from '@/hooks/useUnsavedChangesBlocker';
import { resolveActivityMutationError } from '@/utils/errorMessages';
import { toYmd } from '@/utils/dateUtils';
import { ROUTES } from '@/constants/routes';

export default function EditActivityPage() {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const id = activityId ? Number(activityId) : undefined;

  const { data, isLoading, isError } = useGetActivityDetail(id);
  const { mutate: patchMutate, isPending } = usePatchActivity(id ?? 0);
  const [isDirty, setIsDirty] = useState(false);
  const { showSnack } = useSnackBar();
  const { leaveOpen, handleLeaveNo, handleLeaveYes, allowNextNavigation } =
    useUnsavedChangesBlocker(isDirty);

  const initialData: ActivityFormInitialData | undefined = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return {
      title: data.title ?? '',
      category: data.category as ActivityCategory,
      description: data.description ?? '',
      price: data.price ?? 0,
      address: data.address ?? '',
      rows: data.schedules.map((s) => ({
        uiId: String(s.id),
        date: new Date(`${s.date}T00:00:00`),
        startTime: s.startTime,
        endTime: s.endTime,
        serverTimeId: s.id,
      })),
      bannerImageUrl: data.bannerImageUrl ?? '',
      subImageUrls: (data.subImages ?? []).map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
      })),
    };
  }, [data]);

  // id 자체가 잘못된 경우 (NaN 포함) -> 404
  if (!id || Number.isNaN(id) || id <= 0) {
    return <NotFoundPage />;
  }

  // 로딩/에러 처리
  if (isLoading) {
    return <div>로딩중...</div>;
  }
  if (isError || !data) {
    return <NotFoundPage />;
  }

  /**
   * ✅ 수정 submit: 공통폼 values -> PATCH payload 생성 + API 호출
   */
  const handleEdit = async (values: ActivityFormValues) => {
    try {
      // 배너: 새 파일이 있으면 업로드, 없으면 기존 URL 유지
      const bannerImageUrl = values.bannerFile
        ? await uploadActivityImage(values.bannerFile)
        : values.existingBannerUrl;

      // 소개 이미지: 새로 추가한 것만 업로드해서 "추가" 목록으로 보냄
      const subImageUrlsToAdd =
        values.introFiles.length > 0
          ? await Promise.all(values.introFiles.map(uploadActivityImage))
          : [];

      // schedules add/remove 계산
      // 서버에서 준 스케줄 아이디
      const originalIds = data.schedules.map((s) => s.id);

      const currentServerIds = values.rows
        .map((r: any) => r.serverTimeId)
        .filter((v: any) => typeof v === 'number') as number[]; //number 만

      // 원래는 있었는데 지금은 없는 것들 = 삭제 대상
      const scheduleIdsToRemove = originalIds.filter((sid) => !currentServerIds.includes(sid));

      // 지금 rows 중 serverTimeId 없는 것들 = 새로 추가한 스케줄
      const schedulesToAdd = values.rows
        .filter((r: any) => !r.serverTimeId)
        .map((r) => ({
          date: toYmd(r.date),
          startTime: r.startTime,
          endTime: r.endTime,
        }));

      // 4) 최종 PATCH payload
      const payload: MyActivityEditRequest = {
        title: values.title,
        category: values.category,
        description: values.description,
        price: values.price,
        address: values.address,
        bannerImageUrl,

        subImageIdsToRemove: values.removedSubImageIds,
        subImageUrlsToAdd: subImageUrlsToAdd,

        scheduleIdsToRemove: scheduleIdsToRemove as any,
        schedulesToAdd: schedulesToAdd as any,
      };

      // 5) PATCH
      patchMutate(payload, {
        onSuccess: () => {
          showSnack('체험이 수정되었습니다.', 'success', {
            duration: 2000,
          });

          setIsDirty(false);
          allowNextNavigation();

          setTimeout(() => {
            navigate(ROUTES.myPage('experiences'));
          }, 1500);
        },

        onError: (error) => {
          const result = resolveActivityMutationError(error, '체험이 수정이 실패했습니다.');
          if (result.kind === 'toast') {
            showSnack(result.message, 'error', { duration: 2000 });
            return;
          }
          alert(result.message);
        },
      });
    } catch (e) {
      console.log('❌ edit preprocess error:', e);
      alert('수정 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <ActivityForm
        mode='edit'
        titleText='내 체험 수정'
        submitText='수정하기'
        isPending={isPending}
        initialData={initialData}
        onSubmit={handleEdit}
        onDirtyChange={setIsDirty}
      />

      <CancelReservationModal
        isOpen={leaveOpen}
        onClose={handleLeaveNo}
        onConfirm={handleLeaveYes}
        cancelText='아니오'
        confirmText='네'>
        저장되지 않았습니다.
        <br />
        정말 뒤로 가시겠습니까?
      </CancelReservationModal>
    </>
  );
}
