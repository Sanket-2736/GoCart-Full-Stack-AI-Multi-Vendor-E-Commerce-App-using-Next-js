import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        const { code } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
        }

        // 🌟 FIX: Convert the incoming code to uppercase for case-insensitive matching
        const uppercaseCode = code.toUpperCase(); // <-- Add this line!

        const coupon = await prisma.coupon.findFirst({
            where: {
                // 🌟 Use the uppercase code here
                code: uppercaseCode, 
                expiresAt: { gt: new Date() },
            },
        });

        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found!" }, { status: 404 });
        }
        
        if (coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({ where: { userId } });
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "Coupon valid for new users only." }, { status: 400 });
            }
        }

        if (coupon.forMember) {
            const userOrders = await prisma.order.findMany({ where: { userId } });
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "Coupon valid for members only." }, { status: 400 });
            }
        }

        return NextResponse.json({ coupon });
    } catch (error) {
        console.error("Error in /api/coupon:", error);
        return NextResponse.json({ error: "Internal server error!" }, { status: 500 });
    }
}