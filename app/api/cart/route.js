import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const {cart} = await req.json();

        await prisma.user.update({
            where : {id : userId},
            data : {cart : cart}
        });

        return NextResponse.json({message : "Cart updated successfully"}, {status : 200});
    } catch (error) {
        console.error("Error updating cart:", error);
        return NextResponse.json({message : "Error updating cart"}, {status : 500} );
    }
}

export async function GET(req){
    try {
        const {userId} = getAuth(req);
        const user = await prisma.user.findUnique({
            where : {id : userId}
        });
        return NextResponse.json({cart : user.cart || []}, {status : 200});
    } catch (error) {   
        console.error("Error fetching cart:", error);
        return NextResponse.json({message : "Error fetching cart"}, {status : 500} );
    }
}