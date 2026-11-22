package com.hmis.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        boolean hasBlankError = false;

        for (var err : ex.getBindingResult().getFieldErrors()) {
            String message = err.getDefaultMessage() != null ? err.getDefaultMessage() : "Invalid field";
            fieldErrors.putIfAbsent(err.getField(), message);
            if (message.toLowerCase().contains("required")) {
                hasBlankError = true;
            }
        }

        String summary = hasBlankError
                ? "Please fill required fields"
                : "Please review the highlighted invalid fields";

        return ResponseEntity.badRequest().body(Map.of(
                "ok", false,
                "message", summary,
                "errors", fieldErrors
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "ok", false,
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "ok", false,
                "message", ex.getMessage()
        ));
    }
}
