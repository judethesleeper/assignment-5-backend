import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

// 1. OPTIONS: Handles browser security checks (CORS Pre-flight)
export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 2. GET: Fetches the list of all users (Read)
export async function GET(req) {
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");

    // Fetch all users from the "user" collection
    // .find({}) means "find everything"
    // .toArray() converts the database cursor to a JavaScript array
    const users = await db.collection("user").find({}).toArray();

    // Return the users as JSON
    return NextResponse.json(users, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. POST: Creates a new user
export async function POST(req) {
  try {
    // Read the data sent from the Frontend
    const data = await req.json();
    const { username, email, password, firstname, lastname } = data;

    // Validation: Ensure mandatory fields are present
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Missing mandatory data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");

    // Insert the new user
    const result = await db.collection("user").insertOne({
      username: username,
      email: email,
      // Hash the password so it's not stored as plain text
      password: await bcrypt.hash(password, 10),
      firstname: firstname,
      lastname: lastname,
      status: "ACTIVE",
    });

    // Return the ID of the new user
    return NextResponse.json(
      { id: result.insertedId },
      { status: 200, headers: corsHeaders }
    );
  } catch (exception) {
    console.log("exception", exception.toString());
    const errorMsg = exception.toString();
    
    // Simple duplicate check logic
    let displayErrorMsg = "Error creating user";
    if (errorMsg.includes("duplicate")) {
        if (errorMsg.includes("username")) displayErrorMsg = "Duplicate Username!!";
        else if (errorMsg.includes("email")) displayErrorMsg = "Duplicate Email!!";
    }

    return NextResponse.json(
      { message: displayErrorMsg },
      { status: 400, headers: corsHeaders }
    );
  }
}