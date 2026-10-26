import { describe, expect, it } from "vitest";

import { parseArguments } from "./persistent-migrate-cli.js";

describe("persistent migration CLI", () => {
  it("parses explicit target, mode and confirmation", () => {
    expect(
      parseArguments([
        "--target",
        "production",
        "--mode",
        "apply",
        "--confirm-production",
        "APPLY_VOWORA_PRODUCTION_MIGRATIONS",
      ]),
    ).toEqual({
      target: "production",
      mode: "apply",
      confirmation: "APPLY_VOWORA_PRODUCTION_MIGRATIONS",
    });
  });

  it("leaves required values absent for the configuration validator", () => {
    expect(parseArguments([])).toEqual({
      target: undefined,
      mode: undefined,
      confirmation: undefined,
    });
  });

  it.each([
    { values: ["--target", "staging", "--mode"] },
    { values: ["--target", "staging", "--unknown", "apply"] },
    { values: ["--target", "staging", "--target", "production"] },
    { values: ["staging", "apply"] },
  ])("rejects ambiguous arguments %#", ({ values }) => {
    expect(() => parseArguments(values)).toThrow(/arguments/);
  });
});
