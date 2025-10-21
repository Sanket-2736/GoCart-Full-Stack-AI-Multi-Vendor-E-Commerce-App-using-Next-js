import prisma from "@/lib/prisma";
import { inngest } from "./client";

// --- CREATE USER ---
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-create" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const user = event.data;

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address || "",
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        image: user.image_url || null,
      },
    });
  }
);

// --- UPDATE USER ---
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const user = event.data; // ✅ fix: should be "user", not "data"

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email_addresses?.[0]?.email_address || "",
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        image: user.image_url || null,
      },
    });
  }
);

// --- DELETE USER ---
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-deletion" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const user = event.data;

    await prisma.user.delete({
      where: { id: user.id },
    });
  }
);
