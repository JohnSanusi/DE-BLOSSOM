import test from "node:test";
import assert from "node:assert/strict";

test("portal query module can be imported", async () => {
  const module = await import("./portal.ts");
  assert.ok(module.getCurrentProfile);
  assert.ok(module.getMemberPortalData);
  assert.ok(module.getAdminPortalData);
});
