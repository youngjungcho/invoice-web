# 프로덕션 환경변수 설정 가이드

## 1. 환경변수 목록

`.env.example`을 복사해서 `.env`를 만든 뒤 아래 값들을 채우세요.

```bash
cp .env.example .env
```

---

### DATABASE_URL

```env
DATABASE_URL="file:./dev.db"
```

- **개발**: SQLite 파일 경로 그대로 사용
- **프로덕션**: PostgreSQL로 교체 필요
  ```env
  DATABASE_URL="postgresql://user:password@host:5432/dbname"
  ```
  PostgreSQL 사용 시 `prisma/schema.prisma`의 provider를 `sqlite` → `postgresql`로 변경 후 `npx prisma migrate deploy` 실행

---

### AUTH_SECRET

```bash
# 반드시 아래 명령으로 생성할 것
openssl rand -base64 32
```

```env
AUTH_SECRET="생성된_랜덤_문자열"
```

> ⚠️ 이 값이 유출되면 JWT 토큰을 위조할 수 있습니다. 절대 외부에 노출하지 마세요.

---

### AUTH_URL

```env
# 개발
AUTH_URL="http://localhost:3000"

# 프로덕션 (실제 도메인으로 변경)
AUTH_URL="https://your-domain.com"
```

> NextAuth가 콜백 URL을 생성할 때 사용합니다. 실제 배포 도메인과 반드시 일치해야 합니다.

---

### NOTION_TOKEN

1. [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. "새 통합 만들기" 클릭
3. 이름 입력 후 생성 → "내부 통합 토큰" 복사
4. 견적서 Notion DB 페이지에서 `...` → "연결" → 생성한 통합 추가

```env
NOTION_TOKEN="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> ⚠️ 읽기 권한만 필요한 경우 "콘텐츠 읽기"만 허용하세요. `share_slug`, `is_public` 쓰기를 위해 "콘텐츠 업데이트"도 필요합니다.

---

### NOTION_DATABASE_ID

Notion 견적서 DB URL에서 추출합니다.

```
https://www.notion.so/workspace/38fb1a00dfa68005988fe56a22070433?v=...
                               ↑ 이 32자리 ID 사용 (하이픈 없이)
```

```env
NOTION_DATABASE_ID="38fb1a00dfa68005988fe56a22070433"
```

**필수 프로퍼티 목록** — 아래 속성이 Notion DB에 존재해야 합니다:

| 속성 키 | 타입 | 설명 |
|---------|------|------|
| `title` | title | 견적서 번호 |
| `project_name` | rich_text | 프로젝트명 |
| `client_company` | rich_text | 클라이언트 회사명 |
| `client_contact_name` | rich_text | 담당자명 |
| `client_email` | email | 클라이언트 이메일 |
| `issued_date` | date | 발행일 |
| `valid_until` | date | 유효기한 |
| `status` | status | 상태 (작성중/발송완료/승인/반려/만료) |
| `subtotal` | number | 공급가액 |
| `vat` | formula | `prop("subtotal") * 0.1` |
| `total` | formula | `prop("subtotal") + prop("vat")` |
| `payment_terms` | rich_text | 결제 조건 |
| `notes` | rich_text | 비고 |
| `share_slug` | rich_text | 공유 슬러그 (앱이 자동 기록) |
| `is_public` | checkbox | 공개 여부 (앱이 자동 기록) |

---

### NOTION_ITEM_DATABASE_ID (선택)

견적 항목(line items)을 별도 DB로 관리하는 경우에만 설정합니다.

```env
NOTION_ITEM_DATABASE_ID="your-item-database-id"
```

Items DB 필수 프로퍼티:

| 속성 키 | 타입 | 설명 |
|---------|------|------|
| `title` | title | 항목명 |
| `description` | rich_text | 설명 |
| `quantity` | number | 수량 |
| `unit_price` | number | 단가 |
| `line_total` | formula | `prop("quantity") * prop("unit_price")` |
| `quote` | relation | 견적서 DB와의 관계 |

---

### IP_HASH_SALT

조회 로그 기록 시 IP를 SHA-256으로 해시화할 때 사용하는 솔트입니다.

```bash
openssl rand -base64 32
```

```env
IP_HASH_SALT="생성된_랜덤_문자열"
```

> ⚠️ **중요**: 이 값을 변경하면 기존 `QuoteViewLog`의 해시값과 불일치가 발생합니다. 한 번 설정 후 변경하지 마세요.
> 기본값(`"default-salt-change-in-production"`) 그대로 프로덕션에 배포하지 마세요.

---

## 2. 배포 전 체크리스트

```bash
# 1. 마이그레이션 적용
npx prisma migrate deploy

# 2. 빌드 확인
npm run build

# 3. 환경변수 확인 (기본값 미사용 여부)
grep -E "generate-with|your-|default-salt" .env && echo "⚠️ 기본값 발견!" || echo "✅ 환경변수 설정 완료"
```

---

## 3. 보안 주의사항

- `NOTION_TOKEN`은 서버 컴포넌트와 API 라우트에서만 사용됩니다. 클라이언트 번들에 포함되지 않도록 `NEXT_PUBLIC_` 접두사를 절대 붙이지 마세요.
- `AUTH_SECRET`, `IP_HASH_SALT`는 git에 커밋하지 마세요. `.gitignore`에 `.env`가 포함되어 있는지 확인하세요.
