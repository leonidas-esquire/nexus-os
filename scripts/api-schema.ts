import { z } from "zod";
// JSON representation after SuperJSON serialization. The reference explicitly marks dates.
export function jsonSchema(
  schema: z.ZodType,
  io: "input" | "output" = "input"
) {
  return z.toJSONSchema(schema, {
    io,
    target: "draft-2020-12",
    unrepresentable: "any",
    override(ctx) {
      if (ctx.zodSchema._zod.def.type === "date")
        Object.assign(ctx.jsonSchema, {
          type: "string",
          format: "date-time",
          "x-superjson-type": "Date",
        });
    },
  });
}
