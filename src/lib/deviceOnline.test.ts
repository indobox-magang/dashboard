import assert from "node:assert/strict";
import { test } from "node:test";
import { isDeviceOnline } from "./deviceOnline.ts";

const now = Date.parse("2026-08-25T12:00:00.000Z");

test("heartbeat 3 minutes ago is online when the window is 5 minutes", () => {
  const hb = new Date(now - 3 * 60_000).toISOString();
  assert.equal(isDeviceOnline(hb, 5, now), true);
});

test("heartbeat 3 minutes ago is offline when the window is 2 minutes", () => {
  const hb = new Date(now - 3 * 60_000).toISOString();
  assert.equal(isDeviceOnline(hb, 2, now), false);
});

test("missing heartbeat is offline", () => {
  assert.equal(isDeviceOnline(undefined, 5, now), false);
  assert.equal(isDeviceOnline(null, 5, now), false);
});
