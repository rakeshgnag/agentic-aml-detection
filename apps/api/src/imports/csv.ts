export const csvHeaders = [
  "source_transaction_id",
  "timestamp",
  "sender_id",
  "receiver_id",
  "amount",
  "currency",
] as const;

export const maximumCsvBytes = 5 * 1024 * 1024;
export const maximumDataRows = 10_000;

export interface CsvRowError {
  row?: number;
  field?: string;
  message: string;
}

export interface AcceptedCsvTransaction {
  sourceTransactionId: string | null;
  sourceTimestampText: string;
  occurredAt: string;
  senderId: string;
  receiverId: string;
  amountDecimal: string;
  currency: string;
}

export class CsvValidationError extends Error {
  constructor(
    message: string,
    readonly rowErrors: CsvRowError[],
    readonly statusCode: 400 | 413 = 400,
  ) {
    super(message);
    this.name = "CsvValidationError";
  }
}

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;
  let recordHasContent = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        if (character === "\r" && text[index + 1] !== "\n") {
          throw new CsvValidationError(
            "The CSV contains malformed line endings.",
            [{ message: "Use LF or CRLF line endings." }],
          );
        }
        field += character;
      }
      continue;
    }

    if (afterQuote && character !== "," && character !== "\r" && character !== "\n") {
      throw new CsvValidationError(
        "The CSV contains malformed quoting.",
        [{ message: "Unexpected content after a closing quote." }],
      );
    }

    if (character === '"') {
      if (field.length > 0 || afterQuote) {
        throw new CsvValidationError(
          "The CSV contains malformed quoting.",
          [{ message: "A quoted field must begin with a quote." }],
        );
      }
      inQuotes = true;
      recordHasContent = true;
      continue;
    }

    if (character === ",") {
      record.push(field);
      field = "";
      afterQuote = false;
      recordHasContent = true;
      continue;
    }

    if (character === "\r" || character === "\n") {
      if (character === "\r") {
        if (text[index + 1] !== "\n") {
          throw new CsvValidationError(
            "The CSV contains malformed line endings.",
            [{ message: "Use LF or CRLF line endings." }],
          );
        }
        index += 1;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      afterQuote = false;
      recordHasContent = false;
      continue;
    }

    field += character;
    recordHasContent = true;
  }

  if (inQuotes) {
    throw new CsvValidationError(
      "The CSV contains malformed quoting.",
      [{ message: "A quoted field was not closed." }],
    );
  }

  if (recordHasContent || field.length > 0 || record.length > 0 || afterQuote) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function isValidTimestamp(value: string): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? "0");
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  if (
    !daysInMonth ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }
  if (
    offsetHourText !== undefined &&
    (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)
  ) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function parseAmount(value: string): boolean {
  return /^[+-]?\d+(?:\.\d+)?$/.test(value);
}

export function parseAndValidateCsv(
  bytes: Buffer,
): AcceptedCsvTransaction[] {
  if (bytes.length > maximumCsvBytes) {
    throw new CsvValidationError(
      "The CSV file exceeds the 5 MiB upload limit.",
      [{ message: "Choose a file no larger than 5 MiB." }],
      413,
    );
  }
  if (bytes.length === 0) {
    throw new CsvValidationError("The CSV file is empty.", [
      { message: "Add the required header and at least one transaction row." },
    ]);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new CsvValidationError("The CSV must be valid UTF-8.", [
      { message: "Save the file as UTF-8 and try again." },
    ]);
  }
  if (text.startsWith("\uFEFF")) {
    text = text.slice(1);
  }

  const records = parseCsvRecords(text);
  if (records.length === 0) {
    throw new CsvValidationError("The CSV file is empty.", [
      { message: "Add the required header and at least one transaction row." },
    ]);
  }

  const headers = records[0]!;
  const headerErrors: CsvRowError[] = [];
  const seenHeaders = new Set<string>();
  for (const header of headers) {
    if (seenHeaders.has(header)) {
      headerErrors.push({
        row: 1,
        field: "header",
        message: "Duplicate column header.",
      });
    }
    seenHeaders.add(header);
    if (!(csvHeaders as readonly string[]).includes(header)) {
      headerErrors.push({
        row: 1,
        field: "header",
        message: "Unexpected column header.",
      });
    }
  }
  for (const header of csvHeaders) {
    if (!seenHeaders.has(header)) {
      headerErrors.push({
        row: 1,
        field: header,
        message: "Required column header is missing.",
      });
    }
  }
  if (
    headers.length === csvHeaders.length &&
    headers.some((header, index) => header !== csvHeaders[index])
  ) {
    headerErrors.push({
      row: 1,
      field: "header",
      message: "Use the required columns in the specified order.",
    });
  }
  if (headerErrors.length > 0) {
    throw new CsvValidationError("The CSV headers do not match the required schema.", headerErrors);
  }

  const dataRecords = records.slice(1);
  if (dataRecords.length === 0) {
    throw new CsvValidationError("The CSV contains no transaction rows.", [
      { row: 1, message: "Add at least one transaction row." },
    ]);
  }
  if (dataRecords.length > maximumDataRows) {
    throw new CsvValidationError(
      "The CSV exceeds the 10,000 data-row limit.",
      [{ message: "Split the data into files containing at most 10,000 rows." }],
      413,
    );
  }

  const columnIndex = new Map(headers.map((header, index) => [header, index]));
  const transactions: AcceptedCsvTransaction[] = [];
  const rowErrors: CsvRowError[] = [];

  dataRecords.forEach((values, index) => {
    const row = index + 2;
    if (values.length !== headers.length) {
      rowErrors.push({
        row,
        field: "row",
        message: `Expected ${headers.length} columns but found ${values.length}.`,
      });
      return;
    }

    const get = (header: (typeof csvHeaders)[number]) =>
      values[columnIndex.get(header)!]!;
    const sourceTransactionId = get("source_transaction_id");
    const sourceTimestampText = get("timestamp");
    const senderId = get("sender_id");
    const receiverId = get("receiver_id");
    const amountDecimal = get("amount");
    const currency = get("currency");
    const requiredValues: Array<[string, string]> = [
      ["timestamp", sourceTimestampText],
      ["sender_id", senderId],
      ["receiver_id", receiverId],
      ["amount", amountDecimal],
      ["currency", currency],
    ];
    let invalid = false;

    for (const [fieldName, value] of requiredValues) {
      if (value.trim().length === 0) {
        rowErrors.push({ row, field: fieldName, message: "Value is required." });
        invalid = true;
      }
    }
    if (
      sourceTimestampText.trim().length > 0 &&
      !isValidTimestamp(sourceTimestampText)
    ) {
      rowErrors.push({
        row,
        field: "timestamp",
        message: "Use an ISO 8601 timestamp with an explicit timezone offset.",
      });
      invalid = true;
    }
    if (amountDecimal.trim().length > 0 && !parseAmount(amountDecimal)) {
      rowErrors.push({
        row,
        field: "amount",
        message: "Use a signed or unsigned plain decimal amount.",
      });
      invalid = true;
    }
    if (invalid) {
      return;
    }

    transactions.push({
      sourceTransactionId:
        sourceTransactionId.trim().length === 0 ? null : sourceTransactionId,
      sourceTimestampText,
      occurredAt: new Date(sourceTimestampText).toISOString(),
      senderId,
      receiverId,
      amountDecimal,
      currency,
    });
  });

  if (rowErrors.length > 0) {
    throw new CsvValidationError(
      "The CSV contains invalid transaction rows.",
      rowErrors,
    );
  }

  return transactions;
}
