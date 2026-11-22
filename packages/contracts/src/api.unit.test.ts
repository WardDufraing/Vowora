import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  accountSessionsResponseSchema,
  apiRootResponseSchema,
  createWeddingRequestSchema,
  healthResponseSchema,
  openApiDocument,
  organizationPrivateNoteResponseSchema,
  passwordRecoveryAcknowledgementSchema,
  passwordResetResponseSchema,
  problemDetailsSchema,
  updateWeddingSettingsRequestSchema,
  weddingOrganizationLeadAccessResponseSchema,
} from "./index.js";

const correlationId = "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2";

describe("API contracts", () => {
  it("keeps private-note persistence and tenant authority out of responses", () => {
    const response = {
      data: {
        id: "019a2f36-0eb9-7000-8000-000000000001",
        weddingId: null,
        title: "Internal follow-up",
        body: "Private organization detail",
        status: "active",
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        editable: true,
      },
      meta: { correlationId },
    };
    expect(organizationPrivateNoteResponseSchema.parse(response)).toEqual(
      response,
    );
    expect(
      organizationPrivateNoteResponseSchema.safeParse({
        ...response,
        data: {
          ...response.data,
          organizationId: "019a2f36-0eb9-7000-8000-000000000002",
          createdByMembershipId: "019a2f36-0eb9-7000-8000-000000000003",
        },
      }).success,
    ).toBe(false);
  });

  it("keeps the current-lead response distinct from manager data", () => {
    const response = {
      data: {
        id: "019a2f36-0eb9-7000-8000-000000000001",
        weddingId: "019a2f36-0eb9-7000-8000-000000000002",
        weddingName: "Jordan & Alex",
        assignments: [
          {
            id: "019a2f36-0eb9-7000-8000-000000000003",
            organizationMembershipId: "019a2f36-0eb9-7000-8000-000000000004",
            isLead: true,
            absenceStartsAt: null,
            absenceEndsAt: null,
          },
        ],
      },
      meta: { correlationId },
    };
    expect(weddingOrganizationLeadAccessResponseSchema.parse(response)).toEqual(
      response,
    );
    expect(
      weddingOrganizationLeadAccessResponseSchema.safeParse({
        ...response,
        data: {
          ...response.data,
          status: "active",
          permissionCeiling: [{ area: "tasks", actions: ["view"] }],
          assignments: [
            {
              ...response.data.assignments[0],
              role: "employee",
              status: "active",
              permissions: [{ area: "tasks", actions: ["view"] }],
              email: "colleague@example.test",
            },
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      openApiDocument.paths[
        "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/staff"
      ].get.responses["200"].content["application/json"].schema,
    ).toEqual({
      oneOf: [
        {
          $ref: "#/components/schemas/WeddingOrganizationAccessManagementResponse",
        },
        {
          $ref: "#/components/schemas/WeddingOrganizationLeadAccessResponse",
        },
      ],
    });
  });

  it("keeps wedding tenant and role authority out of client payloads", () => {
    const valid = {
      name: "Jordan & Alex",
      weddingDate: "2027-06-12",
      timeZone: "Europe/Brussels",
    };
    expect(createWeddingRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      createWeddingRequestSchema.safeParse({
        ...valid,
        creationMode: "planner",
      }).success,
    ).toBe(false);
    expect(
      updateWeddingSettingsRequestSchema.safeParse({
        ...valid,
        expectedVersion: 1,
        weddingId: "019a1f5e-70a0-7000-8000-000000000002",
      }).success,
    ).toBe(false);
    expect(
      createWeddingRequestSchema.safeParse({
        ...valid,
        timeZone: "Mars/Olympus",
      }).success,
    ).toBe(false);
  });

  it("accepts the stable v1 root and health envelopes", () => {
    expect(
      apiRootResponseSchema.parse({
        data: {
          name: "Vowora API",
          version: "v1",
          status: "ok",
          links: {
            auth: "/api/v1/auth/get-session",
            health: "/api/v1/health",
            openapi: "/api/v1/openapi.json",
          },
        },
        meta: { correlationId },
      }),
    ).toBeTruthy();
    expect(
      healthResponseSchema.parse({
        data: { service: "vowora-api", version: "v1", status: "ok" },
        meta: { correlationId },
      }),
    ).toBeTruthy();
  });

  it("generates the OpenAPI 3.1 schemas from the runtime contracts", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(Object.keys(openApiDocument.paths)).toEqual([
      "/api/v1",
      "/api/v1/health",
      "/api/v1/openapi.json",
      "/api/v1/auth/sign-up/email",
      "/api/v1/auth/sign-out",
      "/api/v1/auth/sign-in/email",
      "/api/v1/auth/send-verification-email",
      "/api/v1/auth/verify-email",
      "/api/v1/auth/get-session",
      "/api/v1/auth/request-password-reset",
      "/api/v1/auth/reset-password",
      "/api/v1/auth/reset-password/{token}",
      "/api/v1/account/sessions",
      "/api/v1/account/sessions/{sessionId}",
      "/api/v1/weddings",
      "/api/v1/weddings/{weddingId}",
      "/api/v1/weddings/{weddingId}/invitations",
      "/api/v1/weddings/{weddingId}/invitations/{invitationId}",
      "/api/v1/invitations/{token}/accept",
      "/api/v1/invitations/pending/{invitationId}/accept",
      "/api/v1/organizations",
      "/api/v1/weddings/{weddingId}/planner-organizations/invitations",
      "/api/v1/weddings/{weddingId}/planner-organizations/invitations/{invitationId}",
      "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}",
      "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}/restrictions",
      "/api/v1/weddings/{weddingId}/planner-organizations/access/{accessId}/absence",
      "/api/v1/organizations/{organizationId}/private-notes",
      "/api/v1/organizations/{organizationId}/private-notes/{noteId}",
      "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/handover",
      "/api/v1/organizations/{organizationId}/wedding-invitations",
      "/api/v1/organizations/{organizationId}/wedding-invitations/{invitationId}",
      "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/staff",
      "/api/v1/organizations/{organizationId}/wedding-access/{accessId}/staff/{assignmentId}",
      "/api/v1/organizations/{organizationId}/staff",
      "/api/v1/organizations/{organizationId}/staff/{membershipId}",
      "/api/v1/organizations/{organizationId}/invitations",
      "/api/v1/organizations/{organizationId}/invitations/{invitationId}",
      "/api/v1/organization-invitations/{token}/accept",
      "/api/v1/organization-invitations/pending/{invitationId}/accept",
      "/api/v1/weddings/{weddingId}/planning",
      "/api/v1/weddings/{weddingId}/planning/{recordId}",
      "/api/v1/{path}",
    ]);
    expect(
      openApiDocument.paths["/api/v1/weddings/{weddingId}/planning"].post
        .responses["201"],
    ).toBeTruthy();
    expect(
      openApiDocument.paths["/api/v1/weddings/{weddingId}/planning/{recordId}"]
        .patch.responses["409"],
    ).toBeTruthy();
    expect(
      openApiDocument.paths["/api/v1/auth/sign-out"].post.operationId,
    ).toBe("signOut");
    expect("get" in openApiDocument.paths["/api/v1/auth/sign-out"]).toBe(false);
    expect(
      openApiDocument.paths["/api/v1/auth/sign-out"].post.responses["403"],
    ).toEqual({ $ref: "#/components/responses/AuthenticationFailed" });
    expect(
      openApiDocument.paths["/api/v1/organizations"].post.parameters,
    ).toEqual([
      expect.objectContaining({
        name: "Idempotency-Key",
        in: "header",
        required: true,
        schema: { type: "string", format: "uuid" },
      }),
    ]);
    expect(
      Object.keys(
        openApiDocument.paths["/api/v1/organization-invitations/{token}/accept"]
          .post.responses,
      ),
    ).toEqual(["200", "400", "401", "403", "404"]);
    const invitationPost =
      openApiDocument.paths[
        "/api/v1/organizations/{organizationId}/invitations"
      ].post;
    expect(invitationPost.parameters).toEqual([
      expect.objectContaining({
        name: "Idempotency-Key",
        in: "header",
        required: true,
        schema: { type: "string", format: "uuid" },
      }),
    ]);
    expect(invitationPost.responses["200"]).toBeTruthy();
    expect(invitationPost.responses["201"]).toBeTruthy();
    expect(
      openApiDocument.paths[
        "/api/v1/organizations/{organizationId}/invitations/{invitationId}"
      ].delete.responses["403"],
    ).toBeTruthy();
    expect(openApiDocument.components.schemas.HealthResponse).toEqual(
      z.toJSONSchema(healthResponseSchema, { target: "draft-2020-12" }),
    );
    expect(openApiDocument.components.schemas.AccountSessionsResponse).toEqual(
      z.toJSONSchema(accountSessionsResponseSchema, {
        target: "draft-2020-12",
      }),
    );
    expect(
      openApiDocument.components.schemas.PasswordRecoveryAcknowledgement,
    ).toEqual(
      z.toJSONSchema(passwordRecoveryAcknowledgementSchema, {
        target: "draft-2020-12",
      }),
    );
    expect(openApiDocument.components.schemas.PasswordResetResponse).toEqual(
      z.toJSONSchema(passwordResetResponseSchema, {
        target: "draft-2020-12",
      }),
    );
    expect(JSON.parse(JSON.stringify(openApiDocument))).toEqual(
      openApiDocument,
    );
  });

  it("mechanically links documented 404 and 405 responses to Problem Details", () => {
    expect(openApiDocument.components.schemas.ProblemDetails).toEqual(
      z.toJSONSchema(problemDetailsSchema, { target: "draft-2020-12" }),
    );
    expect(
      openApiDocument.components.responses.ResourceNotFound.content[
        "application/problem+json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/ProblemDetails" });
    expect(
      openApiDocument.components.responses.MethodNotAllowed.content[
        "application/problem+json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/ProblemDetails" });
    expect(
      openApiDocument.paths["/api/v1/{path}"].get.responses["404"],
    ).toEqual({ $ref: "#/components/responses/ResourceNotFound" });
    expect(openApiDocument.paths["/api/v1"].post.responses["405"]).toEqual({
      $ref: "#/components/responses/MethodNotAllowed",
    });
    expect(
      openApiDocument.paths["/api/v1/health"].delete.responses["405"],
    ).toEqual({ $ref: "#/components/responses/MethodNotAllowed" });
    expect(
      openApiDocument.paths["/api/v1/openapi.json"].post.responses["405"],
    ).toEqual({ $ref: "#/components/responses/MethodNotAllowed" });
    expect(
      openApiDocument.paths["/api/v1/auth/sign-in/email"].post.responses["403"],
    ).toEqual({ $ref: "#/components/responses/AuthenticationFailed" });
    expect(
      openApiDocument.components.responses.AuthenticationFailed.content[
        "application/problem+json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/ProblemDetails" });
    expect(
      openApiDocument.paths["/api/v1/auth/sign-in/email"].post.responses["401"],
    ).toEqual({ $ref: "#/components/responses/AuthenticationFailed" });
    expect(
      openApiDocument.paths["/api/v1/auth/sign-in/email"].post.responses["500"],
    ).toEqual({
      $ref: "#/components/responses/AuthenticationServiceFailure",
    });
    expect(
      openApiDocument.paths["/api/v1/auth/sign-in/email"].post.responses["429"],
    ).toEqual({
      $ref: "#/components/responses/AuthenticationRateLimited",
    });
    expect(
      openApiDocument.components.responses.AuthenticationRateLimited.headers[
        "Retry-After"
      ].schema,
    ).toEqual({ type: "integer", minimum: 1, maximum: 900 });
    expect(
      openApiDocument.paths["/api/v1/auth/sign-in/email"].post.parameters,
    ).toEqual([
      expect.objectContaining({
        name: "x-vowora-challenge-token",
        in: "header",
        required: false,
      }),
    ]);
    expect(
      openApiDocument.paths["/api/v1/auth/request-password-reset"].post
        .responses["403"],
    ).toEqual({ $ref: "#/components/responses/AuthenticationFailed" });
    expect(
      openApiDocument.paths["/api/v1/auth/request-password-reset"].post
        .responses["500"],
    ).toEqual({
      $ref: "#/components/responses/AuthenticationServiceFailure",
    });
    expect(
      openApiDocument.paths["/api/v1/auth/reset-password"].post.responses[
        "500"
      ],
    ).toEqual({
      $ref: "#/components/responses/AuthenticationServiceFailure",
    });
    expect(
      openApiDocument.paths["/api/v1/auth/reset-password"].post.responses[
        "503"
      ],
    ).toEqual({
      $ref: "#/components/responses/AuthenticationServiceFailure",
    });
    expect(
      openApiDocument.components.responses.AuthenticationServiceFailure.content[
        "application/problem+json"
      ].schema,
    ).toEqual({ $ref: "#/components/schemas/ProblemDetails" });
  });

  it("rejects extra response fields and unsafe problem shapes", () => {
    expect(() =>
      healthResponseSchema.parse({
        data: {
          service: "vowora-api",
          version: "v1",
          status: "ok",
          databaseUrl: "secret",
        },
        meta: { correlationId },
      }),
    ).toThrow();
    expect(() =>
      problemDetailsSchema.parse({
        type: "not a URL",
        title: "Missing",
        status: 404,
        detail: "Missing",
        instance: "/api/v1/missing",
        code: "not-stable",
        correlationId,
      }),
    ).toThrow();
  });

  it("validates privacy-minimized session and recovery success bodies", () => {
    expect(
      accountSessionsResponseSchema.parse({
        data: [
          {
            id: "019a0000-0000-7000-8000-000000000001",
            current: true,
            device: "Desktop browser",
            createdAt: "2026-10-27T08:00:00.000Z",
            lastActiveAt: "2026-10-27T08:00:00.000Z",
            expiresAt: "2026-11-27T08:00:00.000Z",
          },
        ],
        meta: { correlationId },
      }),
    ).toBeTruthy();
    expect(
      passwordRecoveryAcknowledgementSchema.parse({
        status: true,
        message: "If this email exists, check your email.",
      }),
    ).toBeTruthy();
    expect(passwordResetResponseSchema.parse({ status: true })).toBeTruthy();
    expect(() =>
      accountSessionsResponseSchema.parse({
        data: [{ token: "must-not-leak" }],
        meta: { correlationId },
      }),
    ).toThrow();
  });
});
