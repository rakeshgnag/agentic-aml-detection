import type { Request } from "express";
import { maximumCsvBytes } from "./csv.js";

export class MultipartRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 413 = 400,
  ) {
    super(message);
    this.name = "MultipartRequestError";
  }
}

const maximumMultipartBytes = maximumCsvBytes + 64 * 1024;

async function readRequestBody(request: Request): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumMultipartBytes) {
      request.resume();
      throw new MultipartRequestError(
        "The multipart request exceeds the upload limit.",
        413,
      );
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks, size);
}

function getBoundary(contentType: string | undefined): string {
  if (!contentType?.toLowerCase().startsWith("multipart/form-data")) {
    throw new MultipartRequestError(
      "Send the CSV as multipart/form-data in a file field named file.",
    );
  }
  const match = /(?:^|;)\s*boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  if (!boundary || boundary.length > 70) {
    throw new MultipartRequestError("The multipart boundary is missing or invalid.");
  }
  return boundary;
}

function extractFilePart(body: Buffer, boundary: string): Buffer {
  const opening = Buffer.from(`--${boundary}\r\n`);
  const nextBoundary = Buffer.from(`\r\n--${boundary}`);
  if (!body.subarray(0, opening.length).equals(opening)) {
    throw new MultipartRequestError("The multipart body is malformed.");
  }

  let cursor = opening.length;
  let file: Buffer | undefined;
  let partCount = 0;

  while (true) {
    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), cursor);
    if (headerEnd < 0) {
      throw new MultipartRequestError("The multipart body is malformed.");
    }
    const headers = body.subarray(cursor, headerEnd).toString("latin1");
    const disposition = /^content-disposition:\s*form-data\s*;([^\r\n]*)$/im.exec(
      headers,
    );
    const name = /(?:^|;)\s*name="([^"]*)"/i.exec(disposition?.[1] ?? "")?.[1];
    const filename = /(?:^|;)\s*filename="([^"]*)"/i.exec(
      disposition?.[1] ?? "",
    )?.[1];
    const contentStart = headerEnd + 4;
    const boundaryAt = body.indexOf(nextBoundary, contentStart);
    if (boundaryAt < 0) {
      throw new MultipartRequestError("The multipart body is malformed.");
    }

    partCount += 1;
    if (partCount > 1 || name !== "file" || filename === undefined) {
      throw new MultipartRequestError(
        "Provide exactly one uploaded file in the file field.",
      );
    }
    file = body.subarray(contentStart, boundaryAt);

    cursor = boundaryAt + nextBoundary.length;
    const marker = body.subarray(cursor, cursor + 2).toString("ascii");
    if (marker === "--") {
      cursor += 2;
      if (
        cursor < body.length &&
        !body.subarray(cursor).equals(Buffer.from("\r\n"))
      ) {
        throw new MultipartRequestError("The multipart body has trailing content.");
      }
      break;
    }
    if (marker !== "\r\n") {
      throw new MultipartRequestError("The multipart body is malformed.");
    }
    cursor += 2;
  }

  if (partCount !== 1 || file === undefined) {
    throw new MultipartRequestError("The uploaded file is missing.");
  }
  return file;
}

export async function readUploadedCsv(request: Request): Promise<Buffer> {
  const boundary = getBoundary(request.header("content-type"));
  const body = await readRequestBody(request);
  return extractFilePart(body, boundary);
}
