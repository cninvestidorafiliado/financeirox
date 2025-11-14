import { NextResponse } from "next/server";
import { supabase, hasSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (!hasSupabase)
      return NextResponse.json(
        { ok: false, reason: "Missing env" },
        { status: 500 }
      );
    const { data, error } = await supabase
      .from("transactions")
      .select("id")
      .limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, rows: data?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: e.message || String(e) },
      { status: 500 }
    );
  }
}
