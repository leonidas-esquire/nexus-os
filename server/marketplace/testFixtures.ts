// (module (memory (export "memory") 1) (func (export "_start")))
export const wasm = Buffer.from(
  "0061736d01000000010401600000030201000503010001071302066d656d6f72790200065f737461727400000a040102000b",
  "hex"
);
export const manifest = {
  schemaVersion: 1,
  name: "test-skill",
  version: "1.0.0",
  description: "A valid test skill",
  readme: "Accepts empty input and returns no output.",
  inputs:"Empty stdin is accepted.",
  outputs:"No output is produced.",
  examples:[{input:"",output:""}],
  license: "MIT",
  category: "Other",
  runtime: "wasip1-command",
  entrypoint: "_start",
  pricing: "free",
} as const;
