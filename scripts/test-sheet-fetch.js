async function main() {
  const url = "https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/export?format=csv";
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Sheet Status:", res.status);
    console.log("First 500 chars of sheet:", text.substring(0, 500));
  } catch (err) {
    console.error("Error fetching sheet:", err);
  }
}

main();
