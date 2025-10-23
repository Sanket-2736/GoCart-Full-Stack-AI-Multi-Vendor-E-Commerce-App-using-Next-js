import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const {userId} = getAuth(req);
        const storeId = await authSeller(userId);

        if(!storeId){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();

        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const images = formData.getAll('images');
        const price = Number(formData.get('price'));
        const mrp = Number(formData.get('mrp'));
        const image = formData.get('image');

        if(!name || !description || !category || imagest.length === 0 || !price || !mrp || !image){
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const imagesUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.files.upload({
                file : buffer,
                fileName : `${Date.now()}-${name}`,
                folder: 'products'
            });

            const url = imagekit.helper.buildSrc({
                src : response.filePath,
                transformation:[
                    {quality: "auto"},
                    {format: "webp"},
                    {width: "1024"}
                ]
            })

            return url;
        }))

        await prisma.product.create({
            data : {
                name, description, mrp, price, category, images : imagesUrl, storeId
            }
        });

        return NextResponse.json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const {userId} = getAuth(req);
        const storeId = await authSeller(userId);

        if(!storeId){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: { storeId: storeId }
        })

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}