import test from "node:test";
import assert from "node:assert/strict";

const { resolveRouteFromRole } = await import("./route-guards.ts");

test("admin role resolves to admin", () => {
  assert.equal(resolveRouteFromRole("admin"), "admin");
});

test("member role resolves to member", () => {
  assert.equal(resolveRouteFromRole("member"), "member");
});

test("other values resolve to guest", () => {
  assert.equal(resolveRouteFromRole(null), "guest");
  assert.equal(resolveRouteFromRole(undefined), "guest");
  assert.equal(resolveRouteFromRole("guest"), "guest");
});
