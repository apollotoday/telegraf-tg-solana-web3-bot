import { NextResponse } from "next/server";
import { addUserInfoToWaitlist } from "@/app/api/actions/marketMakingInfo";

export async function POST(req: Request) {
  const {
    email,
    location,
    timeZone,
    ip,
    languages,
  }: {
    email: string;
    location: string;
    ip: string;
    timeZone: string;
    languages: string;
  } = await req.json();

  console.log("arrived!");
  try {
    await addUserInfoToWaitlist({
      email,
      location,
      ip,
      timeZone,
      languages,
    });
    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 }
    );
  }
}
