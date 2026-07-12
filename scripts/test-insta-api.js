async function main() {
  const username = "lvcxs_itl";
  const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response text length:", text.length);
    if (text.includes("profile_pic_url")) {
      console.log("✅ Found profile_pic_url in JSON!");
    } else {
      console.log("❌ JSON did not contain profile_pic_url");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
