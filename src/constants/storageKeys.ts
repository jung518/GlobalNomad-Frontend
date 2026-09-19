/**
 * sessionStorage/localStorage 키 문자열의 단일 출처.
 * (accessToken/refreshToken은 이미 apis/auth/token.ts의 TOKEN_KEYS로 관리되고 있음)
 */
export const STORAGE_KEYS = {
  /** 카카오 OAuth 콜백이 로그인/회원가입 중 어느 흐름인지 구분하기 위한 플래그 */
  KAKAO_SIGNUP_MODE: 'isKakaoSignUpMode',
} as const;
