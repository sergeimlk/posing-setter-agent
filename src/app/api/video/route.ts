import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VIDEOS_DIR = "/Users/mily/Documents/MANAEL/TEAM PE SKOOL/videos_cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name || !name.endsWith(".mp4")) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  const filePath = path.join(VIDEOS_DIR, name);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize.toString(),
      "Content-Type": "video/mp4",
    };

    // Construct stream response
    const stream = new ReadableStream({
      start(controller) {
        file.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk as any)));
        file.on("end", () => controller.close());
        file.on("error", (err) => controller.error(err));
      },
      cancel() {
        file.destroy();
      }
    });

    return new Response(stream, { status: 206, headers: head });
  } else {
    const head = {
      "Content-Length": fileSize.toString(),
      "Content-Type": "video/mp4",
    };
    const file = fs.createReadStream(filePath);
    
    const stream = new ReadableStream({
      start(controller) {
        file.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk as any)));
        file.on("end", () => controller.close());
        file.on("error", (err) => controller.error(err));
      },
      cancel() {
        file.destroy();
      }
    });

    return new Response(stream, { status: 200, headers: head });
  }
}
