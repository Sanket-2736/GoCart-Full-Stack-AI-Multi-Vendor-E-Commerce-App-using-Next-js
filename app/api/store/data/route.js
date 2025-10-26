import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const {searchParams} = new URL(req.url);
        const username = searchParams.get('username').toLowerCase();

        if(!username){
            return NextResponse.json({ error : "Username is required!" }, {status: 400});
        }

        const store = await prisma.store.findUnique({
            where : { username, isActive: true },
            include:{Product: {include: {rating : true}}}
        })

        if(!store){
            return NextResponse.json({ error : "Store not found!" }, {status: 404});
        }

        return NextResponse.json({ store });
    } catch (error) {
        console.error('Error fetching store data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}