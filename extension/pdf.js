// ═══ Reading the board itself — the flights live inside a PDF, not on the page ═══
// Each AMC terminal page links a "72 Hour Schedule" PDF (one slide per upcoming day, carrying roll call
// times and seat releases) and a "30 Day PE Schedule" PDF (dates + destinations only). Scraping the page
// HTML finds the LINKS; the numbers are inside the files. So: fetch the file and pull its text.
//
// No PDF library in a service worker, so this is a minimal text extractor: walk the stream objects,
// inflate the FlateDecode ones with the platform's own DecompressionStream, and read the text-showing
// operators (Tj / TJ / ' / "). Enough for slide decks, which are nearly all short text runs.

async function inflate(bytes){
  try{
    const ds = new DecompressionStream("deflate");
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(buf);
  }catch(e){
    try{ // some writers emit raw deflate without the zlib header
      const ds = new DecompressionStream("deflate-raw");
      const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
      return new Uint8Array(buf);
    }catch(e2){ return null; }
  }
}

// PDF strings: (literal) with \ escapes and \ooo octal, or <hex>
function unescapePdf(s){
  let out = "";
  for (let i = 0; i < s.length; i++){
    const c = s[i];
    if (c !== "\\") { out += c; continue; }
    const n = s[++i];
    if (n === "n") out += "\n"; else if (n === "r") out += "\n"; else if (n === "t") out += " ";
    else if (n >= "0" && n <= "7"){
      let o = n; while (o.length < 3 && s[i+1] >= "0" && s[i+1] <= "7") o += s[++i];
      out += String.fromCharCode(parseInt(o, 8));
    } else out += n;
  }
  return out;
}
function hexToText(h){
  const s = h.replace(/[^0-9a-fA-F]/g, "");
  let out = "";
  for (let i = 0; i + 1 < s.length; i += 2){
    const v = parseInt(s.substr(i, 2), 16);
    if (v >= 32 || v === 10 || v === 13) out += String.fromCharCode(v);
  }
  return out;
}
// Pull the visible text out of one content stream
function streamText(str){
  let out = "";
  // TJ arrays first — slide text is kerned into [ (A) -250 (B) ] TJ. A large negative kern IS the space
  // between words, so keep it: without this, "ROLL CALL 0630L" collapses to "ROLLCALL0630L".
  str.replace(/\[([^\]]*)\]\s*TJ/g, (m, inner) => {
    inner.replace(/\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]+>|-?[\d.]+/g, tok => {
      if (tok[0] === "(") out += unescapePdf(tok.slice(1, -1));
      else if (tok[0] === "<") out += hexToText(tok.slice(1, -1));
      else if (Math.abs(parseFloat(tok)) >= 50 && !/\s$/.test(out)) out += " ";
      return "";
    });
    out += "\n";
    return "";
  });
  str.replace(/\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")/g, tok => {
    out += unescapePdf(tok.slice(1, tok.lastIndexOf(")"))) + "\n"; return "";
  });
  str.replace(/<([0-9a-fA-F\s]+)>\s*Tj/g, (m, h) => { out += hexToText(h) + "\n"; return ""; });
  // Td/TD/T* move the pen — treat a vertical move as a line break so rows stay rows
  return out;
}

async function pdfText(url){
  const r = await fetch(url, { cache: "no-store", credentials: "omit" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const raw = new Uint8Array(await r.arrayBuffer());
  if (String.fromCharCode.apply(null, raw.slice(0, 5)) !== "%PDF-") throw new Error("not a pdf");
  const latin = new TextDecoder("latin1").decode(raw);
  let text = "";
  const re = /stream\r?\n?/g;
  let m;
  while ((m = re.exec(latin))){
    const start = m.index + m[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    re.lastIndex = end;
    const head = latin.slice(Math.max(0, m.index - 420), m.index);
    const body = raw.subarray(start, end);
    let s = null;
    if (/FlateDecode/.test(head)){
      const inf = await inflate(body);
      if (inf) s = new TextDecoder("latin1").decode(inf);
    } else if (!/(DCTDecode|JPXDecode|CCITTFax|Image)/.test(head)){
      s = new TextDecoder("latin1").decode(body);
    }
    if (s && /(Tj|TJ)/.test(s)) text += streamText(s) + "\n";
    if (text.length > 240000) break;
  }
  return text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// Which file is which — the labels are inconsistent across terminals, so match on both name and text.
function classifyDoc(label, url){
  const s = (label + " " + url).toLowerCase();
  if (/72\s*-?\s*h(ou)?r|72hour|72hr/.test(s)) return "board72";
  if (/30\s*-?\s*day|patriot|\bpe\b.*sched|sched.*\bpe\b/.test(s)) return "pe30";
  if (/roll\s*call|historical|history/.test(s)) return "rollcall";
  if (/sched|slide|flight/.test(s)) return "sched";
  return "other";
}
if (typeof self !== "undefined"){ self.pdfText = pdfText; self.classifyDoc = classifyDoc; self.streamText = streamText; }
