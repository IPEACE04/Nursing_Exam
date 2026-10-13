import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const actionCode = ts.transpileModule(readFileSync(new URL("../src/actions/community.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const oldPostId = "11111111-1111-4111-8111-111111111111";
const newPostId = "22222222-2222-4222-8222-222222222222";

interface PostRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  is_pinned: boolean;
  image_paths: string[];
}

function fixture(id: string, createdAt: string, category = "แชร์ความรู้"): PostRow {
  return { id, user_id: "student-user", title: "Study notes", content: "Nursing", category, created_at: createdAt, is_pinned: false, image_paths: [] };
}

function harness(options: { userId?: string | null; role?: string | null; updateError?: boolean; throwOnUpdate?: boolean; readError?: boolean } = {}) {
  const posts = [fixture(oldPostId, "2026-01-01"), fixture(newPostId, "2026-02-01"), fixture("33333333-3333-4333-8333-333333333333", "2026-03-01", "ถาม-ตอบ")];
  const writes: Record<string, unknown>[] = [];
  const revalidated: string[] = [];

  // Model persisted rows and SQL ordering so assertions exercise the exported actions.
  class Query {
    filters: [string, unknown][] = [];
    orders: { column: string; ascending: boolean }[] = [];
    changes: Record<string, unknown> | null = null;
    inserted: Record<string, unknown> | null = null;
    search = "";

    readonly table: string;
    constructor(table: string) { this.table = table; }
    select() { return this; }
    eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
    in() { return this; }
    or(value: string) { this.search = value.split("%")[1]; return this; }
    order(column: string, settings: { ascending: boolean }) { this.orders.push({ column, ...settings }); return this; }
    update(changes: Record<string, unknown>) { this.changes = changes; return this; }
    insert(row: Record<string, unknown>) { this.inserted = row; return this; }

    result() {
      if (this.table === "profiles") return { data: options.role === null ? [] : [{ role: options.role ?? "admin" }], error: null, count: 0 };
      if (this.table !== "community_posts") return { data: [], error: null, count: 0 };
      if (this.changes && options.throwOnUpdate) throw new Error("Connection failed");
      if ((this.changes && options.updateError) || (!this.changes && options.readError)) {
        return { data: null, error: { message: "Database unavailable" }, count: 0 };
      }
      if (this.inserted) {
        writes.push(this.inserted);
        const post = { ...fixture("44444444-4444-4444-8444-444444444444", "2026-04-01"), ...this.inserted };
        posts.push(post);
        return { data: [post], error: null, count: 0 };
      }
      const rows = posts.filter((post) => this.filters.every(([column, value]) => post[column as keyof PostRow] === value))
        .filter((post) => !this.search || post.title.includes(this.search) || post.content.includes(this.search));
      if (this.changes) {
        writes.push(this.changes);
        rows.forEach((post) => Object.assign(post, this.changes));
      }
      rows.sort((left, right) => {
        for (const { column, ascending } of this.orders) {
          const a = left[column as keyof PostRow];
          const b = right[column as keyof PostRow];
          if (a === b) continue;
          return (a > b ? 1 : -1) * (ascending ? 1 : -1);
        }
        return 0;
      });
      return { data: rows, error: null, count: 0 };
    }

    async single() { const result = this.result(); return { ...result, data: result.data?.[0] ?? null }; }
    async maybeSingle() { return this.single(); }
    then(resolve: (result: ReturnType<Query["result"]>) => unknown, reject: (error: unknown) => unknown) {
      return Promise.resolve().then(() => this.result()).then(resolve, reject);
    }
  }

  const exports = {};
  const mocks: Record<string, unknown> = {
    "next/cache": { revalidatePath: (path: string) => revalidated.push(path) },
    "@/lib/auth": { getSessionUserId: async () => options.userId === undefined ? "admin-user" : options.userId },
    "@/lib/supabase-server": { createSupabaseServerClient: () => ({ from: (table: string) => new Query(table) }) },
    "@/lib/storage": { getPublicImageUrls: () => [], parseImagePaths: () => [], getFormFiles: () => [] },
    "@/lib/file-utils": {},
  };
  runInNewContext(actionCode, { exports, Error, console: { error() {} }, require: (name: string) => name in mocks ? mocks[name] : require(name) });
  return { actions: exports as typeof import("../src/actions/community.ts"), posts, writes, revalidated };
}

function pinData(postId = oldPostId, isPinned = "true") {
  const data = new FormData();
  data.set("postId", postId);
  data.set("isPinned", isPinned);
  return data;
}

test("admin pins another user's post and invalidates list/detail views", async () => {
  const { actions, posts, writes, revalidated } = harness();
  const result = await actions.setPostPinnedAsAdmin(pinData());
  assert.equal("success" in result && result.success, true);
  assert.equal(posts[0].is_pinned, true);
  assert.deepEqual(Object.keys(writes[0]), ["is_pinned"]);
  assert.deepEqual(revalidated, ["/admin/community", "/community", `/admin/community/${oldPostId}`, `/community/${oldPostId}`]);
});

test("repeating the desired state is idempotent, and several posts can stay pinned", async () => {
  const { actions, posts } = harness();
  await actions.setPostPinnedAsAdmin(pinData());
  await actions.setPostPinnedAsAdmin(pinData());
  await actions.setPostPinnedAsAdmin(pinData(newPostId));
  assert.equal(posts[0].is_pinned, true);
  assert.equal(posts[1].is_pinned, true);
  assert.deepEqual(Array.from(await actions.getPosts(), (post) => post.id), [newPostId, oldPostId, posts[2].id]);
  await actions.setPostPinnedAsAdmin(pinData(oldPostId, "false"));
  assert.deepEqual(Array.from(await actions.getPosts(), (post) => post.id), [newPostId, posts[2].id, oldPostId]);
});

test("student, missing profile, and expired/missing session cannot change pin status", async () => {
  for (const options of [{ role: "student" }, { role: null }, { userId: null }]) {
    const { actions, writes, revalidated } = harness(options);
    assert.ok("error" in await actions.setPostPinnedAsAdmin(pinData()));
    assert.equal(writes.length, 0);
    assert.equal(revalidated.length, 0);
  }
});

test("invalid UUID, missing fields, non-string fields and invalid booleans are rejected", async () => {
  const { actions, writes } = harness();
  const fileData = pinData();
  fileData.set("postId", new Blob(["invalid"]), "id.txt");
  for (const data of [new FormData(), pinData("bad-id"), pinData(oldPostId, "1"), pinData(oldPostId, ""), fileData]) {
    assert.ok("error" in await actions.setPostPinnedAsAdmin(data));
  }
  assert.equal(writes.length, 0);
});

test("missing post and database/network errors return errors without invalidating views", async () => {
  for (const options of [{}, { updateError: true }, { throwOnUpdate: true }]) {
    const { actions, revalidated } = harness(options);
    const id = Object.keys(options).length ? oldPostId : "99999999-9999-4999-8999-999999999999";
    assert.ok("error" in await actions.setPostPinnedAsAdmin(pinData(id)));
    assert.equal(revalidated.length, 0);
  }
});

test("student and admin lists retain category/search filters and expose pin status", async () => {
  const { actions } = harness();
  await actions.setPostPinnedAsAdmin(pinData());
  await actions.setPostPinnedAsAdmin(pinData(newPostId));
  for (const posts of [await actions.getPosts("แชร์ความรู้"), await actions.getAdminPosts("Study", "แชร์ความรู้")]) {
    assert.deepEqual(Array.from(posts, (post) => post.id), [newPostId, oldPostId]);
    assert.equal(posts.every((post) => post.is_pinned), true);
  }
  assert.equal((await actions.getPosts("ถาม-ตอบ"))[0].is_pinned, false);
  assert.equal((await actions.getAdminPosts("no matching post")).length, 0);
});

test("read failures are surfaced instead of returning an empty feed", async () => {
  const { actions } = harness({ readError: true });
  await assert.rejects(actions.getPosts());
  await assert.rejects(actions.getAdminPosts());
});

test("creating a post ignores any client-supplied pin status", async () => {
  const { actions, posts, writes } = harness({ role: "student", userId: "student-user" });
  const data = new FormData();
  data.set("title", "New study notes");
  data.set("content", "Nursing notes");
  data.set("is_pinned", "true");
  data.set("isPinned", "true");
  assert.equal((await actions.createPost(data)).success, true);
  assert.equal("is_pinned" in writes[0], false);
  assert.equal(posts.at(-1)?.is_pinned, false);
});
