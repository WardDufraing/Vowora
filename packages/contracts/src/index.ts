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

const supportedTimeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Unsupported IANA time zone");

export const createWeddingRequestSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120),
    weddingDate: z.iso.date().nullable(),
    timeZone: supportedTimeZoneSchema,
  })
  .describe("Couple self-service wedding workspace creation request");

export const updateWeddingSettingsRequestSchema = z
  .strictObject({
    expectedVersion: z.number().int().positive(),
    name: z.string().trim().min(1).max(120),
    weddingDate: z.iso.date().nullable(),
    timeZone: supportedTimeZoneSchema,
  })
  .describe("Optimistic wedding workspace settings update");

export const weddingSchema = z
  .strictObject({
    id: z.uuidv7(),
    name: z.string().min(1).max(120),
    weddingDate: z.iso.date().nullable(),
    timeZone: supportedTimeZoneSchema,
    settingsVersion: z.number().int().positive(),
  })
  .describe("Wedding workspace settings");

export const weddingResponseSchema = z
  .strictObject({
    data: weddingSchema,
    meta: responseMetadataSchema.extend({ replayed: z.boolean().optional() }),
  })
  .describe("Wedding workspace response");

export const createPartnerInvitationRequestSchema = z
  .strictObject({
    email: z.email().max(320),
    locale: z.enum(["en", "nl", "fr", "de"]),
  })
  .describe("Issue a single-use second-partner invitation");

export const weddingInvitationSchema = z.strictObject({
  id: z.uuidv7(),
  weddingId: z.uuidv7(),
  invitedEmail: z.email(),
  role: z.literal("partner"),
  status: z.enum(["pending", "accepted", "revoked", "replaced"]),
  expiresAt: z.iso.datetime(),
  reminderAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const partnerInvitationResponseSchema = z.strictObject({
  data: weddingInvitationSchema.extend({
    acceptancePath: z.string().startsWith("/invitations/"),
  }),
  meta: responseMetadataSchema,
});

export const partnerInvitationsResponseSchema = z.strictObject({
  data: z.array(weddingInvitationSchema),
  meta: responseMetadataSchema,
});

export const acceptPartnerInvitationRequestSchema = z.strictObject({
  accept: z.literal(true),
});

export const acceptPartnerInvitationResponseSchema = z.strictObject({
  data: z.strictObject({ weddingId: z.uuidv7() }),
  meta: responseMetadataSchema.extend({ replayed: z.boolean() }),
});

export const organizationMemberSchema = z.strictObject({
  id: z.uuidv7(),
  actorId: z.uuidv7(),
  name: z.string().min(1).max(100),
  email: z.email().max(320),
  role: z.enum(["owner", "manager", "employee"]),
  status: z.enum(["active", "revoked"]),
});
export const createOrganizationRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
});
export const organizationSchema = z.strictObject({
  id: z.uuidv7(),
  name: z.string().min(1).max(120),
});
export const organizationResponseSchema = z.strictObject({
  data: organizationSchema,
  meta: responseMetadataSchema.extend({ replayed: z.boolean() }),
});
export const createOrganizationInvitationRequestSchema = z.strictObject({
  email: z.email().max(320),
  role: z.enum(["manager", "employee"]),
  locale: z.enum(["en", "nl", "fr", "de"]),
  reissueInvitationId: z.uuidv7().optional(),
});
export const organizationInvitationSchema = z.strictObject({
  id: z.uuidv7(),
  organizationId: z.uuidv7(),
  invitedEmail: z.email().max(320),
  role: z.enum(["manager", "employee"]),
  status: z.enum(["pending", "accepted", "revoked", "replaced"]),
  expiresAt: z.iso.datetime(),
  reminderAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});
export const organizationInvitationResponseSchema = z.strictObject({
  data: organizationInvitationSchema.extend({
    acceptancePath: z.string().startsWith("/organization-invitations/"),
  }),
  meta: responseMetadataSchema.extend({ replayed: z.boolean() }),
});
export const organizationInvitationsResponseSchema = z.strictObject({
  data: z.array(organizationInvitationSchema),
  meta: responseMetadataSchema,
});

export const permissionCeilingEntrySchema = z.strictObject({
  area: z.enum([
    "settings",
    "tasks",
    "schedule",
    "guests",
    "contacts",
    "vendors",
    "budget",
    "documents",
    "notes",
    "decisions",
    "inspiration",
  ]),
  actions: z
    .array(z.enum(["view", "edit", "download_export"]))
    .min(1)
    .max(3),
});
export const createWeddingOrganizationInvitationRequestSchema = z.strictObject({
  organizationId: z.uuidv7(),
  permissionCeiling: z.array(permissionCeilingEntrySchema).max(11),
  reissueInvitationId: z.uuidv7().optional(),
});
export const weddingOrganizationInvitationSchema = z.strictObject({
  id: z.uuidv7(),
  weddingId: z.uuidv7(),
  organizationId: z.uuidv7(),
  organizationName: z.string().min(1),
  status: z.enum(["pending", "accepted", "rejected", "revoked", "replaced"]),
  permissionCeiling: z.array(permissionCeilingEntrySchema),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});
export const weddingOrganizationInvitationsResponseSchema = z.strictObject({
  data: z.array(weddingOrganizationInvitationSchema),
  meta: responseMetadataSchema,
});
export const weddingOrganizationInvitationResponseSchema = z.strictObject({
  data: weddingOrganizationInvitationSchema,
  meta: responseMetadataSchema.extend({ replayed: z.boolean().optional() }),
});
export const respondWeddingOrganizationInvitationRequestSchema = z.strictObject(
  { decision: z.enum(["accept", "reject"]) },
);
export const respondWeddingOrganizationInvitationResponseSchema =
  z.strictObject({
    data: z.strictObject({
      accepted: z.boolean(),
      access: z
        .strictObject({
          id: z.uuidv7(),
          weddingId: z.uuidv7(),
          organizationId: z.uuidv7(),
          status: z.literal("active"),
          permissionCeiling: z.array(permissionCeilingEntrySchema),
          grantedAt: z.iso.datetime(),
        })
        .optional(),
    }),
    meta: responseMetadataSchema,
  });
export const assignWeddingOrganizationStaffRequestSchema = z.strictObject({
  organizationMembershipId: z.uuidv7(),
  permissions: z.array(permissionCeilingEntrySchema).max(11),
  isLead: z.boolean().optional(),
});
export const weddingOrganizationStaffAssignmentSchema = z.strictObject({
  id: z.uuidv7(),
  accessId: z.uuidv7(),
  organizationMembershipId: z.uuidv7(),
  status: z.enum(["active", "revoked"]),
  isLead: z.boolean(),
  permissions: z.array(permissionCeilingEntrySchema),
});
export const weddingOrganizationStaffAssignmentResponseSchema = z.strictObject({
  data: weddingOrganizationStaffAssignmentSchema,
  meta: responseMetadataSchema,
});
export const weddingOrganizationAccessManagementSchema = z.strictObject({
  id: z.uuidv7(),
  weddingId: z.uuidv7(),
  weddingName: z.string().min(1),
  status: z.literal("active"),
  permissionCeiling: z.array(permissionCeilingEntrySchema),
  assignments: z.array(
    z.strictObject({
      id: z.uuidv7(),
      organizationMembershipId: z.uuidv7(),
      role: z.enum(["owner", "manager", "employee"]),
      status: z.literal("active"),
      isLead: z.boolean(),
      permissions: z.array(permissionCeilingEntrySchema),
      absenceStartsAt: z.iso.datetime().nullable(),
      absenceEndsAt: z.iso.datetime().nullable(),
    }),
  ),
});
export const weddingOrganizationAccessManagementResponseSchema = z.strictObject(
  {
    data: weddingOrganizationAccessManagementSchema,
    meta: responseMetadataSchema,
  },
);
export const weddingOrganizationPartnerAccessResponseSchema = z.strictObject({
  data: z.strictObject({
    id: z.uuidv7(),
    organizationId: z.uuidv7(),
    organizationName: z.string().min(1),
    permissionCeiling: z.array(permissionCeilingEntrySchema),
    assignments: z.array(
      z.strictObject({
        id: z.uuidv7(),
        organizationMembershipId: z.uuidv7(),
        name: z.string().min(1),
        role: z.enum(["owner", "manager", "employee"]),
        isLead: z.boolean(),
        active: z.boolean(),
        blocked: z.boolean(),
      }),
    ),
  }),
  meta: responseMetadataSchema,
});
export const restrictWeddingOrganizationStaffRequestSchema = z.strictObject({
  organizationMembershipId: z.uuidv7(),
  blocked: z.boolean(),
});
export const updateLeadPlannerAbsenceRequestSchema = z
  .strictObject({
    startsAt: z.iso.datetime().nullable(),
    endsAt: z.iso.datetime().nullable(),
  })
  .refine((value) => (value.startsAt === null) === (value.endsAt === null), {
    path: ["endsAt"],
  });
export const acceptOrganizationInvitationRequestSchema = z.strictObject({
  accept: z.literal(true),
});
export const acceptOrganizationInvitationResponseSchema = z.strictObject({
  data: z.strictObject({ organizationId: z.uuidv7() }),
  meta: responseMetadataSchema.extend({ replayed: z.boolean() }),
});
export const organizationMembersResponseSchema = z.strictObject({
  data: z.array(organizationMemberSchema),
  meta: responseMetadataSchema,
});

export type ApiRootResponse = z.infer<typeof apiRootResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
export type AccountSession = z.infer<typeof accountSessionSchema>;
export type AccountSessionsResponse = z.infer<
  typeof accountSessionsResponseSchema
>;
export type CreateWeddingRequest = z.infer<typeof createWeddingRequestSchema>;
export type UpdateWeddingSettingsRequest = z.infer<
  typeof updateWeddingSettingsRequestSchema
>;
export type WeddingResponse = z.infer<typeof weddingResponseSchema>;
export type CreatePartnerInvitationRequest = z.infer<
  typeof createPartnerInvitationRequestSchema
>;
export type PartnerInvitationResponse = z.infer<
  typeof partnerInvitationResponseSchema
>;
export type AcceptPartnerInvitationRequest = z.infer<
  typeof acceptPartnerInvitationRequestSchema
>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type CreateOrganizationRequest = z.infer<
  typeof createOrganizationRequestSchema
>;
export type CreateOrganizationInvitationRequest = z.infer<
  typeof createOrganizationInvitationRequestSchema
>;
export type PermissionCeilingEntry = z.infer<
  typeof permissionCeilingEntrySchema
>;
export type CreateWeddingOrganizationInvitationRequest = z.infer<
  typeof createWeddingOrganizationInvitationRequestSchema
>;
export type RespondWeddingOrganizationInvitationRequest = z.infer<
  typeof respondWeddingOrganizationInvitationRequestSchema
>;
export type AssignWeddingOrganizationStaffRequest = z.infer<
  typeof assignWeddingOrganizationStaffRequestSchema
>;
export type RestrictWeddingOrganizationStaffRequest = z.infer<
  typeof restrictWeddingOrganizationStaffRequestSchema
>;
export type UpdateLeadPlannerAbsenceRequest = z.infer<
  typeof updateLeadPlannerAbsenceRequestSchema
>;
export type OrganizationInvitation = z.infer<
  typeof organizationInvitationSchema
>;
export type AcceptOrganizationInvitationRequest = z.infer<
  typeof acceptOrganizationInvitationRequestSchema
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
const authenticationServiceFailure = {
  $ref: "#/components/responses/AuthenticationServiceFailure",
} as const;
const authenticationRateLimited = {
  $ref: "#/components/responses/AuthenticationRateLimited",
} as const;
const sessionServiceFailure = {
  $ref: "#/components/responses/SessionServiceFailure",
} as const;

const authChallengeParameter = {
  name: "x-vowora-challenge-token",
  in: "header",
  required: false,
  description:
    "Single-use challenge token supplied only after an additional-verification response.",
  schema: { type: "string", minLength: 1, maxLength: 4096 },
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
        parameters: [authChallengeParameter],
        requestBody: emailPasswordRequest(true),
        responses: {
          "200": {
            description:
              "Account accepted; verification is required before sign-in.",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": authenticationFailure,
          "403": authenticationFailure,
          "429": authenticationRateLimited,
          "500": authenticationServiceFailure,
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/auth/sign-out": {
      post: {
        operationId: "signOut",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {},
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Current session revoked and the host-only session cookie cleared. A request with no session is acknowledged without creating one.",
            headers: {
              "Set-Cookie": {
                description:
                  "Expires the host-only, HTTP-only session cookie. No Domain attribute is set.",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: { success: { type: "boolean" } },
                  required: ["success"],
                },
              },
            },
          },
          "400": authenticationFailure,
          "403": authenticationFailure,
          "500": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/auth/sign-in/email": {
      post: {
        operationId: "signInWithEmail",
        parameters: [authChallengeParameter],
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
          "401": authenticationFailure,
          "403": authenticationFailure,
          "429": authenticationRateLimited,
          "500": authenticationServiceFailure,
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/auth/send-verification-email": {
      post: {
        operationId: "sendVerificationEmail",
        parameters: [authChallengeParameter],
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
          "403": authenticationFailure,
          "429": authenticationRateLimited,
          "500": authenticationServiceFailure,
          "503": authenticationServiceFailure,
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
          "500": authenticationServiceFailure,
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
          "500": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/auth/request-password-reset": {
      post: {
        operationId: "requestPasswordReset",
        parameters: [authChallengeParameter],
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
          "403": authenticationFailure,
          "429": authenticationRateLimited,
          "500": authenticationServiceFailure,
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        operationId: "resetPassword",
        parameters: [authChallengeParameter],
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
          "403": authenticationFailure,
          "429": authenticationRateLimited,
          "500": authenticationServiceFailure,
          "503": authenticationServiceFailure,
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
          "500": authenticationServiceFailure,
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
          "429": authenticationRateLimited,
          "500": sessionServiceFailure,
          "503": authenticationServiceFailure,
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
          "429": authenticationRateLimited,
          "500": sessionServiceFailure,
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/weddings": {
      post: {
        operationId: "createWeddingWorkspace",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateWeddingRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Wedding workspace created or safely replayed.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeddingResponse" },
              },
            },
          },
          "400": problemResponse("The creation request is invalid."),
          "401": authenticationFailure,
          "409": problemResponse("The idempotency key conflicts."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/weddings/{weddingId}": {
      parameters: [
        {
          name: "weddingId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      patch: {
        operationId: "updateWeddingWorkspaceSettings",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateWeddingSettingsRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated wedding workspace settings.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeddingResponse" },
              },
            },
          },
          "400": problemResponse("The settings request is invalid."),
          "401": authenticationFailure,
          "403": problemResponse("The settings request is not permitted."),
          "409": problemResponse("The settings changed before the update."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/weddings/{weddingId}/invitations": {
      parameters: [
        {
          name: "weddingId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      post: {
        operationId: "createPartnerInvitation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreatePartnerInvitationRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Partner invitation created.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("The invitation request is invalid."),
          "401": authenticationFailure,
          "403": problemResponse("The invitation request is not permitted."),
          "409": problemResponse("A partner or invitation already exists."),
          "503": authenticationServiceFailure,
        },
      },
      get: {
        operationId: "listPartnerInvitations",
        responses: {
          "200": {
            description: "Pending partner invitations.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PartnerInvitationsResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("Invitation management is not permitted."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/weddings/{weddingId}/invitations/{invitationId}": {
      parameters: [
        {
          name: "weddingId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "invitationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      delete: {
        operationId: "revokePartnerInvitation",
        responses: {
          "204": { description: "Pending invitation revoked." },
          "401": authenticationFailure,
          "403": problemResponse("The revocation is not permitted."),
          "404": problemResponse("The invitation is unavailable."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/invitations/{token}/accept": {
      parameters: [
        {
          name: "token",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 32, maxLength: 256 },
        },
      ],
      post: {
        operationId: "acceptPartnerInvitation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AcceptPartnerInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Invitation accepted or safely replayed.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AcceptPartnerInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("Explicit acceptance is required."),
          "401": authenticationFailure,
          "403": problemResponse("Email verification is required."),
          "404": problemResponse("The invitation is unavailable."),
          "409": problemResponse("The wedding already has both partners."),
          "410": problemResponse("The invitation expired."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/invitations/pending/{invitationId}/accept": {
      parameters: [
        {
          name: "invitationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      post: {
        operationId: "acceptPartnerInvitationByVerifiedEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AcceptPartnerInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email invitation accepted or safely replayed.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AcceptPartnerInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("Explicit acceptance is required."),
          "401": authenticationFailure,
          "403": problemResponse("Email verification is required."),
          "404": problemResponse("The invitation is unavailable."),
          "409": problemResponse("The wedding already has both partners."),
          "410": problemResponse("The invitation expired."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/organizations": {
      post: {
        operationId: "createOrganization",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateOrganizationRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Planner organization created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrganizationResponse" },
              },
            },
          },
          "400": problemResponse("The request is invalid."),
          "401": authenticationFailure,
          "403": problemResponse("A verified email is required."),
          "409": problemResponse("The idempotency key conflicts."),
          "503": authenticationServiceFailure,
        },
      },
    },
    "/api/v1/weddings/{weddingId}/planner-organizations/invitations": {
      parameters: [
        {
          name: "weddingId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "listWeddingOrganizationInvitations",
        responses: {
          "200": {
            description: "Planner organization invitations.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationInvitationsResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("Planner access is unavailable."),
        },
      },
      post: {
        operationId: "createWeddingOrganizationInvitation",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateWeddingOrganizationInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Idempotent invitation replay.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationInvitationResponse",
                },
              },
            },
          },
          "201": {
            description: "Invitation created.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("The request is invalid."),
          "401": authenticationFailure,
          "403": problemResponse("Planner access is unavailable."),
          "409": problemResponse(
            "The invitation conflicts with current state.",
          ),
        },
      },
    },
    "/api/v1/weddings/{weddingId}/planner-organizations/invitations/{invitationId}":
      {
        parameters: [
          {
            name: "weddingId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "invitationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        delete: {
          operationId: "revokeWeddingOrganizationInvitation",
          responses: {
            "204": { description: "Pending invitation revoked." },
            "401": authenticationFailure,
            "403": problemResponse("The request could not be completed."),
            "404": problemResponse("The invitation is unavailable."),
          },
        },
      },
    "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}": {
      parameters: [
        {
          name: "weddingId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "accessId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "getWeddingOrganizationPartnerAccess",
        responses: {
          "200": {
            description: "Privacy-minimized active planner access.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationPartnerAccessResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("Planner access is unavailable."),
          "404": problemResponse("Planner access is unavailable."),
        },
      },
      delete: {
        operationId: "revokeWeddingOrganizationAccess",
        responses: {
          "204": { description: "Planner organization access revoked." },
          "401": authenticationFailure,
          "403": problemResponse("Planner access is unavailable."),
          "404": problemResponse("Planner access is unavailable."),
        },
      },
    },
    "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}/restrictions":
      {
        parameters: [
          {
            name: "weddingId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "accessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        patch: {
          operationId: "setWeddingOrganizationStaffRestriction",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RestrictWeddingOrganizationStaffRequest",
                },
              },
            },
          },
          responses: {
            "200": { description: "Couple staff restriction updated." },
            "400": problemResponse("The restriction is invalid."),
            "401": authenticationFailure,
            "403": problemResponse("Planner access is unavailable."),
            "404": problemResponse("The restriction is unavailable."),
          },
        },
      },
    "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}/absence":
      {
        parameters: [
          {
            name: "weddingId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "accessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        patch: {
          operationId: "updateLeadPlannerAbsence",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateLeadPlannerAbsenceRequest",
                },
              },
            },
          },
          responses: {
            "200": { description: "Lead planner absence updated." },
            "400": problemResponse("The absence window is invalid."),
            "401": authenticationFailure,
            "403": problemResponse("Planner access is unavailable."),
          },
        },
      },
    "/api/v1/organizations/{organizationId}/wedding-invitations": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "listOrganizationWeddingInvitations",
        responses: {
          "200": { description: "Pending wedding invitations." },
          "401": authenticationFailure,
          "403": problemResponse("Invitations are unavailable."),
        },
      },
    },
    "/api/v1/organizations/{organizationId}/wedding-invitations/{invitationId}":
      {
        parameters: [
          {
            name: "organizationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "invitationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        patch: {
          operationId: "respondWeddingOrganizationInvitation",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RespondWeddingOrganizationInvitationRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Invitation accepted or rejected.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RespondWeddingOrganizationInvitationResponse",
                  },
                },
              },
            },
            "400": problemResponse("The response is invalid."),
            "401": authenticationFailure,
            "403": problemResponse("The response is not permitted."),
            "409": problemResponse("The invitation is unavailable."),
          },
        },
      },
    "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/staff": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "accessId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "getWeddingOrganizationStaffAssignments",
        responses: {
          "200": {
            description: "Active organization wedding access and assignments.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationAccessManagementResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "404": problemResponse("Planner access is unavailable."),
        },
      },
      post: {
        operationId: "assignWeddingOrganizationStaff",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AssignWeddingOrganizationStaffRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Organization staff assigned to wedding.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WeddingOrganizationStaffAssignmentResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("The assignment is not permitted."),
          "409": problemResponse(
            "The assignment conflicts with current access.",
          ),
        },
      },
    },
    "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/staff/{assignmentId}":
      {
        parameters: [
          {
            name: "organizationId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "accessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "assignmentId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        delete: {
          operationId: "removeWeddingOrganizationStaff",
          responses: {
            "204": { description: "Organization staff removed from wedding." },
            "401": authenticationFailure,
            "403": problemResponse("The assignment is not permitted."),
            "404": problemResponse("The assignment is unavailable."),
          },
        },
      },
    "/api/v1/organizations/{organizationId}/staff": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "listOrganizationStaff",
        responses: {
          "200": {
            description: "Organization staff.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OrganizationMembersResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("Organization access is unavailable."),
        },
      },
    },
    "/api/v1/organizations/{organizationId}/staff/{membershipId}": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "membershipId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      delete: {
        operationId: "deactivateOrganizationStaff",
        responses: {
          "200": { description: "Staff member deactivated." },
          "401": authenticationFailure,
          "403": problemResponse("The staff change is not permitted."),
        },
      },
    },
    "/api/v1/organizations/{organizationId}/invitations": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        operationId: "listOrganizationInvitations",
        responses: {
          "200": {
            description: "Pending staff invitations.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OrganizationInvitationsResponse",
                },
              },
            },
          },
          "401": authenticationFailure,
          "403": problemResponse("Invitation management is unavailable."),
        },
      },
      post: {
        operationId: "createOrganizationInvitation",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateOrganizationInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Existing staff invitation returned for a retry.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OrganizationInvitationResponse",
                },
              },
            },
          },
          "201": {
            description: "Staff invitation created.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OrganizationInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("The request is invalid."),
          "401": authenticationFailure,
          "403": problemResponse("Invitation management is unavailable."),
          "409": problemResponse(
            "The invitation conflicts with current state.",
          ),
        },
      },
    },
    "/api/v1/organizations/{organizationId}/invitations/{invitationId}": {
      parameters: [
        {
          name: "organizationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "invitationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      delete: {
        operationId: "revokeOrganizationInvitation",
        responses: {
          "204": { description: "Pending invitation revoked." },
          "401": authenticationFailure,
          "403": problemResponse("The request could not be completed."),
          "404": problemResponse("The invitation is unavailable."),
        },
      },
    },
    "/api/v1/organization-invitations/{token}/accept": {
      parameters: [
        {
          name: "token",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 32, maxLength: 256 },
        },
      ],
      post: {
        operationId: "acceptOrganizationInvitation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AcceptOrganizationInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Invitation accepted or safely replayed.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AcceptOrganizationInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("Explicit acceptance is required."),
          "401": authenticationFailure,
          "403": problemResponse("The invitation is unavailable."),
          "404": problemResponse("The invitation is unavailable."),
        },
      },
    },
    "/api/v1/organization-invitations/pending/{invitationId}/accept": {
      parameters: [
        {
          name: "invitationId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      post: {
        operationId: "acceptOrganizationInvitationByVerifiedEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AcceptOrganizationInvitationRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email invitation accepted or safely replayed.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AcceptOrganizationInvitationResponse",
                },
              },
            },
          },
          "400": problemResponse("Explicit acceptance is required."),
          "401": authenticationFailure,
          "403": problemResponse("The invitation is unavailable."),
          "404": problemResponse("The invitation is unavailable."),
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
      AuthenticationRateLimited: {
        ...problemResponse("Too many authentication attempts were made."),
        headers: {
          "Retry-After": {
            description: "Seconds before another attempt should be made.",
            schema: { type: "integer", minimum: 1, maximum: 900 },
          },
        },
      },
      AuthenticationServiceFailure: problemResponse(
        "The authentication service is temporarily unavailable.",
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
      CreateWeddingRequest: z.toJSONSchema(createWeddingRequestSchema, {
        target: "draft-2020-12",
      }),
      UpdateWeddingSettingsRequest: z.toJSONSchema(
        updateWeddingSettingsRequestSchema,
        { target: "draft-2020-12" },
      ),
      WeddingResponse: z.toJSONSchema(weddingResponseSchema, {
        target: "draft-2020-12",
      }),
      CreatePartnerInvitationRequest: z.toJSONSchema(
        createPartnerInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      PartnerInvitationResponse: z.toJSONSchema(
        partnerInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
      PartnerInvitationsResponse: z.toJSONSchema(
        partnerInvitationsResponseSchema,
        { target: "draft-2020-12" },
      ),
      AcceptPartnerInvitationRequest: z.toJSONSchema(
        acceptPartnerInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      AcceptPartnerInvitationResponse: z.toJSONSchema(
        acceptPartnerInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
      CreateOrganizationRequest: z.toJSONSchema(
        createOrganizationRequestSchema,
        { target: "draft-2020-12" },
      ),
      OrganizationResponse: z.toJSONSchema(organizationResponseSchema, {
        target: "draft-2020-12",
      }),
      OrganizationMembersResponse: z.toJSONSchema(
        organizationMembersResponseSchema,
        { target: "draft-2020-12" },
      ),
      CreateOrganizationInvitationRequest: z.toJSONSchema(
        createOrganizationInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      OrganizationInvitationResponse: z.toJSONSchema(
        organizationInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
      OrganizationInvitationsResponse: z.toJSONSchema(
        organizationInvitationsResponseSchema,
        { target: "draft-2020-12" },
      ),
      CreateWeddingOrganizationInvitationRequest: z.toJSONSchema(
        createWeddingOrganizationInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      WeddingOrganizationInvitationResponse: z.toJSONSchema(
        weddingOrganizationInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
      WeddingOrganizationInvitationsResponse: z.toJSONSchema(
        weddingOrganizationInvitationsResponseSchema,
        { target: "draft-2020-12" },
      ),
      RespondWeddingOrganizationInvitationRequest: z.toJSONSchema(
        respondWeddingOrganizationInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      RespondWeddingOrganizationInvitationResponse: z.toJSONSchema(
        respondWeddingOrganizationInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
      AssignWeddingOrganizationStaffRequest: z.toJSONSchema(
        assignWeddingOrganizationStaffRequestSchema,
        { target: "draft-2020-12" },
      ),
      WeddingOrganizationStaffAssignmentResponse: z.toJSONSchema(
        weddingOrganizationStaffAssignmentResponseSchema,
        { target: "draft-2020-12" },
      ),
      WeddingOrganizationAccessManagementResponse: z.toJSONSchema(
        weddingOrganizationAccessManagementResponseSchema,
        { target: "draft-2020-12" },
      ),
      WeddingOrganizationPartnerAccessResponse: z.toJSONSchema(
        weddingOrganizationPartnerAccessResponseSchema,
        { target: "draft-2020-12" },
      ),
      RestrictWeddingOrganizationStaffRequest: z.toJSONSchema(
        restrictWeddingOrganizationStaffRequestSchema,
        { target: "draft-2020-12" },
      ),
      UpdateLeadPlannerAbsenceRequest: z.toJSONSchema(
        updateLeadPlannerAbsenceRequestSchema,
        { target: "draft-2020-12" },
      ),
      AcceptOrganizationInvitationRequest: z.toJSONSchema(
        acceptOrganizationInvitationRequestSchema,
        { target: "draft-2020-12" },
      ),
      AcceptOrganizationInvitationResponse: z.toJSONSchema(
        acceptOrganizationInvitationResponseSchema,
        { target: "draft-2020-12" },
      ),
    },
  },
} as const;
