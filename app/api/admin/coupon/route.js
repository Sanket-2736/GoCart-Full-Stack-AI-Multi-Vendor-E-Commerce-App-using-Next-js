import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req){
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const {coupon} = await req.json();
        console.log("Creating coupon:", coupon);

        if(!coupon || !coupon.code || !coupon.discount){
            return NextResponse.json({ error : "Invalid coupon data!" }, {status: 400});
        }

        coupon.code = coupon.code.toUpperCase();

        await prisma.coupon.create({
            data : coupon            
        }).then(async (coupon) => {
            // fn to delete coupon on expiry
            try {
                await inngest.send({
                    name: 'app/coupon.expired',
                    data: { code: coupon.code, expires_at: coupon.expiresAt }
                });
                console.log("Inngest event sent successfully!");
            } catch (err) {
                console.error("Error sending Inngest event:", err);
            }
        });

        return NextResponse.json({ message : "Coupon created successfully!" });
    } catch (error) {
        console.error('Error creating coupon:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);
        console.log("User ID:", userId, "Is Admin:", isAdmin);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const {searchParams} = req.nextUrl;

        const code = searchParams.get('code');
        console.log("Deleting coupon with code:", code);
        if(!code){
            return NextResponse.json({ error : "Coupon code is required!" }, {status: 400});
        }

        await prisma.coupon.delete({
            where : { code }
        });

        return NextResponse.json({ message : "Coupon deleted successfully!" });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// get all coupons
export async function GET(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const coupons = await prisma.coupon.findMany();

        return NextResponse.json({ coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}