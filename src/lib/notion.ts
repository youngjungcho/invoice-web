import { Client, APIErrorCode } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { nanoid } from "nanoid";

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

type NotionPage = PageObjectResponse;
type NotionProperties = NotionPage["properties"];
type NotionProperty = NotionProperties[string];

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

export function getFormula(prop: NotionProperty): number | string | boolean | null {
  if (prop.type !== "formula") return null;
  const formula = prop.formula;
  if (formula.type === "number") return formula.number;
  if (formula.type === "string") return formula.string;
  if (formula.type === "boolean") return formula.boolean;
  return null;
}

// ---------------------------------------------------------------------------
// 견적서 데이터 타입
// ---------------------------------------------------------------------------

export interface QuoteData {
  id: string;
  url: string;
  quoteNumber: string | null;
  projectName: string | null;
  clientCompany: string | null;
  clientContactName: string | null;
  clientEmail: string | null;
  issuedDate: string | null;
  validUntil: string | null;
  status: string | null;
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  paymentTerms: string | null;
  notes: string | null;
  shareSlug: string | null;
  isPublic: boolean | null;
}

export function parseQuotePage(page: PageObjectResponse): QuoteData {
  const props = page.properties;
  return {
    id: page.id,
    url: page.url,
    quoteNumber: getTitle(page),
    projectName: props["project_name"] ? getRichText(props["project_name"]) : null,
    clientCompany: props["client_company"] ? getRichText(props["client_company"]) : null,
    clientContactName: props["client_contact_name"]
      ? getRichText(props["client_contact_name"])
      : null,
    clientEmail: props["client_email"] ? getEmail(props["client_email"]) : null,
    issuedDate: props["issued_date"] ? getDate(props["issued_date"]) : null,
    validUntil: props["valid_until"] ? getDate(props["valid_until"]) : null,
    status: props["status"] ? getStatus(props["status"]) : null,
    subtotal: props["subtotal"] ? getNumber(props["subtotal"]) : null,
    vat: props["vat"] ? getFormula(props["vat"]) as number | null : null,
    total: props["total"] ? getFormula(props["total"]) as number | null : null,
    paymentTerms: props["payment_terms"] ? getRichText(props["payment_terms"]) : null,
    notes: props["notes"] ? getRichText(props["notes"]) : null,
    shareSlug: props["share_slug"] ? getRichText(props["share_slug"]) : null,
    isPublic: props["is_public"] ? getCheckbox(props["is_public"]) : null,
  };
}

// ---------------------------------------------------------------------------
// 페이지네이션 헬퍼
// ---------------------------------------------------------------------------

export async function queryAll(
  filter?: QueryDatabaseParameters["filter"],
  sorts?: QueryDatabaseParameters["sorts"]
): Promise<PageObjectResponse[]> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.");
  }

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
