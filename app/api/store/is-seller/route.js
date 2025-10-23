import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const {userId} = getAuth(req);

        const isSeller = await authSeller(userId);

        if(!isSeller){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const storeInfo = await prisma.store.findUnique({
            where : { id : isSeller },
        });

        return NextResponse.json({ isSeller, storeInfo });
    } catch (error) {
        console.error('Error checking seller status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}