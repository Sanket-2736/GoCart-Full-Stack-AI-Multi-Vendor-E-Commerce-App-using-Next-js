import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { get } from "mongoose";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const {userId} = getAuth(request);
        const formData = await request.formData();

        const name  = formData.get('name');
        const address  = formData.get('address');
        const email  = formData.get('email');
        const username  = formData.get('username');
        const contact  = formData.get('contact');
        const description  = formData.get('description');
        const image  = formData.get('image');

        if(!name || !address || !email || !username || !contact || !description || !image){
            console.log('Missing fields');
            return NextResponse.json({error: 'Missing fields'}, {status: 400});
        }

        const store = await prisma.store.findFirst({
            where: { userId: userId }
        })

        if(store){
            return NextResponse.json({status: store.status});
        }

        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        });

        if(isUsernameTaken){
            return NextResponse.json({error: 'Username is already taken'}, {status: 400});
        }

        const buffer = Buffer.from(await image.arrayBiffer());
        const response = await imagekit.files.upload({
            file : buffer,
            fileName : `${Date.now()}-${username}`,
            folder: '/stores/images/'
        });

        const optimisedImage = imagekit.helper.buildSrc({
            src: response.filePath,
            transformation : [
                {quality: "auto"},
                {format: "webp"},
                {width: "512"}
            ]
        });

        const newStore = await prisma.store.create({
            data : {
                userId, name, description, email, address, username: username.toLowerCase(), contact, image: optimisedImage
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                store :{
                    connect: { id: newStore.id }
                }
            }
        });

        return NextResponse.json({Message: 'Applied, waiting for approval'});
    } catch (error) {
        console.log('Error creating store:', error);
        return NextResponse.json({error: error.code || error.message});
    }
}

export async function GET(request) {
    try {
        const {userId} = getAuth(request);
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        });

        if(store){
            return NextResponse.json({status: store.status});
        }

        return NextResponse.json({status: 'not registered!'});
    } catch (error) {
        console.log('Error getting status:', error);
        return NextResponse.json({error: error.code || error.message}, {status: 400});
    }
}