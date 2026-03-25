# DESIGN.md — 디자인 가이드

## 디자인 철학

- **기능 우선.** 영업사원이 미팅 5분 전에 열어도 바로 쓸 수 있어야 한다. 장식보다 정보 밀도.
- **신뢰감.** 재무 데이터를 다루는 앱이다. 과도한 색상이나 애니메이션은 오히려 신뢰를 깎는다.
- **일관성.** 색상, 여백, 폰트 크기는 이 문서의 규칙을 따른다. 임의로 선택하지 않는다.

---

## 레이아웃

### 전체 구조
- 사이드바(20%) + 메인 콘텐츠(80%) 2단 구조
- 사이드바: 네비게이션 전용. 콘텐츠 없음.
- 메인: 상단 톱바 44px 고정 + 스크롤 가능한 콘텐츠 영역

### 콘텐츠 너비
- 메인 콘텐츠 내부 패딩: `px-5` (20px)
- 최대 너비 제한 없음 — 전체 너비 사용

### 반응형
- MVP 타겟: 데스크톱 1280px 이상
- 모바일 최적화: Post-MVP

---

## 컬러 시스템

CSS 변수를 사용한다. 라이트/다크 모드 자동 대응.

### 시맨틱 색상 (용도별 고정)

| 용도 | 배경 | 텍스트 | 테두리 |
|---|---|---|---|
| 위험 이슈 | `bg-red-50` | `text-red-700` | `border-red-400` |
| 주의 이슈 | `bg-amber-50` | `text-amber-700` | `border-amber-400` |
| 양호 / 긍정 | `bg-green-50` | `text-green-700` | — |
| 정보 / 강조 | `bg-blue-50` | `text-blue-700` | `border-blue-300` |
| 전년 대비 상승 | — | `text-blue-600` | — |
| 전년 대비 하락 | — | `text-red-600` | — |

### 페르소나 색상 (다각도 분석 섹션 전용)

| 페르소나 | 배경 | 텍스트 |
|---|---|---|
| 재무 Point | `bg-blue-50` | `text-blue-800` |
| Sale Point | `bg-green-50` | `text-green-800` |
| 전달 전략 | `bg-purple-50` | `text-purple-800` |
| 접근 방식 | `bg-amber-50` | `text-amber-800` |

---

## 타이포그래피

| 용도 | 크기 | 굵기 |
|---|---|---|
| 페이지 타이틀 | 18px | 500 |
| 섹션 헤딩 | 12px | 500 (uppercase, letter-spacing) |
| 카드 제목 | 14~15px | 500 |
| 본문 | 13px | 400 |
| 보조 텍스트 | 12px | 400 |
| 레이블 / 태그 | 11px | 500 |
| 최소 폰트 | 10px | — |

폰트 패밀리: 시스템 기본 (`font-sans`). 별도 웹폰트 없음 (로딩 속도 우선).

---

## 간격 (Spacing)

- 섹션 간 마진: `mb-6` (24px)
- 카드 내부 패딩: `p-4` (16px)
- 그리드 gap: `gap-2` (8px) ~ `gap-3` (12px)
- 아이콘-텍스트 간격: `gap-2` (8px)

---

## 컴포넌트 스타일

### 카드
```
bg-white / dark:bg-background-primary
border border-border-tertiary (0.5px)
rounded-lg
p-4
```

### 배지 / 태그
```
rounded-full
px-2.5 py-0.5
text-xs font-medium
```

### 버튼 — 주요 액션
```
bg-blue-700 text-blue-50
rounded-md px-4 py-2
text-sm font-medium
hover: bg-blue-800
```

### 버튼 — 보조 액션
```
bg-transparent
border border-border-tertiary
rounded-md px-3 py-1.5
text-sm text-text-secondary
hover: bg-background-secondary
```

### 이슈 카드 (왼쪽 세로선 스타일)
```
border-left: 3px solid {severity-color}
border-radius: 0 rounded-md rounded-md 0
padding: 10px 14px
background: {severity-color}-50
```

---

## 아이콘

SVG 인라인 방식 사용. 외부 아이콘 라이브러리 금지 (번들 크기 증가 방지).

크기 기준:
- 톱바 / 사이드바 아이콘: 14px
- 카드 내 아이콘: 16px
- 모달 내 아이콘: 18~20px
- 페르소나 아이콘 원 내부: 22px

---

## 모달

- 배경 오버레이: `rgba(0,0,0,0.4)`
- 모달 너비: 최대 560px
- 패딩: 24px
- 닫기 버튼: 우상단 ✕, 28px 원형
- 오버레이 클릭 시 닫힘

---

## 로딩 상태

- 스켈레톤 UI 사용 (`animate-pulse` + `bg-gray-100` 블록)
- 분석 진행 중: 단계별 텍스트 + 프로그레스 바
- 스피너 단독 사용 금지 — 항상 안내 텍스트 함께 제공

---

## 금지 사항

- 그라디언트 배경 금지
- 드롭섀도우 (`drop-shadow`, `box-shadow`) 금지 — 포커스 링 제외
- 다크 배경의 외부 컨테이너 금지
- 인라인 `style` 속성으로 색상 하드코딩 금지
- 6개 이상의 색상을 한 화면에 동시 사용 금지
