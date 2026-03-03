import { format } from "date-fns";
import { MemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { getExportRows } from "@/lib/data";

function csvEscape(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(value);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

export async function GET(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (member.role !== MemberRole.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { type } = await context.params;
  const from = parseDate(request.nextUrl.searchParams.get("from"));
  const to = parseDate(request.nextUrl.searchParams.get("to"), true);
  const rows = await getExportRows({ from, to }, type);

  let headers: string[] = [];
  let dataRows: string[][] = [];

  switch (type) {
    case "referrals":
      headers = ["Created", "From", "From Business", "To", "To Business", "Lead", "Contact", "Notes", "Status"];
      dataRows = rows.map((row: any) => [
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        row.fromMember.name,
        row.fromMember.businessName,
        row.toMember.name,
        row.toMember.businessName,
        row.leadName,
        row.leadContact,
        row.notes,
        row.status,
      ]);
      break;
    case "thank_you":
      headers = ["Created", "From", "From Business", "To", "To Business", "Amount", "Referral Lead", "Notes"];
      dataRows = rows.map((row: any) => [
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        row.fromMember.name,
        row.fromMember.businessName,
        row.toMember.name,
        row.toMember.businessName,
        row.amount,
        row.referral?.leadName,
        row.notes,
      ]);
      break;
    case "non_attendance":
      headers = ["Created", "Meeting", "Member", "Business", "Sub Provided", "Sub Name", "Late"];
      dataRows = rows.map((row: any) => [
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        format(row.meeting.meetingDate, "yyyy-MM-dd"),
        row.member.name,
        row.member.businessName,
        row.hasSub ? "Yes" : "No",
        row.subName,
        row.createdLate ? "Yes" : "No",
      ]);
      break;
    case "one_to_one":
      headers = ["Created", "Date", "Member A", "Business A", "Member B", "Business B"];
      dataRows = rows.map((row: any) => [
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        format(row.meetingDate, "yyyy-MM-dd"),
        row.memberLow.name,
        row.memberLow.businessName,
        row.memberHigh.name,
        row.memberHigh.businessName,
      ]);
      break;
    case "visitors":
      headers = ["Created", "Meeting", "Added By", "Business", "Visitor", "Visitor Business", "Likelihood"];
      dataRows = rows.map((row: any) => [
        format(row.createdAt, "yyyy-MM-dd HH:mm"),
        format(row.meeting.meetingDate, "yyyy-MM-dd"),
        row.addedByMember.name,
        row.addedByMember.businessName,
        row.visitorName,
        row.visitorBusiness,
        row.likelihood,
      ]);
      break;
    case "monthly_summary":
      headers = ["Month", "Referrals", "Thank You", "Visitors"];
      dataRows = rows.map((row: any) => [format(row.month, "yyyy-MM"), row.referrals, row.thank_you, row.visitors]);
      break;
    default:
      return new NextResponse("Unknown export", { status: 404 });
  }

  const csv = [headers.map(csvEscape).join(","), ...dataRows.map((row) => row.map(csvEscape).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
