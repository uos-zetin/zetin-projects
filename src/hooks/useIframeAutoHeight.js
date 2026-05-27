import { useEffect } from 'react';

// iframe-resizer로 임베드됐을 때, 내용 높이가 바뀌면 부모(iframe)에게 높이 재계산을 직접 요청한다.
// 데이터가 비동기로 채워지거나(특히 모바일) 이미지가 늦게 로드되어도 부모가 다시 측정하도록 보장한다.
// 직접 접속(임베드 아님) 시에는 window.parentIFrame이 없어 아무 동작도 하지 않는다.
export function useIframeAutoHeight() {
  useEffect(() => {
    const ping = () => {
      if (window.parentIFrame) window.parentIFrame.size();
    };
    ping();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(ping);
      ro.observe(document.body);
    }
    window.addEventListener('load', ping);
    window.addEventListener('resize', ping);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('load', ping);
      window.removeEventListener('resize', ping);
    };
  }, []);
}
