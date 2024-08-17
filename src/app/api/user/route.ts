import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, username, password } = body;

    // check if email already exists

    const existingEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { user: null, message: `Email ${email} already exists` },
        { status: 409 }
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });
    if (existingUser) {
      return NextResponse.json(
        { user: null, message: `User ${username} already exists` },
        { status: 409 }
      );
    }

    const hashedPass = await hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPass,
      },
    });

    return NextResponse.json(
      { user: newUser, message: "Successfully created user" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Could Not Add Recipe" },
      { status: 500 }
    );
  }
}
