// Standardized error response shape for the auth API.
export interface ErrorPayload {
  errorCode: string;
  message: string;
  details?: unknown;
}
