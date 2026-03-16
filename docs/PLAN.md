# Image Blur Editor 기획서

## 1. 프로젝트 정의

이 프로젝트는 로그인 없이 바로 사용할 수 있는 데스크톱 전용 이미지 블러/가림 웹앱이다.

제품 성격은 다음과 같다.

- 정적 사이트로 배포 가능해야 한다.
- 서버 없이 브라우저 내부에서만 동작해야 한다.
- 업로드된 이미지는 외부로 전송하지 않는다.
- 다양한 사용자가 바로 이해할 수 있도록 단순하고 직관적인 편집 흐름을 제공한다.
- 단순 미감용 블러뿐 아니라 민감정보 가림 용도까지 고려한 범용 툴로 설계한다.

## 2. 이번 단계에서 확정된 조건

- 대상 환경: 데스크톱 웹 브라우저 전용
- 배포 방식: 정적 사이트
- 인증/로그인: 없음
- 서버/DB: 없음
- 구현 스택: `React + Vanilla JavaScript + Canvas API`
- 블러 엔진: 외부 블러 라이브러리 없이 직접 구현
- 결과 저장: 원본 해상도 유지 필수

## 3. 조사 기반 핵심 인사이트

이번 기획은 실제 서비스 패턴과 기술 문서를 참고해 아래처럼 정리한다.

### 3-1. 관련 툴 패턴

- Snagit, CleanShot 같은 캡처/편집 도구는 보통 `Blur`, `Pixelate`, `Solid Redaction` 계열을 함께 제공한다.
- 단순 블러만 제공하는 것보다 `부드러운 블러`, `픽셀화`, `완전 가림`처럼 목적이 다른 효과를 함께 제공하는 편이 범용성이 높다.
- 얼굴, 배경, 연출용에는 부드러운 블러가 잘 맞고, 텍스트/UI 일부 가림에는 픽셀화나 박스형 가림이 더 빠르게 인지된다.

### 3-2. 보안성 관점

- 보안/프라이버시 관점에서는 일반적인 블러나 픽셀화가 항상 안전한 마스킹 수단은 아니다.
- 민감정보 보호에는 완전히 덮는 `Solid Redaction` 계열을 함께 제공하고, UI에서도 이를 명확히 안내하는 편이 적절하다.
- 따라서 이 앱은 미감용 효과와 안전한 가림 효과를 분리해서 제공해야 한다.

### 3-3. 히스토리 패턴

- 드로잉/화이트보드 계열 도구는 시간 기반보다 `행동 기반 undo`를 사용한다.
- 빠르게 연속된 변경은 하나의 `history mark`로 묶어 되돌리는 방식이 일반적이다.
- 이 원칙을 적용하면 `클릭 1회 = undo 1회`, `드래그 1회 = undo 1회`가 가장 자연스럽다.

### 3-4. 디자인 방향

- Dieter Rams 계열의 원칙에서 특히 `Understandable`, `Unobtrusive`, `As little design as possible`를 채택한다.
- 즉 기능 수는 충분하되, 화면은 조용하고 명확해야 하며 고급 옵션은 전면 노출보다 점진적으로 드러내는 편이 좋다.

## 4. 제품 목표

이 앱의 1차 목표는 아래 세 가지를 동시에 만족하는 것이다.

- 누구나 브라우저에서 즉시 쓸 수 있는 가벼운 이미지 편집 도구
- 얼굴, 배경, UI, 문서 민감정보 등 여러 상황에 대응하는 범용 블러/가림 툴
- 서버 없이도 원본 해상도 결과물을 뽑아낼 수 있는 실용적인 로컬 편집기

## 5. MVP 범위 결정

### 5-1. 반드시 포함할 기능

- 이미지 업로드
- 편집 캔버스 표시
- 효과 종류 선택
- 클릭 적용
- 드래그 적용
- 사각형 영역 적용
- 브러시 크기 조절
- 강도 또는 블록 크기 조절
- 실행 취소 / 다시 실행
- 전체 초기화
- 원본 해상도 다운로드

### 5-2. 1차 MVP에서 채택할 효과 종류

MVP는 아래 2가지 효과 축을 기본 제공한다.

1. `Blur`
2. `Pixelate`

단, `Blur` 안에는 아래 2가지 스타일을 둔다.

- `Smooth`: 얼굴, 배경, 미감용 편집에 적합하다.
- `Solid Fill`: 민감정보 보호 용도에서 가장 명확하고 안전한 선택지다.

### 5-3. MVP에서 보류할 항목

- 모바일 터치 대응
- 자유형 라쏘 선택
- 계정/저장 기능
- 협업 기능
- 서버 렌더링
- AI 기반 자동 감지

## 6. 효과와 도구 설계

### 6-1. 효과 모델

각 효과는 서로 다른 목적을 가진다.

#### `Blur`

- 용도: 얼굴, 배경, 분위기 연출 또는 확실한 가림
- 하위 스타일: `Smooth`, `Solid Fill`
- 제어값: 강도 또는 색상/불투명도
- 시각 특성: 부드러운 경계, 자연스러운 흐림 또는 완전 덮기
- 주의: `Smooth`는 민감정보 완전 가림에는 권장하지 않음

#### `Pixelate`

- 용도: 텍스트, UI 일부, 클래식 모자이크 느낌
- 제어값: 블록 크기
- 시각 특성: 선명한 사각 블록
- 주의: 강한 보호 효과처럼 보일 수 있으나 보안 마스킹으로 단정하지 않음

### 6-2. 도구 모델

MVP는 아래 도구를 채택한다.

#### `Brush`

- 클릭 시 1회 스탬프처럼 적용
- 드래그 시 연속 스트로크 적용
- 얼굴, 배경, 불규칙한 영역에 적합

#### `Rectangle`

- 드래그로 직사각형 영역 지정 후 효과 적용
- 문서, 스크린샷, UI 텍스트 가림에 적합

이 조합을 택하는 이유는 다음과 같다.

- `Brush`만 있으면 자유도는 높지만 문서형 작업이 답답할 수 있다.
- `Rectangle`만 있으면 얼굴이나 곡선 영역이 불편하다.
- 둘 다 제공해야 범용 SaaS 툴로서 활용 범위가 넓다.

### 6-3. 효과 적용 규칙

- 한 이미지 안에서 여러 효과를 섞어 쓸 수 있어야 한다.
- 예시: 얼굴은 `Blur / Smooth`, 문서 번호는 `Blur / Solid Fill`, UI 일부는 `Pixelate`
- 따라서 설계는 단일 전역 블러 상태가 아니라 `행동(Action) 기반 누적 모델`로 잡는다.

## 7. 히스토리와 되돌리기 설계

### 7-1. 기본 원칙

되돌리기는 시간 기반이 아니라 행동 기반으로 설계한다.

- 클릭 1회는 히스토리 1단위
- 브러시 드래그 1회는 히스토리 1단위
- 사각형 영역 1회 적용은 히스토리 1단위

이 방식이 적절한 이유는 다음과 같다.

- 사용자는 보통 `방금 한 한 번의 행위`를 되돌리고 싶어 한다.
- 시간 기반 undo는 의도보다 많이 또는 적게 되돌아갈 수 있다.
- 드래그 중간 상태를 잘게 쪼개서 저장하면 히스토리도 불편하고 성능도 나빠진다.

### 7-2. 드래그 스트로크 처리 방식

- `pointerdown` 시 임시 액션 생성 시작
- `pointermove` 동안 포인트를 누적
- `pointerup` 시 하나의 완성된 액션으로 커밋
- 커밋 전까지는 preview 용도이며 히스토리에는 들어가지 않음

### 7-3. 다시 실행

- `Undo`와 함께 `Redo`도 포함한다.
- 데스크톱 편집기 기대치에 맞추기 위해 `Ctrl+Z`, `Ctrl+Shift+Z` 또는 `Ctrl+Y`를 지원한다.

### 7-4. 히스토리 저장 방식

MVP는 `액션 스택` 기반으로 설계한다.

- `undoStack`: 현재까지 적용된 액션 목록
- `redoStack`: 되돌린 액션 목록
- 각 액션은 도구, 효과, 강도, 좌표, 경로, 색상 같은 메타데이터를 가진다

이 방식을 선택하는 이유는 다음과 같다.

- 원본 해상도 렌더를 유지하기 쉽다.
- 다양한 효과를 섞어 써도 관리가 단순하다.
- 이미지 픽셀 전체를 매번 스냅샷하는 방식보다 메모리 효율이 좋다.

### 7-5. 히스토리 제한

- 기본 목표는 최소 `50` 액션 이상 안정적으로 처리하는 것이다.
- 필요하면 액션 수 또는 메모리 사용량 기준으로 상한을 둘 수 있다.

## 8. 원본 해상도 유지 전략

원본 해상도 유지는 제품 핵심 조건이다.

설계 방향은 다음과 같다.

- 업로드된 원본 이미지는 원래 해상도로 보존한다.
- 화면용 캔버스는 보기 좋은 크기로 축소 표시한다.
- 모든 액션 좌표는 최종적으로 원본 좌표계로 저장한다.
- 다운로드 시에는 원본 해상도 기준 오프스크린 캔버스에서 최종 합성 후 저장한다.

즉, 화면에서 작게 보이더라도 실제 데이터는 원본 기준으로 처리한다.

## 9. 렌더링 아키텍처 초안

### 9-1. 핵심 캔버스 구성

- `sourceCanvas`: 원본 이미지 보관
- `previewCanvas`: 화면 표시용 캔버스
- `exportCanvas`: 원본 해상도 합성용 캔버스
- `variantCache`: 효과별 사전 생성 버전 저장소

### 9-2. 사전 생성할 효과 버전

효과 종류와 강도 조합별로 필요한 경우 사전 생성 캐시를 둔다.

예시:

- `smooth-8`
- `smooth-16`
- `smooth-24`
- `pixelate-10`
- `pixelate-18`
- `pixelate-28`

이 구조가 필요한 이유는 다음과 같다.

- 드래그 중 매 프레임마다 고비용 블러 연산을 반복하지 않기 위해서다.
- 액션 재렌더링 시 효과 이미지를 재사용할 수 있다.
- 서로 다른 강도의 효과를 한 이미지 안에서 섞어 써도 대응할 수 있다.

### 9-3. 액션 기반 합성 방식

각 액션은 다음 형태의 데이터를 가진다.

```ts
type EditAction = {
  id: string
  tool: 'brush' | 'rectangle'
  effect: 'smooth' | 'pixelate' | 'redact'
  strengthKey: string
  color?: string
  opacity?: number
  brushSize?: number
  points?: Array<{ x: number; y: number }>
  rect?: { x: number; y: number; width: number; height: number }
}
```

렌더링 흐름은 다음과 같다.

1. 원본 이미지를 기준 캔버스에 그린다.
2. 액션 목록을 순서대로 순회한다.
3. 액션 효과에 맞는 캐시 이미지를 선택한다.
4. 액션 경로나 사각형 영역만큼 해당 효과를 합성한다.
5. `Blur / Solid Fill`은 캐시 이미지 대신 직접 덮어 그린다.

### 9-4. 미리보기와 최종 렌더 분리

- 드래그 중에는 화면용 저비용 preview를 우선한다.
- 액션이 확정되면 원본 해상도 기준 렌더를 갱신한다.
- 다운로드는 항상 최종 원본 해상도 렌더를 사용한다.

이 구조를 택하면 조작감과 출력 품질을 동시에 확보하기 쉽다.

## 10. 효과별 직접 구현 전략

### 10-1. `Blur / Smooth`

- `CanvasRenderingContext2D.filter`의 `blur()`를 활용해 사전 블러 버전을 만든다.
- 브라우저 지원은 최신 데스크톱 브라우저 기준으로 잡는다.
- 별도 블러 라이브러리는 사용하지 않는다.
- 지원 확인 실패 시에는 `Blur / Smooth`를 비활성화하고 `Pixelate`와 `Blur / Solid Fill`은 계속 사용할 수 있도록 설계한다.

### 10-2. `Pixelate`

- 원본 이미지를 작은 크기로 축소 후 다시 확대한다.
- 이때 `imageSmoothingEnabled = false`를 사용해 블록 느낌을 유지한다.
- 블록 크기는 사용자 제어값으로 둔다.

### 10-3. `Blur / Solid Fill`

- 지정 영역을 단색으로 직접 채운다.
- 기본값은 검정 100%로 두고, 흰색 옵션 정도만 추가 검토한다.

### 10-4. 향후 확장 후보

MVP 이후 아래 효과를 검토할 수 있다.

- `Feathered Redaction`
- `Secure Blur` 스타일 가림
- `Highlight`
- `Outline`

단, 첫 버전은 복잡도를 관리하기 위해 3종 효과에 집중한다.

## 11. UX/UI 방향

### 11-1. 시각 원칙

Dieter Rams 참고 방향을 다음처럼 해석한다.

- 정보 위계를 명확히 한다.
- 눈에 띄는 요소는 정말 필요한 것만 남긴다.
- 장식보다 기능을 우선한다.
- 학습 없이도 무엇을 눌러야 하는지 알 수 있어야 한다.

### 11-2. 레이아웃 초안

- 상단 바: 로고/제목, 업로드, 다운로드, 초기화
- 좌측 툴 레일: `Brush`, `Rectangle`, `Undo`, `Redo`
- 우측 속성 패널: 효과 종류, 강도, 크기, 색상, 도움말
- 중앙: 편집 캔버스

### 11-3. 상호작용 원칙

- 첫 진입 시 바로 업로드 CTA를 보여준다.
- 이미지를 올리면 즉시 편집 상태로 전환한다.
- 현재 선택된 도구와 효과를 항상 명확히 표시한다.
- 브러시 모드에서는 커서 프리뷰를 띄운다.
- 민감정보 가림이 필요한 경우 `Blur / Solid Fill 권장` 문구를 컨텍스트로 노출한다.

### 11-4. 설정 노출 방식

설정은 `기본 단순 / 필요 시 확장` 원칙을 따른다.

- 기본 노출: 효과 선택, 강도, 브러시 크기
- 조건부 노출: `Blur / Solid Fill` 선택 시 색상/불투명도
- 고급 옵션은 기본 접힘 상태로 둔다

### 11-5. 단축키

- `B`: 브러시
- `R`: 사각형
- `1`: Blur / Smooth
- `2`: Pixelate
- `3`: Blur / Solid Fill
- `Ctrl+Z`: 실행 취소
- `Ctrl+Shift+Z` 또는 `Ctrl+Y`: 다시 실행
- `[` / `]`: 브러시 크기 조절

## 12. 기술 선택 정리

### 12-1. 채택

- `React`: UI 상태와 패널 구성을 관리
- `Vanilla JavaScript`: 캔버스 렌더 로직 직접 구현
- `Canvas API`: 이미지 편집 처리 핵심
- `Vite`: 빠른 개발 환경 및 정적 빌드

### 12-2. 비채택

- 서버 사이드 기능
- 계정/세션
- 블러 전용 외부 렌더링 라이브러리

## 13. 구현 단계 제안

1. `Vite + React` 프로젝트 초기화
2. 업로드/레이아웃/기본 패널 구성
3. 원본 해상도 보존 캔버스 구조 구축
4. `Brush`, `Rectangle` 도구 구현
5. `Blur / Smooth` 사전 생성 캐시 구현
6. `Pixelate` 사전 생성 캐시 구현
7. `Blur / Solid Fill` 구현
8. 액션 스택 기반 `Undo/Redo` 구현
9. 원본 해상도 다운로드 구현
10. 단축키와 상태 안내 보완
11. 시각 디자인 다듬기

## 14. 주요 리스크와 대응

### 14-1. 고해상도 이미지 성능

리스크:

- 큰 이미지에서 블러 캐시 생성이 느릴 수 있다.

대응:

- 미리보기용과 최종 렌더용을 분리한다.
- 강도 프리셋 수를 제한한다.
- 드래그 중에는 preview 중심으로 처리한다.

### 14-2. 좌표 불일치

리스크:

- 화면 축소 비율과 원본 좌표계가 어긋나면 적용 위치가 틀어진다.

대응:

- 모든 액션 저장은 원본 좌표계 기준으로 통일한다.
- 표시 좌표와 원본 좌표 변환 유틸을 분리한다.

### 14-3. 보안 오해

리스크:

- 사용자가 일반 블러를 완전한 민감정보 보호 수단으로 오해할 수 있다.

대응:

- `Blur / Smooth`, `Pixelate`에는 용도 안내를 둔다.
- 민감정보에는 `Blur / Solid Fill` 권장 문구를 노출한다.

### 14-4. 브라우저 기능 차이

리스크:

- 일부 브라우저 또는 설정에서 `CanvasRenderingContext2D.filter` 동작이 다르거나 제한될 수 있다.

대응:

- 최신 데스크톱 브라우저를 지원 범위로 명시한다.
- 기능 감지 후 `Blur / Smooth`만 선택적으로 비활성화할 수 있게 만든다.
- `Pixelate`와 `Blur / Solid Fill`은 필터 의존 없이 동작하도록 유지한다.

## 15. 검증 계획

- `png`, `jpg`, `jpeg`, `webp` 업로드 확인
- 작은 이미지와 큰 이미지 모두에서 렌더 확인
- 클릭 1회가 히스토리 1단위인지 확인
- 드래그 1회가 히스토리 1단위인지 확인
- `Undo/Redo`가 효과 종류와 무관하게 정상 동작하는지 확인
- `Brush`와 `Rectangle`이 모두 정상 동작하는지 확인
- 한 이미지 안에서 여러 효과를 섞어 써도 결과가 일관적인지 확인
- 다운로드 결과가 원본 해상도인지 확인
- 다운로드 결과가 화면상 편집 내용과 일치하는지 확인

## 16. 제안 디렉토리 구조

```text
image-blur-editor/
  docs/
    PLAN.md
    UI-DESIGN.md
    UX-DESIGN.md
  src/
    app/
    components/
    features/
    lib/
    styles/
  public/
```

## 17. 참고 자료

조사 시 참고한 주요 자료:

- MDN `CanvasRenderingContext2D.filter`
  https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter
- MDN `CanvasRenderingContext2D.imageSmoothingEnabled`
  https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
- MDN `HTMLCanvasElement.toBlob()`
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- MDN `Optimizing canvas`
  https://developer.mozilla.org/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- tldraw `History (undo/redo)`
  https://tldraw.dev/sdk-features/history
- CleanShot X Features
  https://cleanshot.com/features
- Snagit tutorial `Hide Sensitive Information in an Image`
  https://www.techsmith.com/learn/tutorials/snagit/hide-sensitive-information/
- Snagit `Smart Redact`
  https://www.techsmith.com/snagit/features/smart-redact/
- Bishop Fox `Never Use Text Pixelation To Redact Sensitive Information`
  https://bishopfox.com/blog/unredacter-tool-never-pixelation
- Bishop Fox `Unredacter`
  https://bishopfox.com/tools/unredacter
- Reduct `Introducing Secure Blur`
  https://reduct.video/blog/secure-blur/
- Reduct Help `Redaction - PII Removal`
  https://help.reduct.video/en/articles/7829517-redaction-pii-removal
- Vitsœ `Good design`
  https://www.vitsoe.com/good-design

## 18. 현재 결론 요약

현재 기준으로 가장 적절한 1차 방향은 아래와 같다.

- 데스크톱 전용 정적 웹앱
- 로컬 편집 전용
- `Smooth Blur + Pixelate + Solid Redaction`
- `Brush + Rectangle`
- `행동 단위 Undo/Redo`
- `원본 해상도 유지 다운로드`
- Dieter Rams 성향의 단순하고 명확한 UI

다음 단계에서는 이 문서를 기준으로 실제 프로젝트 초기화와 MVP 구현으로 넘어간다.
