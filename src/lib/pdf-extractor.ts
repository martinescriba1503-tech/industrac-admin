import { PDFParse } from "pdf-parse";

export interface DatosCotizacionExtraidos {
  numero: string;
  fecha: string;
  cliente: string;
  ruc: string;
  equipoModelo: string;
  serie: string;
  moneda: "USD" | "PEN" | "";
  subtotal: number | null;
  igv: number | null;
  total: number | null;
  condicionPago: string;
  validezOferta: string;
  descripcion: string;
  coherenciaMontos: boolean;
  advertencias: string[];
}

export interface EstructuraDocumentoExtraida {
  numero: string;
  cliente: string;
  descripcion: string;
  fecha: string;
  equipoModelo: string;
  serie: string;
}

/**
 * Analiza la descripción o nombre del documento siguiendo la estructura oficial de INDUSTRAC:
 * Ejemplo: "00100 COT QROMA 8000 HRS GA55 EQUIPO #1 26MAY26"
 *  - 00100: Número de cotización
 *  - QROMA: Cliente
 *  - 8000 HRS GA55 EQUIPO #1: Descripción del trabajo
 *  - GA55: Modelo de compresor
 *  - EQUIPO #1: Identificador o serie del equipo
 *  - 26MAY26: Fecha (2026-05-26)
 */
export function parsearEstructuraDocumento(str: string): EstructuraDocumentoExtraida | null {
  if (!str) return null;
  // Quitar extensión .pdf si existe
  const limpio = str.replace(/\.pdf$/i, "").trim();
  // Normalizar guiones y barras bajas a espacios
  const normalizado = limpio.replace(/[-_]+/g, " ").replace(/\s+/g, " ");

  // Patrón: [NUMERO] COT [CUERPO] [FECHA: DDMESYY]
  const regex = /\b(\d{3,6})\s+(?:COT|COTIZACI[OÓ]N)\s+(.+?)\s+(\d{1,2})\s*([A-Za-z]{3})\s*(\d{2,4})\b/i;
  const match = normalizado.match(regex);
  if (!match) return null;

  const numero = match[1];
  const cuerpo = match[2].trim();
  const dia = match[3].padStart(2, "0");
  const mesStr = match[4].toUpperCase();
  let anio = match[5];
  if (anio.length === 2) anio = "20" + anio;

  const meses: Record<string, string> = {
    ENE: "01",
    FEB: "02",
    MAR: "03",
    ABR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AGO: "08",
    SET: "09",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DIC: "12",
  };
  const mes = meses[mesStr] || "01";
  const fecha = `${anio}-${mes}-${dia}`;

  // Separar cliente de descripción/equipo
  let cliente = cuerpo;
  let descripcion = "";

  const splitRegex =
    /^(.*?)(?:\s+)((\d+\s*HRS?|MTTO|MANTENIMIENTO|OVERHAUL|SERVICIO|KIT|REPARACION|CAMBIO|INSPECCION|GA\s*\d+|COMPRESOR).*)$/i;
  const splitMatch = cuerpo.match(splitRegex);
  if (splitMatch) {
    cliente = splitMatch[1].trim();
    descripcion = splitMatch[2].trim();
  } else {
    const partes = cuerpo.split(" ");
    if (partes.length > 1) {
      cliente = partes[0];
      descripcion = partes.slice(1).join(" ");
    }
  }

  // Extraer equipo modelo (ej: GA55, GA22, Atlas Copco GA55, Sullair...)
  let equipoModelo = "";
  const matchModelo = descripcion.match(
    /\b(Atlas Copco(?:\s+[A-Za-z0-9\-]+)+|Sullair(?:\s+[A-Za-z0-9\-]+)+|Ingersoll Rand(?:\s+[A-Za-z0-9\-]+)+|Kaeser(?:\s+[A-Za-z0-9\-]+)+|GA\s*\d+|COMPRESOR[^\s]*)\b/i
  );
  if (matchModelo) {
    equipoModelo = matchModelo[0].trim();
  }

  // Extraer serie o identificador (ej: EQUIPO #1, S/N...)
  let serie = "";
  const matchSerie = descripcion.match(
    /(EQUIPO\s*#?\s*\d+|EQ\s*#?\s*\d+|S\/N\s*[:\s]?\S+|SERIE\s*[:\s]?\S+)/i
  );
  if (matchSerie) {
    serie = matchSerie[0].trim();
  }

  return { numero, cliente, descripcion, fecha, equipoModelo, serie };
}

/**
 * Normaliza fechas peruanas a formato YYYY-MM-DD para inputs HTML5
 */
function normalizarFecha(textoFecha: string): string {
  if (!textoFecha) return "";

  // Formato YYYY-MM-DD
  const isoMatch = textoFecha.match(/\b(20\d\d)[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = textoFecha.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d\d)\b/);
  if (dmyMatch) {
    const dia = dmyMatch[1].padStart(2, "0");
    const mes = dmyMatch[2].padStart(2, "0");
    const anio = dmyMatch[3];
    return `${anio}-${mes}-${dia}`;
  }

  // Formato texto: "25 de noviembre de 2026"
  const meses: Record<string, string> = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    setiembre: "09",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };

  const regexTexto = /\b(0?[1-9]|[12]\d|3[01])\s+de\s+([a-zA-Z]+)(?:\s+del?|\s+de)?\s+(20\d\d)\b/i;
  const textoMatch = textoFecha.match(regexTexto);
  if (textoMatch) {
    const dia = textoMatch[1].padStart(2, "0");
    const mesNom = textoMatch[2].toLowerCase();
    const anio = textoMatch[3];
    if (meses[mesNom]) {
      return `${anio}-${meses[mesNom]}-${dia}`;
    }
  }

  return "";
}

/**
 * Limpia y convierte texto de importe monetario a número decimal
 */
function parsearImporte(str: string): number | null {
  if (!str) return null;
  let limpio = str.replace(/[^\d.,]/g, "").trim();
  if (!limpio) return null;

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(limpio)) {
    limpio = limpio.replace(/,/g, "");
  } else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(limpio)) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(,\d{2})$/.test(limpio)) {
    limpio = limpio.replace(",", ".");
  }

  const num = parseFloat(limpio);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/**
 * Extrae texto de un buffer PDF usando pdf-parse.
 * Es ultra-resiliente: si es un escaneo o estructura compleja, nunca tumba el servidor
 * y permite que el análisis proceda con la descripción/nombre del documento.
 */
export async function extraerTextoDePdf(buffer: Buffer): Promise<string> {
  let texto = "";

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    texto = result?.text || "";
  } catch (pdfErr) {
    console.warn("PDFParse no pudo extraer capa de texto directo:", pdfErr);
  }

  // Si tiene poco texto, intentar OCR con tiempo límite estricto de 4 segundos
  if (texto.trim().length < 20) {
    try {
      const ocrTimeout = new Promise<string | null>((resolve) =>
        setTimeout(() => resolve(null), 4000)
      );
      const ocrAction = (async () => {
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("spa");
          const ocrResult = await worker.recognize(buffer);
          await worker.terminate();
          return ocrResult?.data?.text || null;
        } catch {
          return null;
        }
      })();

      const ocrText = await Promise.race([ocrAction, ocrTimeout]);
      if (ocrText && ocrText.trim().length > texto.trim().length) {
        return ocrText;
      }
    } catch (ocrErr) {
      console.warn("OCR no disponible o agotó tiempo en este entorno:", ocrErr);
    }
  }

  return texto;
}

/**
 * Analiza el texto del PDF y/o la descripción/nombre del documento de INDUSTRAC S.A.C.
 * Estructura de descripción: "00100 COT QROMA 8000 HRS GA55 EQUIPO #1 26MAY26"
 * De la descripción extrae: número (00100), cliente (QROMA), descripción (8000 HRS GA55), fecha (26MAY26).
 * Del contenido del PDF extrae: TOTAL (subtotal), IGV y TOTAL + IGV.
 */
export function analizarTextoCotizacion(
  texto: string,
  nombreArchivo?: string,
  descripcionManual?: string
): DatosCotizacionExtraidos {
  const advertencias: string[] = [];

  // Intento 1: Extraer a partir de la estructura indicada por el usuario
  // Se evalúa: descripción manual ingresada, nombre del archivo, o líneas del texto del PDF
  let estructurado: EstructuraDocumentoExtraida | null = null;

  if (descripcionManual) {
    estructurado = parsearEstructuraDocumento(descripcionManual);
  }
  if (!estructurado && nombreArchivo) {
    estructurado = parsearEstructuraDocumento(nombreArchivo);
  }
  if (!estructurado) {
    // Buscar en las primeras 5 líneas del texto del documento si contiene la estructura
    const lineas = texto.split(/\r?\n/).slice(0, 10);
    for (const linea of lineas) {
      estructurado = parsearEstructuraDocumento(linea);
      if (estructurado) break;
    }
  }

  // 1. NÚMERO DE COTIZACIÓN
  let numero = estructurado?.numero || "";
  if (!numero) {
    const regexNumero = /(?:COTIZACI[OÓ]N|COTIZACION\s+N[°º.]?|COT\s*N[°º.]?|COT)\s*[:\-#]?\s*([A-Z0-9\-_/]{3,20})/i;
    const matchNum = texto.match(regexNumero);
    if (matchNum && matchNum[1]) {
      numero = matchNum[1].trim();
      if (!numero.toUpperCase().startsWith("COT") && texto.includes("COT")) {
        numero = `COT-${numero}`;
      }
    } else {
      const matchCod = texto.match(/\bCOT[-_]\d{3,6}[-_]\d{2,4}\b/i);
      if (matchCod) {
        numero = matchCod[0].toUpperCase();
      } else if (nombreArchivo) {
        const matchFile = nombreArchivo.match(/\bCOT[-_]\d{3,6}[-_]\d{2,4}\b/i);
        if (matchFile) {
          numero = matchFile[0].toUpperCase();
        }
      }
    }
  }

  if (!numero) {
    advertencias.push("No se encontró el número de cotización en el documento. Ingréselo manualmente.");
  }

  // 2. CLIENTE / RAZÓN SOCIAL
  let cliente = estructurado?.cliente || "";
  if (!cliente) {
    const regexCliente = /(?:Señores|Señor\(es\)|Cliente|Raz[oó]n\s+Social|Empresa)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ0-9\s.,&'-]{3,60}?)(?=(?:\r?\n|\s{2,}|RUC|Atenci[oó]n|Direcci[oó]n|Contacto|$))/i;
    const matchCliente = texto.match(regexCliente);
    if (matchCliente && matchCliente[1].trim().length > 3) {
      cliente = matchCliente[1].trim().split("\n")[0].trim().replace(/\s{2,}/g, " ");
    } else {
      const matchSufijo = texto.match(/\b([A-ZÁÉÍÓÚÑ0-9\s.,&'-]{3,50}?\s+(?:S\.?A\.?C\.?|S\.?A\.?|S\.?A\.?A\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?))\b/i);
      if (matchSufijo && matchSufijo[1]) {
        cliente = matchSufijo[1].trim().replace(/\s{2,}/g, " ");
      }
    }
  }

  // 3. DESCRIPCIÓN DEL SERVICIO
  let descripcion = estructurado?.descripcion || "";
  if (!descripcion) {
    const regexDescripcion = /(?:Descripci[oó]n\s+(?:del\s+servicio|de\s+trabajos?)|Detalle\s+del\s+servicio|Trabajos?\s+a\s+realizar|Alcance|Descripci[oó]n)\s*[:\-]?\s*([^\r\n]{5,200})/i;
    const matchDescripcion = texto.match(regexDescripcion);
    if (matchDescripcion) {
      descripcion = matchDescripcion[1].trim().replace(/\s{2,}/g, " ");
    }
  }

  // 4. FECHA DE EMISIÓN
  let fecha = estructurado?.fecha || "";
  if (!fecha) {
    const regexFechaContexto = /(?:Fecha(?:\s+de\s+emisi[oó]n)?|Emisi[oó]n|Lima)\s*[:\-]?\s*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[\s/.-](?:de\s+[a-zA-Z]+(?:\s+del?)?|[0-9]{1,2})[\s/.-][0-9]{2,4})/i;
    const matchFechaCtx = texto.match(regexFechaContexto);
    if (matchFechaCtx) {
      fecha = normalizarFecha(matchFechaCtx[1]);
    }
    if (!fecha) {
      const matchIso = texto.match(/\b(20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
      if (matchIso) {
        fecha = normalizarFecha(matchIso[0]);
      } else {
        const matchFechaGen = texto.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d\d)\b/);
        if (matchFechaGen) {
          fecha = normalizarFecha(matchFechaGen[0]);
        }
      }
    }
  }

  // 5. EQUIPO / MODELO
  let equipoModelo = estructurado?.equipoModelo || "";
  if (!equipoModelo) {
    const regexEquipoEtiqueta = /(?:Equipo\s*\/\s*Modelo|Equipo|Modelo|Compresor)\s*[:\-]?\s*([A-Za-z0-9\s/.-]{3,50}?)(?=(?:\r?\n|\s{2,}|Serie|S\/N|Hor[oó]metro|Marca|$))/i;
    const matchEquipo = texto.match(regexEquipoEtiqueta);
    if (matchEquipo && matchEquipo[1].trim().length > 2) {
      equipoModelo = matchEquipo[1].trim().split("\n")[0].replace(/\s{2,}/g, " ");
    } else {
      const marcasConocidas = [
        /\b(Atlas Copco(?:\s+[A-Za-z0-9\-]+)+)/i,
        /\b(Sullair\s+[A-Za-z0-9\-]+)/i,
        /\b(Ingersoll Rand\s+[A-Za-z0-9\-]+)/i,
        /\b(Kaeser\s+[A-Za-z0-9\-]+)/i,
        /\b(GA\s*\d+)/i,
        /\b(CompAir\s+[A-Za-z0-9\-]+)/i,
        /\b(Compresor\s+de\s+[A-Za-z0-9\-]+)/i,
      ];
      for (const regexMarca of marcasConocidas) {
        const matchM = texto.match(regexMarca);
        if (matchM && matchM[1]) {
          equipoModelo = matchM[1].trim().replace(/\s{2,}/g, " ");
          break;
        }
      }
    }
  }

  // 6. NÚMERO DE SERIE
  let serie = estructurado?.serie || "";
  if (!serie) {
    const regexSerie = /(?:N[°º.]?\s*Serie|Nro\.?\s*Serie|Serie|S\/N|Serial\s*(?:N[°º.]?)?)\s*[:\-]?\s*([A-Za-z0-9\-_/]{4,25})/i;
    const matchSerie = texto.match(regexSerie);
    if (matchSerie && matchSerie[1]) {
      serie = matchSerie[1].trim();
    }
  }

  // 7. RUC (extraído si figura en el texto del documento)
  let ruc = "";
  const regexRuc = /(?:R\.?U\.?C\.?|RUC)\s*[:\-]?\s*([12]\d{10})\b/i;
  const matchRuc = texto.match(regexRuc);
  if (matchRuc) {
    ruc = matchRuc[1];
  } else {
    const matchRucGenerico = texto.match(/\b(20\d{9}|10\d{9})\b/);
    if (matchRucGenerico) {
      ruc = matchRucGenerico[1];
    }
  }

  // 8. MONEDA (extraída del PDF)
  let moneda: "USD" | "PEN" | "" = "";
  const tieneUSD = /\b(USD|D[OÓ]LARES|US\$|\$|DOLARES)\b/i.test(texto);
  const tienePEN = /\b(PEN|SOLES|S\/\.?|S\/\s)\b/i.test(texto);
  if (tieneUSD && !tienePEN) {
    moneda = "USD";
  } else if (tienePEN && !tieneUSD) {
    moneda = "PEN";
  } else if (tieneUSD && tienePEN) {
    const totalLine = texto.match(/Total[^\n]*\b(USD|US\$|S\/\.?|PEN)/i);
    if (totalLine) {
      moneda = /USD|US\$/i.test(totalLine[1]) ? "USD" : "PEN";
    } else {
      moneda = "USD";
    }
  }

  // 9. IMPORTES DEL DOCUMENTO PDF:
  // "LO QUE TIENEN QUE SACAR DEL PDF ES TOTAL , IGV Y TOTAL +IGV"
  let subtotal: number | null = null;
  let igv: number | null = null;
  let total: number | null = null;

  // A) TOTAL + IGV (Total final con impuesto)
  const regexTotalMasIgv =
    /(?:TOTAL\s*\+\s*IGV|TOTAL\s*\+IGV|TOTAL\s*CON\s*IGV|TOTAL\s*INC(?:LUIDO)?\s*IGV|PRECIO\s*TOTAL|IMPORTE\s*TOTAL|TOTAL\s+GENERAL)\s*[:\-]?\s*(?:USD|US\$|S\/\.?|PEN|\$)?\s*([\d,.]+)/i;
  const matchTotalMasIgv = texto.match(regexTotalMasIgv);
  if (matchTotalMasIgv) {
    total = parsearImporte(matchTotalMasIgv[1]);
  }

  // B) IGV (Impuesto 18%)
  const regexIGV =
    /(?:I\.?G\.?V\.?|IGV|IMPUESTO)(?:\s*\(?\s*\d{1,2}%\s*\)?)?\s*[:\-]?\s*(?:USD|US\$|S\/\.?|PEN|\$)?\s*([\d,.]+)/i;
  const matchIGV = texto.match(regexIGV);
  if (matchIGV) {
    igv = parsearImporte(matchIGV[1]);
  }

  // C) TOTAL (Subtotal antes de IGV / Valor de Venta)
  const regexSubtotal =
    /(?:SUBTOTAL|SUB-TOTAL|VALOR\s+VENTA|NETO|BASE\s+IMPONIBLE|(?<!\+)\bTOTAL\b(?!\s*[\+]|\s*CON\s*IGV))\s*[:\-]?\s*(?:USD|US\$|S\/\.?|PEN|\$)?\s*([\d,.]+)/i;
  const matchSubtotal = texto.match(regexSubtotal);
  if (matchSubtotal) {
    subtotal = parsearImporte(matchSubtotal[1]);
  }

  // Si no se encontró TOTAL + IGV pero sí TOTAL general
  if (total === null) {
    const regexTotalFallback =
      /(?<!sub[- ]?)\b(?:Total\s+Cotizaci[oó]n|Total|Monto\s+Total)\b\s*[:\-]?\s*(?:USD|US\$|S\/\.?|PEN|\$)?\s*([\d,.]+)/i;
    const matchFallback = texto.match(regexTotalFallback);
    if (matchFallback) {
      const val = parsearImporte(matchFallback[1]);
      if (val !== subtotal) {
        total = val;
      }
    }
  }

  // Deducción matemática asistida si falta alguno
  if (subtotal !== null && igv !== null && total === null) {
    total = Math.round((subtotal + igv) * 100) / 100;
  } else if (subtotal !== null && total !== null && igv === null) {
    igv = Math.round((total - subtotal) * 100) / 100;
  } else if (subtotal === null && total !== null && igv !== null) {
    subtotal = Math.round((total - igv) * 100) / 100;
  }

  // Comprobación de coherencia: Subtotal + IGV === Total (+IGV)
  let coherenciaMontos = true;
  if (subtotal !== null && igv !== null && total !== null) {
    const sumaCalc = Math.round((subtotal + igv) * 100) / 100;
    if (Math.abs(sumaCalc - total) > 0.05) {
      coherenciaMontos = false;
      advertencias.push(
        `Discrepancia en importes del PDF: TOTAL (${subtotal}) + IGV (${igv}) = ${sumaCalc}, pero TOTAL + IGV es ${total}.`
      );
    }
  }

  // 10. CONDICIÓN DE PAGO (si figura en el PDF)
  let condicionPago = "";
  const regexCondicion =
    /(?:Condici[oó]n\s+de\s+pago|Forma\s+de\s+pago|T[eé]rminos\s+de\s+pago|Pago)\s*[:\-]?\s*([^\r\n]{3,60})/i;
  const matchCondicion = texto.match(regexCondicion);
  if (matchCondicion) {
    condicionPago = matchCondicion[1].trim().split(/[.;\n]/)[0].trim();
  }

  // 11. VALIDEZ DE OFERTA (si figura en el PDF)
  let validezOferta = "";
  const regexValidez =
    /(?:Validez\s+de\s+(?:la\s+)?oferta|Validez\s+de\s+cotizaci[oó]n|Validez|Vigencia)\s*[:\-]?\s*([^\r\n]{3,50})/i;
  const matchValidez = texto.match(regexValidez);
  if (matchValidez) {
    validezOferta = matchValidez[1].trim().split(/[.;\n]/)[0].trim();
  }

  return {
    numero,
    fecha,
    cliente,
    ruc,
    equipoModelo,
    serie,
    moneda,
    subtotal,
    igv,
    total,
    condicionPago,
    validezOferta,
    descripcion,
    coherenciaMontos,
    advertencias,
  };
}
