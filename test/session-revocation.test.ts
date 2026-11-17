import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function harness(profile: { id: string; session_version: string } | null, dbError = false) {
  const jar = new Map<string, string>();
  const auth = {} as typeof import("../src/lib/auth.ts");
  const mocks: Record<string, unknown> = {
    "next/headers": {
      cookies: async () => ({
        get: (name: string) => (jar.has(name) ? { value: jar.get(name) } : undefined),
        set: (name: string, value: string) => jar.set(name, value),
        delete: (name: string) => jar.delete(name),
      }),
    },
    "@/lib/supabase-server": {
      createSupabaseServerClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () =>
                dbError ? { data: null, error: { message: "down" } } : { data: profile, error: null },
            }),
          }),
        }),
      }),
    },
  };
  runInNewContext(code, {
    exports: auth,
    process: { env: { AUTH_SECRET: "test-secret-test-secret-test-secret", NODE_ENV: "test" } },
    TextEncoder,
    Error,
    require: (name: string) => (name in mocks ? mocks[name] : require(name)),
  });
  return { auth, jar };
}

test("a token is a session only while its version matches the profile", async () => {
  const { auth, jar } = harness({ id: "user-1", session_version: "v1" });
  jar.set("session", await auth.createJWT("user-1", "student", "v1"));
  assert.equal(await auth.getSessionUserId(), "user-1");
  assert.ok(jar.has("session"));
});

test("revoked, unversioned and reset tokens are rejected and the cookie is cleared", async () => {
  for (const sv of ["old-version", undefined]) {
    const { auth, jar } = harness({ id: "user-1", session_version: "v2" });
    jar.set("session", await auth.createJWT("user-1", sv ? "student" : "reset", sv));
    assert.equal(await auth.getSessionUserId(), null);
    assert.equal(jar.has("session"), false);
  }
});

test("a deleted user's token is rejected", async () => {
  const { auth, jar } = harness(null);
  jar.set("session", await auth.createJWT("user-1", "student", "v1"));
  assert.equal(await auth.getSessionUserId(), null);
});

test("a database error denies the request but keeps the cookie", async () => {
  const { auth, jar } = harness(null, true);
  jar.set("session", await auth.createJWT("user-1", "student", "v1"));
  assert.equal(await auth.getSessionUserId(), null);
  assert.ok(jar.has("session"));
});
