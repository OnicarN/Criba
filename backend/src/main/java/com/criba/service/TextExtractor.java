package com.criba.service;

import com.criba.web.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Convierte un CV en texto. Solo PDF con texto, TXT y DOCX (RF-20, RF-21, RF-25). */
@Service
public class TextExtractor {
    public static final long MAX_BYTES = 10L * 1024 * 1024;
    /** Por debajo de esto el PDF probablemente es escaneado (RF-21). */
    public static final int MIN_CHARS = 80;
    /** Texto máximo enviado a la IA por CV (RD-02). */
    public static final int MAX_CHARS = 20_000;

    public String extract(MultipartFile file) {
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "TOO_LARGE",
                    "El archivo supera los 10 MB.", "Reduce el tamaño del PDF o guárdalo como TXT.");
        }
        String text;
        try (InputStream in = file.getInputStream()) {
            if (name.endsWith(".pdf")) {
                text = pdf(file.getBytes());
            } else if (name.endsWith(".txt")) {
                text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            } else if (name.endsWith(".docx")) {
                try (XWPFDocument doc = new XWPFDocument(in); XWPFWordExtractor ex = new XWPFWordExtractor(doc)) {
                    text = ex.getText();
                }
            } else {
                throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED",
                        "Este formato no se admite.", "Sube el CV en PDF, TXT o DOCX.");
            }
        } catch (ApiException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "UNREADABLE",
                    "No se pudo abrir el archivo; puede estar dañado o protegido con contraseña.",
                    "Vuelve a exportarlo desde el programa original y súbelo de nuevo.");
        }
        text = text.replace('\u0000', ' ').replaceAll("[ \\t\\x0B\\f\\r]+", " ").replaceAll("\\n{3,}", "\n\n").trim();
        if (text.length() < MIN_CHARS) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "NO_TEXT",
                    "No se pudo leer el texto, puede ser un PDF escaneado.",
                    "Prueba con un PDF con texto seleccionable o con un TXT.");
        }
        return text.length() > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
    }

    private String pdf(byte[] bytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }
}
