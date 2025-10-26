import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name");
    const address = formData.get("address");
    const email = formData.get("email");
    const username = formData.get("username");
    const contact = formData.get("contact");
    const description = formData.get("description");
    const image = formData.get("image");

    if (!name || !address || !email || !username || !contact || !description || !image) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingStore = await prisma.store.findFirst({ where: { userId } });
    if (existingStore) {
      return NextResponse.json({ status: existingStore.status });
    }

    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `${Date.now()}-${username}`,
      folder: "/stores/images/",
    });

    const imageUrl = imagekit.url({
      src: uploadResponse.url,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    const store = await prisma.store.create({
      data: {
        name,
        username: username.toLowerCase(),
        description,
        email,
        contact,
        address,
        userId,
        logo: imageUrl,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: store.id } } },
    });

    return NextResponse.json({ message: "Applied, waiting for approval" });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findFirst({ where: { userId } });
    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({ status: "not registered!" });
  } catch (error) {
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
