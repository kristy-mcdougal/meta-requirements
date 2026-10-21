import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

const env = loadEnv(path.join(root, ".env.local"));

async function hygraph(query, variables) {
  const response = await fetch(env.HYGRAPH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HYGRAPH_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    console.error(JSON.stringify(payload.errors ?? payload, null, 2));
    throw new Error("Hygraph request failed");
  }
  return payload.data;
}

const existing = await hygraph(`query { requirements(first: 1, stage: DRAFT) { id } }`);
if (existing.requirements.length) {
  console.log(`Skipping seed. ${existing.requirements.length > 0 ? "Requirements already exist." : ""}`);
  const count = await hygraph(`query { requirementsConnection(stage: DRAFT) { aggregate { count } } }`);
  console.log("draft count", count.requirementsConnection.aggregate.count);
  process.exit(0);
}

const items = JSON.parse(fs.readFileSync(path.join(root, "data/requirements.json"), "utf8"));
const ids = [];

for (let index = 0; index < items.length; index += 8) {
  const slice = items.slice(index, index + 8);
  const definitions = slice.map((_, offset) => `$d${offset}: RequirementCreateInput!`).join(", ");
  const selections = slice.map((_, offset) => `c${offset}: createRequirement(data: $d${offset}) { id }`).join("\n");
  const variables = {};
  slice.forEach((item, offset) => {
    variables[`d${offset}`] = {
      title: item.title,
      body: item.body,
      category: item.category,
      sortOrder: item.sortOrder,
    };
  });
  const created = await hygraph(`mutation Seed(${definitions}) { ${selections} }`, variables);
  ids.push(...Object.values(created).map((entry) => entry.id));
  console.log(`created ${ids.length}`);
}

const published = await hygraph(
  `mutation Publish($ids: [ID!]!) {
    publishManyRequirements(where: { id_in: $ids }, to: PUBLISHED) { count }
  }`,
  { ids },
);

console.log("published", published.publishManyRequirements.count);
