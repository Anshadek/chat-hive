export function roomIdFor(a,b){
    const A = String(a).toLowerCase();
    const B = String(b).toLowerCase();
    return A < B ? `${A}_${B}` : `${B}_${A}`;
  }
  