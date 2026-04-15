import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return Response.json({ error: "ファイルがありません" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "washington-pos",
      transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
    });
    return Response.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === "object" ? JSON.stringify(e) : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
