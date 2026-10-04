import assert from "node:assert/strict";
import test from "node:test";
import {
  capabilityKeys,
  capabilityNavigationGroups,
  capabilityRegistry,
  liveShowcaseRoutes,
} from "./capabilities";

test("capability registry has unique routes and valid references", () => {
  const routes = capabilityKeys.map((key) => capabilityRegistry[key].path);
  assert.equal(new Set(routes).size, routes.length);

  for (const key of capabilityKeys) {
    const capability = capabilityRegistry[key];
    assert.equal(capability.key, key);
    for (const dependency of capability.dependencies) {
      assert.ok(capabilityRegistry[dependency]);
    }
    if (capability.next) assert.ok(capabilityRegistry[capability.next]);
    if (capability.demoStatus === "LIVE") {
      assert.equal(capability.productStatus, "LIVE");
    }
  }
});

test("navigation uses each listed capability once and in its declared group", () => {
  const listed = capabilityNavigationGroups.flatMap((group) =>
    group.items.map((key) => ({ group: group.key, key })),
  );
  assert.equal(new Set(listed.map(({ key }) => key)).size, listed.length);

  for (const item of listed) {
    assert.equal(capabilityRegistry[item.key].navGroup, item.group);
  }
});

test("live smoke routes come only from truthful live demo statuses", () => {
  assert.deepEqual(
    liveShowcaseRoutes,
    capabilityKeys
      .filter((key) => capabilityRegistry[key].demoStatus === "LIVE")
      .map((key) => capabilityRegistry[key].path),
  );
  const liveRoutes = new Set<string>(liveShowcaseRoutes);
  assert.ok(!liveRoutes.has("/ai"));
  assert.ok(!liveRoutes.has("/variants"));
  assert.ok(!liveRoutes.has("/analytics"));
});
