import ActivityForm, { type ActivityFormValues } from '@/components/ActivityForm';
import type { CreateActivityRequest } from '@/apis/type';
import { useCreateActivity } from '@/hooks/useCreateActivity';
import { uploadActivityImage } from '@/apis/uploadActivityImage';
import CancelReservationModal from '@/components/common/modal/CancelReservationModal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackBar } from '@/providers/SnackBarProvider';
import { useUnsavedChangesBlocker } from '@/hooks/useUnsavedChangesBlocker';
import { resolveActivityMutationError } from '@/utils/errorMessages';
import { toYmd } from '@/utils/dateUtils';

export default function CreateActivityPage() {
  const { mutate, isPending } = useCreateActivity();
  const [isDirty, setIsDirty] = useState(false);
  const navigate = useNavigate();
  const { showSnack } = useSnackBar();
  const { leaveOpen, handleLeaveNo, handleLeaveYes, allowNextNavigation } =
    useUnsavedChangesBlocker(isDirty);

  const handleCreate = async (values: ActivityFormValues) => {
    try {
      // 이미지 업로드
      const bannerImageUrl = values.bannerFile ? await uploadActivityImage(values.bannerFile) : '';

      const subImageUrls =
        values.introFiles.length > 0
          ? await Promise.all(values.introFiles.map(uploadActivityImage))
          : [];

      //schedules 변환 (공통폼 rows -> 서버 요청 형식)
      //row.date가 Date 객체라서 { date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm" } 형식으로 변환
      const schedules = values.rows.map((row) => ({
        date: toYmd(row.date),
        startTime: row.startTime,
        endTime: row.endTime,
      }));

      // 3) 최종 payload
      const payload: CreateActivityRequest = {
        title: values.title,
        category: values.category,
        description: values.description,
        price: values.price,
        address: values.address,
        schedules,
        bannerImageUrl,
        subImageUrls,
      };

      // 4) mutate
      mutate(payload, {
        onSuccess: () => {
          showSnack('체험이 등록되었습니다.', 'success', {
            duration: 2000,
          });
          Object.keys(localStorage)
            .filter((k) => k.startsWith('draft:createActivity'))
            .forEach((k) => localStorage.removeItem(k));

          setIsDirty(false);
          allowNextNavigation();

          setTimeout(() => {
            navigate('/mypage?tab=experiences');
          }, 1500);
        },
        onError: (error) => {
          const result = resolveActivityMutationError(error, '체험이 등록이 실패했습니다..');
          if (result.kind === 'toast') {
            showSnack(result.message, 'error', { duration: 2000 });
            return;
          }
          alert(result.message);
        },
      });
    } catch (e) {
      console.error('등록 처리 중 실패:', e);
      alert('등록에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <ActivityForm
        mode='create'
        titleText='내 체험 등록'
        submitText='등록하기'
        isPending={isPending}
        onSubmit={handleCreate}
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
