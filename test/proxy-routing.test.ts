import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { jwtVerify, SignJWT } from "jose";
import ts from "typescript";
import type { NextRequest, NextResponse } from "next/server";

const require = createRequire(import.meta.url);
const { NextRequest: Request } = require("next/server") as typeof import("next/server");
const secret = new TextEncoder().encode("nurseup-route-test-only-secret");
const code = ts.transpileModule(readFileSync(new URL("../proxy.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(code, {
  exports, TextEncoder,
  process: { env: { AUTH_SECRET: "nurseup-route-test-only-secret" } },
  require: (name: string) => name === "jose" ? { jwtVerify } : require(name),
});
const proxy = (exports as { default: (request: NextRequest) => Promise<NextResponse> }).default;

function request(path: string, token?: string) {
  return new Request(`http://localhost:3000${path}`, {
    headers: token ? { cookie: `session=${token}` } : {},
  });
}

async function session(role?: string, expired = false) {
  return new SignJWT({ userId: "route-test-user", ...(role ? { role } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expired ? Math.floor(Date.now() / 1000) - 60 : "1h")
    .sign(secret);
}

test("guests and invalid/expired sessions can visit the public landing page", async () => {
  for (const token of [undefined, "invalid-token", await session("student", true)]) {
    const response = await proxy(request("/", token));
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
});

test("application routes still redirect guests to login and preserve their destination", async () => {
  for (const path of ["/dashboard", "/exam/exam-test", "/history", "/community", "/ranking", "/profile", "/progress", "/satisfaction", "/admin/dashboard"]) {
    const response = await proxy(request(path));
    const target = new URL(response.headers.get("location")!);
    assert.equal(target.pathname, "/login");
    assert.equal(target.searchParams.get("redirect"), path);
  }
  const expired = await proxy(request("/dashboard", await session("student", true)));
  assert.equal(new URL(expired.headers.get("location")!).pathname, "/login");
});

test("signed-in root routing and role protection remain unchanged", async () => {
  const student = await session("student");
  const admin = await session("admin");
  for (const [path, token, destination] of [
    ["/", student, "/community"],
    ["/", admin, "/admin/dashboard"],
    ["/admin/dashboard", student, "/community"],
    ["/dashboard", admin, "/admin/dashboard"],
    ["/login", student, "/community"],
    ["/", await session(), "/community"],
  ]) {
    const response = await proxy(request(path, token));
    assert.equal(new URL(response.headers.get("location")!).pathname, destination);
  }
});
