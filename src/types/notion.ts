/**
 * Notion 데이터베이스 타입 정의
 *
 * 두 계층으로 구분됩니다:
 *   1. Raw 타입  — Notion API가 반환하는 PageObjectResponse 기반 형태
 *   2. App 타입  — 앱 전반에서 사용하는 정규화된 형태
 *
 * Raw 타입은 `@notionhq/client`의 PageObjectResponse.properties 구조를
 * 정확히 미러링합니다. App 타입은 null-safe하고 평탄화된 값을 담습니다.
 */

import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

// ---------------------------------------------------------------------------
// 공통 Notion 프리미티브 타입
// ---------------------------------------------------------------------------

/** Notion rich_text 배열 내 단일 항목 */
export type NotionRichTextItem = RichTextItemResponse;

/** Notion select / status / multi_select 옵션 항목 */
export interface NotionSelectOption {
  id: string;
  name: string;
  color?: string;
}

/** Notion date 프로퍼티 값 */
export interface NotionDateValue {
  start: string;
  end: string | null;
  time_zone: string | null;
}

/** Notion formula 프로퍼티 결과 */
export type NotionFormulaValue =
  | { type: "number"; number: number | null }
  | { type: "string"; string: string | null }
  | { type: "boolean"; boolean: boolean | null }
  | { type: "date"; date: NotionDateValue | null };

/** Notion rollup 프로퍼티 결과 */
export type NotionRollupValue =
  | { type: "number"; number: number | null; function: string }
  | { type: "date"; date: NotionDateValue | null; function: string }
  | { type: "array"; array: unknown[]; function: string }
  | { type: "unsupported"; unsupported: Record<string, never>; function: string }
  | { type: "incomplete"; incomplete: Record<string, never>; function: string };

/** Notion relation 프로퍼티 — 연결된 페이지 ID 배열 */
export interface NotionRelationEntry {
  id: string;
}

// ---------------------------------------------------------------------------
// Raw Notion 프로퍼티 타입 — PageObjectResponse.properties[string] 와 1:1 대응
// ---------------------------------------------------------------------------

export type NotionRawTitleProperty = {
  type: "title";
  title: NotionRichTextItem[];
  id: string;
};

export type NotionRawRichTextProperty = {
  type: "rich_text";
  rich_text: NotionRichTextItem[];
  id: string;
};

export type NotionRawNumberProperty = {
  type: "number";
  number: number | null;
  id: string;
};

export type NotionRawSelectProperty = {
  type: "select";
  select: NotionSelectOption | null;
  id: string;
};

export type NotionRawMultiSelectProperty = {
  type: "multi_select";
  multi_select: NotionSelectOption[];
  id: string;
};

export type NotionRawStatusProperty = {
  type: "status";
  status: NotionSelectOption | null;
  id: string;
};

export type NotionRawDateProperty = {
  type: "date";
  date: NotionDateValue | null;
  id: string;
};

export type NotionRawCheckboxProperty = {
  type: "checkbox";
  checkbox: boolean;
  id: string;
};

export type NotionRawEmailProperty = {
  type: "email";
  email: string | null;
  id: string;
};

export type NotionRawPhoneNumberProperty = {
  type: "phone_number";
  phone_number: string | null;
  id: string;
};

export type NotionRawUrlProperty = {
  type: "url";
  url: string | null;
  id: string;
};

export type NotionRawFormulaProperty = {
  type: "formula";
  formula: NotionFormulaValue;
  id: string;
};

export type NotionRawRelationProperty = {
  type: "relation";
  relation: NotionRelationEntry[];
  id: string;
};

export type NotionRawRollupProperty = {
  type: "rollup";
  rollup: NotionRollupValue;
  id: string;
};

export type NotionRawCreatedTimeProperty = {
  type: "created_time";
  created_time: string;
  id: string;
};

export type NotionRawLastEditedTimeProperty = {
  type: "last_edited_time";
  last_edited_time: string;
  id: string;
};

/** 모든 지원 프로퍼티 타입의 유니온 */
export type NotionRawProperty =
  | NotionRawTitleProperty
  | NotionRawRichTextProperty
  | NotionRawNumberProperty
  | NotionRawSelectProperty
  | NotionRawMultiSelectProperty
  | NotionRawStatusProperty
  | NotionRawDateProperty
  | NotionRawCheckboxProperty
  | NotionRawEmailProperty
  | NotionRawPhoneNumberProperty
  | NotionRawUrlProperty
  | NotionRawFormulaProperty
  | NotionRawRelationProperty
  | NotionRawRollupProperty
  | NotionRawCreatedTimeProperty
  | NotionRawLastEditedTimeProperty;

// ---------------------------------------------------------------------------
// Raw Notion 데이터베이스 페이지 타입
// ---------------------------------------------------------------------------

/**
 * Invoices 데이터베이스 페이지의 raw properties 구조.
 *
 * CSV 컬럼 기준:
 *   견적서 번호(title), 발행일(date), 상태(status), 유효기간(date),
 *   총 금액(formula or rollup), 클라이언트명(rich_text), 항목(relation)
 *
 * Notion API 직접 조회 기준 (notion.ts에서 사용 중인 필드 이름):
 *   project_name, client_company, client_contact_name, client_email,
 *   issued_date, valid_until, status, subtotal, vat, total,
 *   payment_terms, notes, share_slug, is_public
 */
export interface NotionRawInvoiceProperties {
  /** 견적서 번호 — Invoices DB의 title 프로퍼티 */
  [key: string]: NotionRawProperty;
}

/**
 * Items(견적 항목) 데이터베이스 페이지의 raw properties 구조.
 *
 * CSV 컬럼 기준:
 *   항목명(title), Invoices(relation), 금액(formula), 단가(number), 수량(number)
 *
 * Notion API 직접 조회 기준 (notion.ts에서 사용 중인 필드 이름):
 *   description, quantity, unit_price, line_total, quote(relation)
 */
export interface NotionRawItemProperties {
  [key: string]: NotionRawProperty;
}

/**
 * Notion Invoices 데이터베이스 페이지 (raw API 응답).
 * PageObjectResponse를 그대로 사용하되 타입 앨리어스로 명시합니다.
 */
export type NotionRawInvoicePage = PageObjectResponse;

/**
 * Notion Items 데이터베이스 페이지 (raw API 응답).
 */
export type NotionRawItemPage = PageObjectResponse;

// ---------------------------------------------------------------------------
// App 타입 — 정규화된 앱 내부 데이터 모델
// ---------------------------------------------------------------------------

/**
 * 견적서 상태 값.
 * Notion status 프로퍼티의 name 필드와 일치합니다.
 */
export type QuoteStatus =
  | "작성중"
  | "발송완료"
  | "승인"
  | "반려"
  | "만료"
  | (string & {}); // 추후 추가되는 상태를 위한 fallback

/**
 * 견적 항목 (정규화).
 *
 * Notion Items DB의 한 행에 해당합니다.
 */
export interface InvoiceItem {
  /** Notion 페이지 ID */
  id: string;
  /** 항목명 — title 프로퍼티 */
  name: string | null;
  /** 항목 설명 — rich_text 프로퍼티 */
  description: string | null;
  /** 수량 — number 프로퍼티 */
  quantity: number | null;
  /** 단가 (원) — number 프로퍼티 */
  unitPrice: number | null;
  /** 행 합계 = 수량 * 단가 — formula 프로퍼티 */
  lineTotal: number | null;
}

/**
 * 견적서 (정규화).
 *
 * Notion Invoices DB의 한 행에 해당합니다.
 * items는 연관된 Items DB 페이지를 파싱한 배열입니다.
 */
export interface Invoice {
  /** Notion 페이지 ID */
  id: string;
  /** Notion 페이지 URL */
  url: string;
  /** 견적서 번호 — title 프로퍼티 (예: QAD-2913-333) */
  quoteNumber: string | null;
  /** 프로젝트명 — rich_text 프로퍼티 */
  projectName: string | null;
  /** 클라이언트 회사명 — rich_text 프로퍼티 */
  clientCompany: string | null;
  /** 클라이언트 담당자명 — rich_text 프로퍼티 */
  clientContactName: string | null;
  /** 클라이언트 이메일 — email 프로퍼티 */
  clientEmail: string | null;
  /** 발행일 (ISO 8601 date string) — date 프로퍼티 */
  issuedDate: string | null;
  /** 유효기한 (ISO 8601 date string) — date 프로퍼티 */
  validUntil: string | null;
  /** 상태 — status 프로퍼티 */
  status: QuoteStatus | null;
  /** 공급가액 (원, VAT 제외) — number 프로퍼티 */
  subtotal: number | null;
  /** 부가세 10% — formula 프로퍼티 */
  vat: number | null;
  /** 합계 (공급가액 + 부가세) — formula 프로퍼티 */
  total: number | null;
  /** 결제 조건 — rich_text 프로퍼티 */
  paymentTerms: string | null;
  /** 비고 — rich_text 프로퍼티 */
  notes: string | null;
  /** 공개 공유 슬러그 — rich_text 프로퍼티 (nanoid 21자) */
  shareSlug: string | null;
  /** 공개 여부 — checkbox 프로퍼티 */
  isPublic: boolean | null;
  /** 견적 항목 목록 (별도 쿼리 후 첨부) */
  items?: InvoiceItem[];
}

// ---------------------------------------------------------------------------
// 기존 코드와의 하위 호환 앨리어스
// ---------------------------------------------------------------------------

/**
 * @deprecated Invoice 타입을 사용하세요.
 * 기존 코드(`src/lib/notion.ts`)와의 호환성을 위해 유지합니다.
 */
export type QuoteData = Invoice;

/**
 * @deprecated InvoiceItem 타입을 사용하세요.
 * 기존 코드(`src/lib/notion.ts`)와의 호환성을 위해 유지합니다.
 */
export type QuoteItemData = InvoiceItem;
