import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * 폼에 저장하지 않은 변경사항(isDirty)이 있을 때 다른 경로로 이동을 막고
 * "정말 나가시겠습니까?" 확인 모달을 띄우기 위한 훅.
 *
 * CreateActivityPage / EditActivityPage에서 거의 동일하게 복붙되어 있던
 * useBlocker + 이탈 확인 모달 상태 로직을 공통화한 것.
 */
export function useUnsavedChangesBlocker(isDirty: boolean) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const ignoreBlockOnceRef = useRef(false);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (ignoreBlockOnceRef.current || !isDirty) {
      return false;
    }

    // search까지 비교해야 query만 바뀌는 이동도 같은 경로로 오인하지 않는다.
    const currentPath = currentLocation.pathname + currentLocation.search;
    const nextPath = nextLocation.pathname + nextLocation.search;

    return currentPath !== nextPath;
  });

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveOpen(true);
    }
  }, [blocker.state]);

  const handleLeaveNo = () => {
    setLeaveOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleLeaveYes = () => {
    setLeaveOpen(false);
    if (blocker.state !== 'blocked') {
      return;
    }

    ignoreBlockOnceRef.current = true;
    blocker.proceed();
  };

  /** 저장 성공 등, 확인 모달 없이 다음 이동을 허용해야 할 때 호출 */
  const allowNextNavigation = () => {
    ignoreBlockOnceRef.current = true;
  };

  return { leaveOpen, handleLeaveNo, handleLeaveYes, allowNextNavigation };
}
