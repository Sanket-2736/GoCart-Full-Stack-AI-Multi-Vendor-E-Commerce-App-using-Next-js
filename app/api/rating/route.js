import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const {orderId, productId, rating, review} = await req.json();
        const order = await prisma.order.findUnique({
            where : {id : orderId, userId}
        });

        if(!order) {
            return NextResponse.json({error : "Order not found!"}, {status : 404})
        }

        const isAlreadyRated = await prisma.rating.findFirst({
            where : {productId, orderId}
        });

        if(!isAlreadyRated){
            return NextResponse.json({error : "Product already rated!"}, {status : 404})
        }

        const response = await prisma.rating.create({
            data : {userId, productId, rating, review, orderId}
        });

        return NextResponse.json({message : "Rating added successfully!", rating : response});
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.message || error.code}, {status : 500})
    }
}

export async function GET(req) {
    try {
        const {userId} = getAuth();
        if(!userId){
            return NextResponse.json({error: "Unauthorised!"}, {status:404});
        }

        const ratings = await prisma.rating.findMany({
            where : {userId}
        })
        return NextResponse.json({ratings});
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.message || error.code}, {status : 500})
    }
}