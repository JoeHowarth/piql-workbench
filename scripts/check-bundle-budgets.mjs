import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const KB = 1024;

const budgets = [
  {
    label: "demo index",
    dir: "apps/demo/dist/assets",
    prefix: "index-",
    maxBytes: 140 * KB,
  },
  {
    label: "piql-demo index",
    dir: "apps/piql-demo/dist/assets",
    prefix: "index-",
    maxBytes: 130 * KB,
  },
  {
    label: "piql-demo echarts core",
    dir: "apps/piql-demo/dist/assets",
    prefix: "vendor-echarts-core-",
    maxBytes: 500 * KB,
  },
  {
    label: "piql-demo codemirror",
    dir: "apps/piql-demo/dist/assets",
    prefix: "vendor-codemirror-",
    maxBytes: 400 * KB,
  },
  {
    label: "piql-demo arrow",
    dir: "apps/piql-demo/dist/assets",
    prefix: "vendor-arrow-",
    maxBytes: 220 * KB,
  },
  {
    label: "workbench-demo index",
    dir: "apps/workbench-demo/dist/assets",
    prefix: "index-",
    maxBytes: 320 * KB,
  },
];

const formatKb = (bytes) => `${(bytes / KB).toFixed(2)} kB`;

async function resolveChunkSize({ dir, prefix }) {
  const files = await readdir(dir);
  const matches = files.filter(
    (file) => file.startsWith(prefix) && file.endsWith(".js"),
  );

  if (matches.length === 0) {
    throw new Error(`Missing chunk with prefix "${prefix}" in ${dir}`);
  }

  const chunks = await Promise.all(
    matches.map(async (file) => {
      const absolutePath = path.join(dir, file);
      const info = await stat(absolutePath);
      return { file, size: info.size };
    }),
  );
  const target = chunks.reduce((largest, current) =>
    current.size > largest.size ? current : largest,
  );

  return {
    file: target.file,
    size: target.size,
  };
}

const failures = [];

for (const budget of budgets) {
  const { file, size } = await resolveChunkSize(budget);
  const status = size <= budget.maxBytes ? "OK" : "FAIL";

  console.log(
    `${status.padEnd(4)} ${budget.label.padEnd(26)} ${formatKb(size).padStart(10)} / ${formatKb(budget.maxBytes).padStart(10)}  (${file})`,
  );

  if (size > budget.maxBytes) {
    failures.push({ ...budget, file, size });
  }
}

if (failures.length > 0) {
  console.error("\nBundle budget check failed.");
  for (const failure of failures) {
    const overBy = failure.size - failure.maxBytes;
    console.error(
      `- ${failure.label}: ${formatKb(failure.size)} exceeds budget by ${formatKb(overBy)}`,
    );
  }
  process.exit(1);
}

console.log("\nAll bundle budgets passed.");
