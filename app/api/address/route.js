import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const {address} = await req.json();

        address.userId = userId;

        const newAddress = await prisma.address.create({
            data : address
        })

        return NextResponse.json({message : "Address added successfully"}, {status : 200});
    } catch (error) {
        console.error("Error adding address:", error);
        return NextResponse.json({message : "Error adding address"}, {status : 500} );
    }
}

export async function GET(req) {
    try {
        const {userId} = getAuth(req);

        const addresses = await prisma.address.findMany({
            where : {id : userId}
        })

        return NextResponse.json({addresses}, {status : 200});
    } catch (error) {
        console.error("Error getting address:", error);
        return NextResponse.json({message : "Error getting address"}, {status : 500} );
    }
}