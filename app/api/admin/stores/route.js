import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// get all approved stores

export async function GET(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const stores = await prisma.store.findMany({
            where : { status : 'approved'},
            include : { user : true }
        });

        return NextResponse.json({ stores });
    } catch (error) {
        console.error('Error fetching stores:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}