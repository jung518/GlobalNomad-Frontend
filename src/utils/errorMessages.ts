// src/utils/errorMessages.ts
import { isAxiosError } from 'axios';

export const getSignupErrorMessage = (error: unknown): string => {
  if (!isAxiosError<{ message?: string }>(error)) {
    return '회원가입에 실패했습니다.';
  }

  const status = error.response?.status;

  // HTTP 상태 코드로 폴백
  switch (status) {
    case 400:
      return '입력 정보를 확인해주세요.';
    case 409:
      return '이미 가입된 이메일입니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    default:
      return error.response?.data?.message || '회원가입에 실패했습니다.';
  }
};

export const getLoginErrorMessage = (error: unknown): string => {
  if (!isAxiosError<{ message?: string }>(error)) {
    return '로그인에 실패했습니다.';
  }
  const status = error.response?.status;
  // HTTP 상태 코드로 폴백
  switch (status) {
    case 400:
      return '비밀번호가 일치하지 않습니다.';
    case 404:
      return '존재하지 않는 유저입니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    default:
      return error.response?.data?.message || '로그인에 실패했습니다.';
  }
};

/**
 * 체험 등록/수정(mutate) 실패 처리 결과.
 * - toast: axios 에러가 아닌 예외 (네트워크 끊김 등) -> 스낵바로 안내
 * - alert: 서버가 응답한 에러 -> 상태 코드별 메시지를 alert로 안내
 */
export type ActivityMutationErrorResult =
  | { kind: 'toast'; message: string }
  | { kind: 'alert'; message: string };

/**
 * CreateActivityPage / EditActivityPage에서 각각 구현되어 있던
 * "isAxiosError 체크 -> status별 alert 분기" 로직을 공통화한 것.
 * (기존 CreateActivityPage 코드는 401일 때 alert 후 return이 없어
 * 이어서 "알 수 없는 오류" alert가 한 번 더 뜨는 버그가 있었음 — 여기서 함께 수정)
 */
export const resolveActivityMutationError = (
  error: unknown,
  toastFallbackMessage: string
): ActivityMutationErrorResult => {
  if (!isAxiosError<{ message?: string }>(error)) {
    return { kind: 'toast', message: toastFallbackMessage };
  }

  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;

  if (status === 401) {
    return { kind: 'alert', message: '권한이 없습니다. 다시 로그인해주세요.' };
  }

  if (status === 400 || status === 403 || status === 404 || status === 409) {
    return { kind: 'alert', message: serverMessage ?? '요청 처리 중 오류가 발생했습니다.' };
  }

  return { kind: 'alert', message: serverMessage ?? '알 수 없는 오류가 발생했습니다.' };
};
