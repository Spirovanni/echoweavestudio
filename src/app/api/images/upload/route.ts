import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * POST /api/images/upload
 * Upload an image file to Supabase Storage and optionally create a database record.
 *
 * FormData fields:
 * - file: Image file (required)
 * - project_id: UUID (required)
 * - title: String (optional, defaults to filename)
 * - caption: String (optional)
 * - symbolism: String (optional)
 * - create_record: "true" | "false" (optional, default "true")
 *
 * Returns: { url: string, data?: Image }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("project_id") as string | null;
    const title = formData.get("title") as string | null;
    const caption = formData.get("caption") as string | null;
    const symbolism = formData.get("symbolism") as string | null;
    const createRecord = formData.get("create_record") !== "false";

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Verify project access
    const hasAccess = await verifyProjectAccess(supabase!, user!.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase!.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase!.storage
      .from("images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Optionally create database record
    let imageRecord = null;
    if (createRecord) {
      const { data: dbData, error: dbError } = await supabase!
        .from("ews_images")
        .insert({
          project_id: projectId,
          title: title || file.name,
          image_url: imageUrl,
          caption: caption || null,
          symbolism: symbolism || null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError);
        // Don't fail the upload if DB insert fails - return the URL
        return NextResponse.json(
          {
            url: imageUrl,
            warning: "Image uploaded but failed to create database record",
          },
          { status: 201 }
        );
      }

      imageRecord = dbData;
    }

    return NextResponse.json(
      {
        url: imageUrl,
        data: imageRecord,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
