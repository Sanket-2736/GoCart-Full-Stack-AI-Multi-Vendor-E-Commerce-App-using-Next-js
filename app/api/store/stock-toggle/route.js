import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const {productId} = await req.json();

        if(!productId){
            return NextResponse.json({ error: 'Missing details: productId' }, { status: 400 });
        }

        const storeId = await authSeller(userId);

        if(!storeId){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const product = await prisma.product.findFirst({
            where : { id : productId, storeId }
        });

        if(!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        await prisma.product.update({
            where : { id : productId },
            data : {
                inStock : !product.inStock
            }
        });

        return NextResponse.json({ message: 'Product stock status toggled successfully' }); 
    } catch (error) {
        console.error('Error toggling product stock status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}