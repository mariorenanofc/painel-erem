require('dotenv').config({ path: '.env.local' });

async function testSheetsXP() {
  const url = process.env.GOOGLE_API_URL || process.env.NEXT_PUBLIC_GOOGLE_API_URL;
  if (!url) {
    console.error("No GOOGLE_API_URL in .env.local");
    return;
  }
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buscar_ranking", token: process.env.TUTOR_TOKEN_SECRET || "" })
    });
    
    const text = await res.text();
    let data;
    try {
       data = JSON.parse(text);
    } catch (e) {
       console.log("Raw text:", text.substring(0, 500));
       return;
    }
    
    const arrayRanking = data.ranking || data.listaAlunos;
    if (arrayRanking && arrayRanking.length > 0) {
      console.log("SUCCESS! Got ranking from Sheets. First 5 students:");
      for(let i=0; i<Math.min(5, arrayRanking.length); i++) {
         console.log(arrayRanking[i]);
      }
      console.log("Total students in sheets:", arrayRanking.length);
    } else {
      console.log("No ranking data found in sheets response:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testSheetsXP();
