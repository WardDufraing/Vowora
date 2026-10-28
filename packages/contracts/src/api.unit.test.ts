import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  accountSessionsResponseSchema,
  apiRootResponseSchema,
  healthResponseSchema,
  openApiDocument,
  passwordRecoveryAcknowledgementSchema,
  passwordResetResponseSchema,
  problemDetailsSchema,
} from "./index.js";

const correlationId = "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2";

describe("API contracts", () => {
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
      "/api/v1/auth/sign-in/email",
      "/api/v1/auth/send-verification-email",
      "/api/v1/auth/verify-email",
      "/api/v1/auth/get-session",
      "/api/v1/auth/request-password-reset",
      "/api/v1/auth/reset-password",
      "/api/v1/auth/reset-password/{token}",
      "/api/v1/account/sessions",
      "/api/v1/account/sessions/{sessionId}",
      "/api/v1/{path}",
    ]);
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
