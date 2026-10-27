import { z } from "zod";

export const correlationIdSchema = z.uuid().describe("Request correlation ID");

export const responseMetadataSchema = z
  .object({ correlationId: correlationIdSchema })
  .strict();

export const apiRootResponseSchema = z
  .object({
    data: z
      .object({
        name: z.literal("Vowora API"),
        version: z.literal("v1"),
        status: z.literal("ok"),
        links: z
          .object({
            auth: z.literal("/api/v1/auth/get-session"),
            health: z.literal("/api/v1/health"),
            openapi: z.literal("/api/v1/openapi.json"),
          })
          .strict(),
      })
      .strict(),
    meta: responseMetadataSchema,
  })
  .strict()
  .describe("API v1 root response");

export const healthResponseSchema = z
  .object({
    data: z
      .object({
        service: z.literal("vowora-api"),
        version: z.literal("v1"),
        status: z.literal("ok"),
      })
      .strict(),
    meta: responseMetadataSchema,
  })
  .strict()
  .describe("API v1 liveness response");

export const problemDetailsSchema = z
  .object({
    type: z.url(),
    title: z.string().min(1),
    status: z.int().min(400).max(599),
    detail: z.string().min(1),
    instance: z.string().startsWith("/"),
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    correlationId: correlationIdSchema,
  })
  .strict()
  .describe("RFC 9457 Problem Details response");

export const passwordRecoveryAcknowledgementSchema = z
  .object({
    status: z.literal(true),
    message: z.string().min(1),
  })
  .strict()
  .describe("Enumeration-safe password recovery acknowledgement");

export const passwordResetResponseSchema = z
  .object({ status: z.literal(true) })
  .strict()
  .describe("Successful password reset response");

export const accountSessionSchema = z
  .object({
    id: z.uuidv7(),
    current: z.boolean(),
    device: z.string().min(1).max(100),
    createdAt: z.iso.datetime(),
    lastActiveAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  })
  .strict()
  .describe("Privacy-minimized account session");

export const accountSessionsResponseSchema = z
  .object({
    data: z.array(accountSessionSchema),
    meta: responseMetadataSchema,
  })
  .strict()
  .describe("Active account sessions response");

export type ApiRootResponse = z.infer<typeof apiRootResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
export type AccountSession = z.infer<typeof accountSessionSchema>;
export type AccountSessionsResponse = z.infer<
  typeof accountSessionsResponseSchema
>;

const problemResponse = (description: string) => ({
  description,
  content: {
    "application/problem+json": {
      schema: { $ref: "#/components/schemas/ProblemDetails" },
    },
  },
});

const methodNotAllowedOperation = (operationId: string) => ({
  operationId,
  responses: {
    "405": { $ref: "#/components/responses/MethodNotAllowed" },
  },
});

const notFoundOperation = (operationId: string) => ({
  operationId,
  responses: {
    "404": { $ref: "#/components/responses/ResourceNotFound" },
  },
});

const authenticationFailure = {
  $ref: "#/components/responses/AuthenticationFailed",
} as const;
const sessionServiceFailure = {
  $ref: "#/components/responses/SessionServiceFailure",
} as const;

const emailPasswordRequest = (includeName: boolean) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ...(includeName
            ? { name: { type: "string", minLength: 1, maxLength: 100 } }
            : {}),
          email: { type: "string", format: "email", maxLength: 320 },
          password: { type: "string", minLength: 12, maxLength: 128 },
          callbackURL: { type: "string", format: "uri", maxLength: 2048 },
        },
        required: [
          ...(includeName ? ["name"] : []),
          "email",
          "password",
          "callbackURL",
        ],
      },
    },
  },
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Vowora API",
    version: "1.0.0",
    description: "Versioned public contract for the Vowora application API.",
  },
  paths: {
    "/api/v1": {
      get: {
        operationId: "getApiRoot",
        responses: {
          "200": {
            description: "API discovery response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiRootResponse" },
              },
            },
          },
        },
      },
      post: methodNotAllowedOperation("rejectApiRootPost"),
      put: methodNotAllowedOperation("rejectApiRootPut"),
      patch: methodNotAllowedOperation("rejectApiRootPatch"),
      delete: methodNotAllowedOperation("rejectApiRootDelete"),
    },
    "/api/v1/health": {
      get: {
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Application liveness response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
      post: methodNotAllowedOperation("rejectHealthPost"),
      put: methodNotAllowedOperation("rejectHealthPut"),
      patch: methodNotAllowedOperation("rejectHealthPatch"),
      delete: methodNotAllowedOperation("rejectHealthDelete"),
    },
    "/api/v1/openapi.json": {
      get: {
        operationId: "getOpenApiDocument",
        responses: {
          "200": {
            description: "OpenAPI 3.1 document for the versioned API",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
      post: methodNotAllowedOperation("rejectOpenApiDocumentPost"),
      put: methodNotAllowedOperation("rejectOpenApiDocumentPut"),
      patch: methodNotAllowedOperation("rejectOpenApiDocumentPatch"),
      delete: methodNotAllowedOperation("rejectOpenApiDocumentDelete"),
    },
    "/api/v1/auth/sign-up/email": {
      post: {
        operationId: "signUpWithEmail",
        requestBody: emailPasswordRequest(true),
        responses: {
          "200": {
            description:
              "Account accepted; verification is required before sign-in.",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": authenticationFailure,
          "403": authenticationFailure,
          "429": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/sign-in/email": {
      post: {
        operationId: "signInWithEmail",
        requestBody: emailPasswordRequest(false),
        responses: {
          "200": {
            description: "Verified account session created.",
            headers: {
              "Set-Cookie": {
                description: "Secure, HTTP-only, host-only web session cookie.",
                schema: { type: "string" },
              },
            },
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": authenticationFailure,
          "403": authenticationFailure,
          "429": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/send-verification-email": {
      post: {
        operationId: "sendVerificationEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  email: { type: "string", format: "email", maxLength: 320 },
                  callbackURL: {
                    type: "string",
                    format: "uri",
                    maxLength: 2048,
                  },
                },
                required: ["email", "callbackURL"],
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Enumeration-safe acknowledgement regardless of account existence.",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": authenticationFailure,
          "429": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/verify-email": {
      get: {
        operationId: "verifyEmail",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "callbackURL",
            in: "query",
            required: false,
            schema: { type: "string", format: "uri" },
          },
        ],
        responses: {
          "302": { description: "Email verified and redirected to the app." },
          "400": authenticationFailure,
          "403": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/get-session": {
      get: {
        operationId: "getAuthenticationSession",
        responses: {
          "200": {
            description: "Current session, or null when anonymous.",
            content: {
              "application/json": {
                schema: { oneOf: [{ type: "object" }, { type: "null" }] },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/request-password-reset": {
      post: {
        operationId: "requestPasswordReset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  email: { type: "string", format: "email", maxLength: 320 },
                  redirectTo: {
                    type: "string",
                    format: "uri",
                    maxLength: 2048,
                  },
                },
                required: ["email", "redirectTo"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Enumeration-safe recovery acknowledgement.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PasswordRecoveryAcknowledgement",
                },
              },
            },
          },
          "400": authenticationFailure,
          "429": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        operationId: "resetPassword",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  token: { type: "string", minLength: 1, maxLength: 4096 },
                  newPassword: {
                    type: "string",
                    minLength: 12,
                    maxLength: 128,
                  },
                },
                required: ["token", "newPassword"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset and existing sessions revoked.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PasswordResetResponse" },
              },
            },
          },
          "400": authenticationFailure,
        },
      },
    },
    "/api/v1/auth/reset-password/{token}": {
      parameters: [
        {
          name: "token",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 1, maxLength: 4096 },
        },
      ],
      get: {
        operationId: "openPasswordResetLink",
        parameters: [
          {
            name: "callbackURL",
            in: "query",
            required: true,
            schema: { type: "string", format: "uri", maxLength: 2048 },
          },
        ],
        responses: {
          "302": {
            description:
              "Redirect to the same-origin reset page with a valid token or safe error code.",
            headers: {
              Location: {
                description: "Same-origin password reset page.",
                schema: { type: "string", format: "uri" },
              },
            },
          },
          "400": authenticationFailure,
          "403": authenticationFailure,
        },
      },
    },
    "/api/v1/account/sessions": {
      get: {
        operationId: "listAccountSessions",
        responses: {
          "200": {
            description: "Privacy-minimized active session list.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AccountSessionsResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": authenticationFailure,
          "500": sessionServiceFailure,
        },
      },
      delete: {
        operationId: "revokeOtherAccountSessions",
        responses: {
          "204": { description: "Other sessions revoked." },
          "401": authenticationFailure,
          "403": authenticationFailure,
          "500": sessionServiceFailure,
        },
      },
    },
    "/api/v1/account/sessions/{sessionId}": {
      parameters: [
        {
          name: "sessionId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      delete: {
        operationId: "revokeAccountSession",
        responses: {
          "204": { description: "Session revoked." },
          "401": authenticationFailure,
          "403": authenticationFailure,
          "404": { $ref: "#/components/responses/ResourceNotFound" },
          "500": sessionServiceFailure,
        },
      },
    },
    "/api/v1/{path}": {
      parameters: [
        {
          name: "path",
          in: "path",
          required: true,
          description:
            "Joined unmatched path below the versioned API root; the runtime catch-all can contain multiple segments.",
          schema: { type: "string" },
        },
      ],
      get: notFoundOperation("getUnknownApiResource"),
      head: notFoundOperation("headUnknownApiResource"),
      post: notFoundOperation("postUnknownApiResource"),
      put: notFoundOperation("putUnknownApiResource"),
      patch: notFoundOperation("patchUnknownApiResource"),
      delete: notFoundOperation("deleteUnknownApiResource"),
      options: notFoundOperation("optionsUnknownApiResource"),
    },
  },
  components: {
    responses: {
      ResourceNotFound: problemResponse(
        "The requested versioned API resource does not exist.",
      ),
      MethodNotAllowed: {
        ...problemResponse("The resource does not support this HTTP method."),
        headers: {
          Allow: {
            description: "Methods supported by the resource.",
            schema: { type: "string", example: "GET, HEAD, OPTIONS" },
          },
        },
      },
      AuthenticationFailed: problemResponse(
        "The authentication request could not be completed.",
      ),
      SessionServiceFailure: problemResponse(
        "The session request could not be completed.",
      ),
    },
    schemas: {
      ApiRootResponse: z.toJSONSchema(apiRootResponseSchema, {
        target: "draft-2020-12",
      }),
      HealthResponse: z.toJSONSchema(healthResponseSchema, {
        target: "draft-2020-12",
      }),
      ProblemDetails: z.toJSONSchema(problemDetailsSchema, {
        target: "draft-2020-12",
      }),
      PasswordRecoveryAcknowledgement: z.toJSONSchema(
        passwordRecoveryAcknowledgementSchema,
        { target: "draft-2020-12" },
      ),
      PasswordResetResponse: z.toJSONSchema(passwordResetResponseSchema, {
        target: "draft-2020-12",
      }),
      AccountSessionsResponse: z.toJSONSchema(accountSessionsResponseSchema, {
        target: "draft-2020-12",
      }),
    },
  },
} as const;
