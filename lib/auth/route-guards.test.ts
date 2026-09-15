import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouteFromRole } from "./route-guards.ts";

test("returns admin for admin role", () => {
  assert.equal(resolveRouteFromRole("admin"), "admin");
});

test("returns member for member role", () => {
  assert.equal(resolveRouteFromRole("member"), "member");
});

test("returns guest for any other role or empty value", () => {
  assert.equal(resolveRouteFromRole(null), "guest");
  assert.equal(resolveRouteFromRole("guest"), "guest");
  assert.equal(resolveRouteFromRole(undefined), "guest");
});
