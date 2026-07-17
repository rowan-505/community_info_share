import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDemoModeEnabled } from "./demo.js";

describe("demo mode showcase guard", () => {
  it("enables when DEMO_MODE=true regardless of NODE_ENV", () => {
    const previousDemo = process.env.DEMO_MODE;
    const previousNode = process.env.NODE_ENV;

    process.env.DEMO_MODE = "true";
    process.env.NODE_ENV = "production";
    assert.equal(isDemoModeEnabled(), true);

    process.env.DEMO_MODE = previousDemo;
    process.env.NODE_ENV = previousNode;
  });

  it("disables when DEMO_MODE is not true", () => {
    const previousDemo = process.env.DEMO_MODE;
    const previousNode = process.env.NODE_ENV;

    process.env.DEMO_MODE = "false";
    process.env.NODE_ENV = "development";
    assert.equal(isDemoModeEnabled(), false);

    process.env.DEMO_MODE = previousDemo;
    process.env.NODE_ENV = previousNode;
  });
});
