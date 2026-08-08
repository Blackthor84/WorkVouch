export type ValidationErrorCode =
  | "REQUIRED_FIELD_MISSING"
  | "UNKNOWN_ENUM"
  | "INVALID_STATUS"
  | "MISSING_ID"
  | "MALFORMED_PAYLOAD"
  | "DUPLICATE_EVENT"
  | "OUT_OF_ORDER_EVENT";

export interface TypedValidationError {
  code: ValidationErrorCode;
  field?: string;
  message: string;
}

export interface EventValidationResult {
  valid: boolean;
  errors: TypedValidationError[];
  warnings: TypedValidationError[];
}

export interface EventValidationContext {
  eventId?: string;
  eventType?: string;
  sequenceNumber?: number;
  receivedAt?: string;
}
