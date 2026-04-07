# Examples

> **상태**: 예시
> **목적**: `ehowlsla` overlay 개념을 특정 프로젝트에 대입한 예시 문서의 진입점이다.
> **대상 독자**: 개념 문서를 실제 use case에 연결해 보고 싶은 독자
> **관련 문서**: [`../README.md`](../README.md), [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md)


이 디렉터리는 `ehowlsla` 브랜치 컨셉을 **특정 프로젝트에 대입한 예시 문서**를 모아둔다.

범용 문서는 상위 `doc/ehowlsla/` 루트에 두고,
프로젝트별 적용 예시는 이 폴더에서 관리한다.

기준 용어와 overlay 용어 차이는 [`../CONCEPT-MAP.md`](../CONCEPT-MAP.md)를 기준으로 읽는 편이 좋다.

이 브랜치에서는 examples를 단순 사례로만 보지 않는다.
각 문서는 나중에 실제 company package로 발전할 수 있는
**템플릿 시드(template seed)** 역할도 함께 하도록 관리한다.

관련 범용 문서는 [`../TEMPLATE-SEEDS.md`](../TEMPLATE-SEEDS.md)를 참고한다.

읽는 순서는 보통 아래가 자연스럽다.

1. 예시 본문 (`ai-jobdori.md`, `rovel-ai2.md`, `ai-saju2.md`)
2. 필요하면 비교 문서 (`ai-jobdori-comparison.md`)
3. 패키지 초안 (`*-package-draft.md`)

## 문서 목록

- [`ai-jobdori.md`](./ai-jobdori.md)
  - 콘텐츠 파이프라인형 프로젝트를 Paperclip 회사로 운영하는 예시
- [`ai-jobdori-package-draft.md`](./ai-jobdori-package-draft.md)
  - ai-jobdori를 실제 `agentcompanies/v1` 패키지 초안으로 내린 문서
- [`ai-jobdori-comparison.md`](./ai-jobdori-comparison.md)
  - 기존 배치 운영과 Paperclip 제어면의 비교 예시
- [`rovel-ai2.md`](./rovel-ai2.md)
  - 스튜디오형 프로젝트를 Paperclip 회사로 운영하는 예시
- [`rovel-ai2-package-draft.md`](./rovel-ai2-package-draft.md)
  - rovel.ai2를 실제 `agentcompanies/v1` 패키지 초안으로 내린 문서
