import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// get all approved stores

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const body = await req.json();
        const { storeId } = body; 
        if(!storeId){
            return NextResponse.json({ error : "Store ID is required!" }, {status: 400});
        }

        const store = await prisma.store.findUnique({
            where : { id : storeId },
        });

        if(!store){
            return NextResponse.json({ error : "Store not found!" }, {status: 404});
        }

        await prisma.store.update({
            where : { id : storeId },
            data :{
                isActive : !store.isActive
            }
        })

        return NextResponse.json({ message : "Store status updated successfully!" });
    } catch (error) {
        console.error('Error fetching stores:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}