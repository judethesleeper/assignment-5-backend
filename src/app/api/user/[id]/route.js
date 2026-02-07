import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// 1. OPTIONS: Handle CORS pre-flight
export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 2. GET: Fetch a single user by ID
export async function GET(req, { params }) {
  const { id } = await params; // Get the ID from the URL [cite: 306-307]
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    // Find user by _id. Must convert string ID to ObjectId [cite: 313]
    const result = await db
      .collection("user")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. DELETE: Remove a user by ID
export async function DELETE(req, { params }) {
  const { id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    // Delete the user with the matching _id
    const result = await db
      .collection("user")
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 4. PATCH: Update specific fields of a user
export async function PATCH(req, { params }) {
  const { id } = await params;
  const data = await req.json(); // Get the data to update [cite: 329]

  // Create an object with only the fields we want to update
  const updateFields = {};
  if (data.firstname) updateFields.firstname = data.firstname;
  if (data.lastname) updateFields.lastname = data.lastname;
  // You can add more fields here if needed (e.g., status, email)

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");

    // Update the user using $set operator [cite: 342-343]
    const result = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500, headers: corsHeaders }
    );
  }
}