package com.criba.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Las rutas del frontend (React Router) se sirven con index.html. */
@Controller
public class SpaForwardController {
    @GetMapping({"/", "/planes", "/registro", "/entrar", "/panel", "/privacidad", "/vacantes/{id}", "/vacantes/{id}/comparar"})
    public String index() {
        return "forward:/index.html";
    }
}
