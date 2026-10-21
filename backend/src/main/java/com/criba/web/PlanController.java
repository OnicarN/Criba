package com.criba.web;

import com.criba.domain.Plan;
import com.criba.web.Dtos.PlanDto;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlanController {
    @GetMapping("/api/plans")
    public List<PlanDto> plans() {
        return Arrays.stream(Plan.values()).map(PlanDto::of).toList();
    }
}
