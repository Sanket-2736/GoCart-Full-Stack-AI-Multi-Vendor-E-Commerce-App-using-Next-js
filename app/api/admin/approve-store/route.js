import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }
        
        const {storeId, status} = await req.json();
        
        if(status === 'approved'){
            await prisma.store.update({
                where : { id : storeId },
                data : { status : 'approved', isActive : true }
            });
            return NextResponse.json({ message : "Store approved successfully!" })
        } else if(status === 'rejected'){
            await prisma.store.update({
                where : { id : storeId },
                data : { status : 'rejected' }
            });
            return NextResponse.json({ message : "Store rejected successfully!" })
        } else {
            return NextResponse.json({ error : "Invalid status!" }, {status: 400});
        }

        return NextResponse.json({ message : "Store status updated successfully!" });
    } catch (error) {
        console.error('Error approving/rejecting store:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// get all pending or rejected stores

export async function GET(req) {
    try {
        const {userId} = getAuth(req);
        const isAdmin = await authAdmin(userId);

        if(!isAdmin){
            return NextResponse.json({ error : "Not authorised!" }, {status: 401});
        }

        const stores = await prisma.store.findMany({
            where : { status : { in : ['pending', 'rejected'] } },
            include : { user : true }
        });

        return NextResponse.json({ stores });
    } catch (error) {
        console.error('Error fetching stores:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}