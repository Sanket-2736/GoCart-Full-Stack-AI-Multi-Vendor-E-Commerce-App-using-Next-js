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

// inngest function to delete the coupon when it expires

export const deleteCouponOnExpiry = inngest.createFunction(
  { id: "delete-coupon-on-expiry" },
  {event : 'app/coupon.expired'},
  async ({event, step}) => {
    const {data} = event;
    const expiryDate = new Date(data.expires_at);
    await step.sleepUntil('wait-for-expiry', expiryDate);

    await step.run('delete-coupon-from-database', async () => {
      await prisma.coupon.delete({
        where: { code : data.code }
      })
    })
  }
)