import { Client, APIErrorCode } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { nanoid } from "nanoid";
import type { Invoice, InvoiceItem } from "@/types/notion";

// ---------------------------------------------------------------------------
// 싱글톤 Notion 클라이언트
// ---------------------------------------------------------------------------

const globalForNotion = globalThis as unknown as {
  notion: Client | undefined;
};

export const notion =
  globalForNotion.notion ??
  new Client({
    auth: process.env.NOTION_TOKEN,
    notionVersion: "2022-06-28",
  });

if (process.env.NODE_ENV !== "production") globalForNotion.notion = notion;

// ---------------------------------------------------------------------------
// 타입 헬퍼 — Notion property 안전 추출
// ---------------------------------------------------------------------------

/**
 * PageObjectResponse.properties[string] 와 동일한 타입.
 * @notionhq/client 내부 타입을 직접 참조하되, src/types/notion.ts 의
 * NotionRawProperty 와는 별개로 SDK 원본 타입을 사용합니다.
 */
type NotionProperty = PageObjectResponse["properties"][string];

export function getTitle(page: PageObjectResponse): string | null {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("") || null;
    }
  }
  return null;
}

export function getRichText(prop: NotionProperty): string | null {
  if (prop.type !== "rich_text") return null;
  return prop.rich_text.map((t) => t.plain_text).join("") || null;
}

export function getNumber(prop: NotionProperty): number | null {
  if (prop.type !== "number") return null;
  return prop.number;
}

export function getDate(prop: NotionProperty): string | null {
  if (prop.type !== "date") return null;
  return prop.date?.start ?? null;
}

export function getSelect(prop: NotionProperty): string | null {
  if (prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

export function getMultiSelect(prop: NotionProperty): string[] {
  if (prop.type !== "multi_select") return [];
  return prop.multi_select.map((o) => o.name);
}

export function getStatus(prop: NotionProperty): string | null {
  if (prop.type !== "status") return null;
  return prop.status?.name ?? null;
}

export function getCheckbox(prop: NotionProperty): boolean | null {
  if (prop.type !== "checkbox") return null;
  return prop.checkbox;
}

export function getEmail(prop: NotionProperty): string | null {
  if (prop.type !== "email") return null;
  return prop.email;
}

export function getPhoneNumber(prop: NotionProperty): string | null {
  if (prop.type !== "phone_number") return null;
  return prop.phone_number;
}

export function getUrl(prop: NotionProperty): string | null {
  if (prop.type !== "url") return null;
  return prop.url;
}

export function getRelationIds(prop: NotionProperty): string[] {
  if (prop.type !== "relation") return [];
  return prop.relation.map((r) => r.id);
}

export function getRollupNumber(prop: NotionProperty): number | null {
  if (prop.type !== "rollup") return null;
  const rollup = prop.rollup;
  if (rollup.type === "number") return rollup.number;
  return null;
}

export function getCreatedTime(prop: NotionProperty): string | null {
  if (prop.type !== "created_time") return null;
  return prop.created_time;
}

export function getLastEditedTime(prop: NotionProperty): string | null {
  if (prop.type !== "last_edited_time") return null;
  return prop.last_edited_time;
}

export function getFormula(prop: NotionProperty): number | string | boolean | null {
  if (prop.type !== "formula") return null;
  const formula = prop.formula;
  if (formula.type === "number") return formula.number;
  if (formula.type === "string") return formula.string;
  if (formula.type === "boolean") return formula.boolean;
  return null;
}

// ---------------------------------------------------------------------------
// 견적서 데이터 타입 — src/types/notion.ts 에서 re-export
// ---------------------------------------------------------------------------

export type { Invoice, InvoiceItem, QuoteData, QuoteItemData, QuoteStatus } from "@/types/notion";

// ---------------------------------------------------------------------------
// Notion 페이지 파서
// ---------------------------------------------------------------------------

/**
 * Notion Invoices DB 페이지를 정규화된 Invoice 객체로 변환합니다.
 *
 * Notion 프로퍼티 이름 매핑 (한국어):
 *   "견적서 번호"  → quoteNumber    (title)
 *   "클라이언트명" → clientCompany  (rich_text)
 *   "발행일"      → issuedDate     (date)
 *   "유효기간"    → validUntil     (date)
 *   "상태"        → status         (status)
 *   "총 금액"     → total          (number)
 *   "항목"        → (relation — queryItemsByQuoteId 에서 사용)
 *   "share_slug"  → shareSlug      (rich_text)
 *   "is_public"   → isPublic       (checkbox)
 */
export function parseQuotePage(page: PageObjectResponse): Invoice {
  const props = page.properties;
  return {
    id: page.id,
    url: page.url,
    quoteNumber: getTitle(page),
    projectName: null,
    clientCompany: props["클라이언트명"] ? getRichText(props["클라이언트명"]) : null,
    clientContactName: null,
    clientEmail: null,
    issuedDate: props["발행일"] ? getDate(props["발행일"]) : null,
    validUntil: props["유효기간"] ? getDate(props["유효기간"]) : null,
    status: props["상태"] ? getStatus(props["상태"]) : null,
    subtotal: null,
    vat: null,
    total: props["총 금액"] ? getNumber(props["총 금액"]) : null,
    paymentTerms: null,
    notes: null,
    shareSlug: props["share_slug"] ? getRichText(props["share_slug"]) : null,
    isPublic: props["is_public"] ? getCheckbox(props["is_public"]) : null,
  };
}

/**
 * Notion Items DB 페이지를 정규화된 InvoiceItem 객체로 변환합니다.
 *
 * Notion 프로퍼티 이름 매핑:
 *   title       → name        (title)
 *   description → description (rich_text)
 *   quantity    → quantity    (number)
 *   unit_price  → unitPrice   (number)
 *   line_total  → lineTotal   (formula → number)
 *   quote       → (relation — queryItemsByQuoteId 필터에서 사용)
 */
export function parseQuoteItemPage(page: PageObjectResponse): InvoiceItem {
  const props = page.properties;
  return {
    id: page.id,
    name: getTitle(page),
    description: props["description"] ? getRichText(props["description"]) : null,
    quantity: props["quantity"] ? getNumber(props["quantity"]) : null,
    unitPrice: props["unit_price"] ? getNumber(props["unit_price"]) : null,
    lineTotal: props["line_total"] ? (getFormula(props["line_total"]) as number | null) : null,
  };
}

// ---------------------------------------------------------------------------
// 페이지네이션 헬퍼
// ---------------------------------------------------------------------------

async function queryAllFromDb(
  databaseId: string,
  filter?: QueryDatabaseParameters["filter"],
  sorts?: QueryDatabaseParameters["sorts"]
): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (page.object === "page" && "properties" in page) {
        results.push(page as PageObjectResponse);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results;
}

export async function queryAll(
  filter?: QueryDatabaseParameters["filter"],
  sorts?: QueryDatabaseParameters["sorts"]
): Promise<PageObjectResponse[]> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.");
  }
  return queryAllFromDb(databaseId, filter, sorts);
}

export async function queryItemsByQuoteId(quotePageId: string): Promise<PageObjectResponse[]> {
  const databaseId = process.env.NOTION_ITEM_DATABASE_ID;
  if (!databaseId) return [];
  return queryAllFromDb(databaseId, {
    property: "quote",
    relation: { contains: quotePageId },
  });
}

// ---------------------------------------------------------------------------
// 슬러그로 견적서 조회
// ---------------------------------------------------------------------------

export async function findBySlug(slug: string): Promise<PageObjectResponse | null> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return null;

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: "share_slug",
          rich_text: { equals: slug },
        },
        {
          property: "is_public",
          checkbox: { equals: true },
        },
      ],
    },
    page_size: 1,
  });

  const page = response.results[0];
  if (!page || page.object !== "page" || !("properties" in page)) return null;
  return page as PageObjectResponse;
}

// ---------------------------------------------------------------------------
// 슬러그 생성 후 Notion 페이지에 기록
// ---------------------------------------------------------------------------

export async function generateAndAttachSlug(pageId: string): Promise<string> {
  const slug = nanoid(21);

  await notion.pages.update({
    page_id: pageId,
    properties: {
      share_slug: {
        rich_text: [{ type: "text", text: { content: slug } }],
      },
      is_public: {
        checkbox: true,
      },
    },
  });

  return slug;
}

// ---------------------------------------------------------------------------
// 공개 상태 토글 (회수)
// ---------------------------------------------------------------------------

export async function revokeQuote(pageId: string): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      is_public: {
        checkbox: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Exponential backoff 래퍼 (Rate Limit 대응)
// ---------------------------------------------------------------------------

const BACKOFF_DELAYS = [250, 500, 1000, 2000, 4000];

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRateLimited =
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === APIErrorCode.RateLimited;

      if (!isRateLimited || attempt === BACKOFF_DELAYS.length) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, BACKOFF_DELAYS[attempt]));
    }
  }

  throw lastError;
}
