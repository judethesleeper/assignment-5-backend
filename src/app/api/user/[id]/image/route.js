import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

async function parseMultipartFormData(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error("Invalid content-type");
  }
  return await req.formData();
}

export async function POST(req, { params }) {
  const { id } = await params;
  let formData;
  
  try {
    formData = await parseMultipartFormData(req);
  } catch (err) {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400, headers: corsHeaders });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400, headers: corsHeaders });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ message: "Only image files allowed" }, { status: 400, headers: corsHeaders });
  }

  const ext = file.name.split(".").pop();
  const filename = uuidv4() + "." + ext;
  
  // 1. Define the directory path
  const uploadDir = path.join(process.cwd(), "public", "profile-images");
  
  try {
    // 2. Automatically create the directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });
    
    // 3. Save the file
    const savePath = path.join(uploadDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(savePath, Buffer.from(arrayBuffer));
  } catch (fsError) {
    console.error("File System Error:", fsError);
    return NextResponse.json({ message: "Failed to save file to disk" }, { status: 500, headers: corsHeaders });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    await db.collection("user").updateOne(
      { _id: new ObjectId(id) },
      { $set: { profileImage: `/profile-images/${filename}` } }
    );
    return NextResponse.json({ imageUrl: `/profile-images/${filename}` }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ message: "Failed to update user database" }, { status: 500, headers: corsHeaders });
  }
}