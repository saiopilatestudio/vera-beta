const topics = [
 ["Medicina deportiva", /dolor|lesi[oó]n|s[ií]ntoma|mareo|medicin/i],
 ["Sueño y recuperación", /sue[ñn]o|dorm|descans|fatiga|siesta|recuper/i],
 ["Nutrición deportiva", /nutri|comid|com[ií]|cen[ae]|prote[ií]|calor[ií]|hidrata|suplement/i],
 ["Maquinaria y biomecánica", /m[aá]quina|life fitness|polea|biomec/i],
 ["Hipertrofia", /entren|serie|repetic|pesas|carga|hipertrof/i],
 ["Psicología deportiva", /motiv|estr[eé]s|psicolog/i],
 ["Fisioterapia deportiva", /fisioter|movilidad/i],
 ["Endocrinología", /hormon|endocrin/i],
 ["Posing", /posing|poses/i],
];
export function specialists(question){
 const text=String(question||"");
 const explicit=topics.find(([name])=>text.startsWith(name+" · "));
 if(explicit)return [explicit[0]];
 if(/estado general|revisi[oó]n global/i.test(text))return ['Hipertrofia','Nutrición deportiva','Sueño y recuperación','Medicina deportiva'];
 return topics.filter(([,pattern])=>pattern.test(text)).slice(0,3).map(([name])=>name);
}
