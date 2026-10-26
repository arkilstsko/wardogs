import { test, expect, type Page } from "@playwright/test";
import {
  createGame,
  execute,
  exportGame,
  GOODS,
  type Game,
  type Scenario,
} from "../../packages/game-core/src/v1";

function move(
  s: Game,
  type: string,
  player = "p0",
  fields: Record<string, unknown> = {},
) {
  return execute(s, {
    id: "browser-" + s.commands.length,
    type,
    player,
    ...fields,
  });
}
function fixture(count = 5, scenario: Scenario = "standard") {
  let s = createGame({ seed: 812, count, scenario, timerMinutes: null });
  for (const p of s.players) {
    if (p.objectiveChoices.length)
      s = move(s, "choose-objective", p.id, { card: p.objectiveChoices[0] });
    if (!p.initialRelationChosen)
      s = move(s, "choose-relation", p.id, { country: "DK" });
  }
  while (s.setup.cursor < s.setup.order.length) {
    const player = s.setup.order[s.setup.cursor];
    s = move(s, "draft-good", player, {
      good: GOODS[Number(player.slice(1)) % 4],
    });
  }
  s = move(s, "advance");
  s = move(s, "advance");
  while (s.pending) s = move(s, "reaction", s.pending.player, { use: false });
  s = move(s, "advance");
  while (s.pending) s = move(s, "reaction", s.pending.player, { use: false });
  return s;
}
async function upload(page: Page, s: Game) {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "browser-save.json",
    mimeType: "application/json",
    buffer: Buffer.from(exportGame(s)),
  });
  await expect(
    page.getByRole("main", { name: "Wardogs spillebord" }),
  ).toBeVisible();
}
async function reveal(page: Page) {
  const button = page.getByRole("button", { name: /Åbn din mappe Kun/ });
  if (await button.isVisible()) await button.click();
}
test("five houses: measured layouts, private curtain, real tender and original leader art", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = fixture();
  await upload(page, s);
  await reveal(page);
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/design/wardogs-v1/previews/code-board-${width}.png`,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    expect(
      await page
        .locator(".table")
        .evaluate((e) => e.scrollHeight <= e.clientHeight),
    ).toBe(true);
    const footer = await page.locator(".private-mat").boundingBox();
    const organizations = await page
      .locator(".organization-market")
      .boundingBox();
    expect(organizations!.y + organizations!.height).toBeLessThanOrEqual(
      footer!.y - 8,
    );
    const clippedHouses = await page.locator(".house-slip").evaluateAll(
      (es) =>
        es.filter((e) => {
          const last = e.lastElementChild!.getBoundingClientRect(),
            box = e.getBoundingClientRect();
          return last.bottom > box.bottom + 1;
        }).length,
    );
    expect(clippedHouses).toBe(0);
    const metrics = await page.locator(".central-board").boundingBox();
    expect(metrics!.width).toBeGreaterThan(width === 1440 ? 850 : 1200);
  }
  await page.getByLabel("Vælg lokal spiller").selectOption("p1");
  await expect(page.locator(".private-hand .card-holder")).toHaveCount(0);
  await reveal(page);
  await expect(page.locator(".private-hand .card-holder")).not.toHaveCount(0);
  await page.locator(".tender-ticket").first().click();
  await expect(
    page.getByRole("heading", { name: "Udbud og fragt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dan konsortium / 2–5 huse" }).click();
  await expect(
    page.getByRole("heading", { name: "Bind en aftale sammen" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/design/wardogs-v1/previews/code-agreement-1920.png",
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Nigeria, stabilitet/ }).click();
  await expect(page.getByRole("heading", { name: "Landebogen" })).toBeVisible();
  await expect(
    page.locator('img[src="/art/v1/primary-NG-v2.png"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: "docs/design/wardogs-v1/previews/code-board-390.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("all card fronts fit their canonical face, and a reader stays inside a narrow folio", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Se kortene" }).click();
  await expect(page.locator(".catalogue-grid>.card-holder")).toHaveCount(180);
  const clipped = await page
    .locator(".catalogue-grid .card-face")
    .evaluateAll((es) =>
      es
        .filter((e) => e.scrollHeight > e.clientHeight + 1)
        .map((e) => ({
          title: e.querySelector("h3")?.textContent,
          height: e.scrollHeight,
        })),
    );
  expect(clipped).toEqual([]);
  await page.locator(".catalogue-grid>.card-holder").first().click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator(".folio")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
});
test("an introductory local game reaches a fully revealed final ledger through the interface", async ({
  page,
}) => {
  const s = fixture(2, "intro");
  await upload(page, s);
  await reveal(page);
  for (let i = 0; i < 140; i++) {
    if (
      await page
        .getByRole("heading", { name: /vinder|deler sejren/ })
        .isVisible()
    )
      break;
    if (await page.locator("dialog").count()) {
      const pass = page.getByRole("button", {
        name: "Pas én handling",
        exact: true,
      });
      if (await pass.isVisible()) {
        await pass.click();
        await page.keyboard.press("Escape");
        continue;
      }
      await page.keyboard.press("Escape");
    }
    await reveal(page);
    const primary = page.locator(".table-tools .primary");
    if (await primary.isDisabled()) {
      const ready = await page.locator(".house-slip").evaluateAll((es) =>
        es.map((e) => ({
          name: e.querySelector("strong")?.textContent,
          ready: e.textContent?.includes("FORSEGLET"),
        })),
      );
      const unready = ready.find((r) => !r.ready);
      if (unready)
        await page
          .getByLabel("Vælg lokal spiller")
          .selectOption({ label: unready.name! });
      else throw Error("Unexpected blocked local phase");
      await reveal(page);
    }
    await primary.click();
  }
  await expect(
    page.getByRole("heading", { name: /vinder|deler sejren/ }),
  ).toBeVisible();
  await expect(page.locator(".score-table tbody tr")).toHaveCount(2);
  await page.screenshot({
    path: "docs/design/wardogs-v1/previews/code-final.png",
  });
});

test("five independent browser seats complete setup, share a clock and reconnect without exposing other hands", async ({
  browser,
}) => {
  const contexts = await Promise.all(
    Array.from({ length: 5 }, () =>
      browser.newContext({ viewport: { width: 1440, height: 900 } }),
    ),
  );
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  const states: any[] = [],
    errors: string[] = [];
  try {
    for (let i = 0; i < pages.length; i++) {
      pages[i].on("pageerror", (e) => errors.push(e.message));
      pages[i].on("websocket", (ws) =>
        ws.on("framereceived", (event) => {
          try {
            const m = JSON.parse(String(event.payload));
            if (m.type === "state") states[i] = m;
          } catch {
            /* Non-state data is checked by the application. */
          }
        }),
      );
    }
    const room = "e2e-" + Date.now();
    const host = pages[0];
    await host.goto("/");
    await host.getByRole("button", { name: "Tag plads", exact: true }).click();
    await host.getByRole("radio", { name: /Vært for et onlinebord/ }).check();
    await host.getByLabel("Antal spillere").selectOption("5");
    await host
      .getByRole("textbox", { name: "Bordkode", exact: true })
      .fill(room);
    await host.getByRole("button", { name: "Opret privat bord" }).click();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].goto("/?join=" + room);
      await pages[i]
        .getByRole("button", { name: "Tag plads ved bordet" })
        .click();
    }
    for (let i = 0; i < pages.length; i++) {
      await expect(
        pages[i].getByRole("heading", { name: "Åbn dit handelshus" }),
      ).toBeVisible();
      await pages[i].getByRole("button", { name: /Jeg er / }).click();
      await pages[i]
        .getByRole("button", { name: "Vælg dette mål" })
        .first()
        .click();
      if (i === 1)
        await pages[i]
          .getByRole("button", { name: "Danmark", exact: true })
          .click();
      expect(
        states[i].view.players
          .filter((p: any) => p.id !== states[i].player)
          .every(
            (p: any) =>
              p.objective === undefined &&
              p.contactsHand === undefined &&
              p.inventory === undefined,
          ),
      ).toBe(true);
    }
    for (let n = 0; n < 10; n++) {
      await expect.poll(() => states[0]?.view.setup.cursor).toBe(n);
      const actor = Number(states[0].view.setup.order[n].slice(1));
      await pages[actor]
        .getByRole("button", {
          name: /^Tag (medicinsk|kommunikation|køretøjer|våbenmateriel)$/i,
        })
        .nth(n % 4)
        .click();
      await expect.poll(() => states[0]?.view.setup.cursor).toBe(n + 1);
    }
    await host.getByRole("button", { name: "Begynd runde 1" }).click();
    await host.getByRole("button", { name: "Begynd verdensfasen" }).click();
    for (let n = 0; n < 5; n++) {
      await expect
        .poll(() => states[0]?.view.pending?.player)
        .not.toBeUndefined();
      const actor = Number(states[0].view.pending.player.slice(1));
      await pages[actor]
        .getByRole("button", { name: "Fortsæt uden kontakt" })
        .click();
      await expect
        .poll(() => states[0]?.view.pending?.player)
        .not.toBe("p" + actor);
    }
    await host.getByRole("button", { name: "Udbetal indkomst" }).click();
    await expect(
      host.getByRole("timer", { name: "Forhandlingstid" }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Pause", exact: true }).click();
    await expect.poll(() => states[4]?.clock?.runningSince).toBeNull();
    await pages[4].reload();
    await pages[4]
      .getByRole("button", { name: "Tag plads ved bordet" })
      .click();
    await expect(
      pages[4].getByRole("main", { name: "Wardogs spillebord" }),
    ).toBeVisible();
    expect(states[4].player).toBe("p4");
    await expect(pages[4].locator(".private-hand .card-holder")).toHaveCount(0);
    expect(states[4].clock.runningSince).toBeNull();
    expect(errors).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
