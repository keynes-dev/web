import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

import { createSupabaseAdminClient } from "@/lib/supabase";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .nullable()
    .optional()
    .transform((value) => value || null);

export const server = {
  requestAccess: defineAction({
    accept: "form",
    input: z.object({
      full_name: z
        .string({ error: "Enter your full name." })
        .trim()
        .min(1, "Enter your full name."),
      email: z
        .email({ error: "Enter your email address." })
        .trim()
        .pipe(z.email("Enter a valid email address."))
        .transform((value) => value.toLowerCase()),
      company: optionalText(200),
      building: optionalText(2_000),
      problem: optionalText(2_000),
    }),
    handler: async (input, { logger }) => {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("waitlist_leads").insert(input);

      if (error) {
        logger.error(
          `Could not save access request: ${error.code ?? "unknown"}`,
        );
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "We couldn't submit your request. Please try again.",
        });
      }

      return { submitted: true };
    },
  }),
};
